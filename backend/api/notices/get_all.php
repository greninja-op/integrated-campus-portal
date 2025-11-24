<?php
/**
 * Get All Notices API - For all users (filtered by role)
 * Method: GET | Auth: required (any role)
 */
require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

$user = verifyAuth();
if (!$user) sendError('Unauthorized', 'unauthorized', 401);

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Default query parameters
    $params = [];
    $whereConditions = ["is_active = 1", "(expiry_date IS NULL OR expiry_date >= CURDATE())"];
    
    // Role-based filtering
    if ($user['role'] === 'student') {
        // Get student details for filtering
        $studentQuery = "SELECT department, semester FROM students WHERE user_id = :user_id";
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->execute([':user_id' => $user['user_id']]);
        $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($student) {
            // Students see:
            // 1. All general notices (target_audience = 'all')
            // 2. All student notices with NO department (general student notices)
            // 3. Student notices for their department with NO semester (department-wide)
            // 4. Student notices for their department AND semester (individual reminders)
            $whereConditions[] = "(
                (target_audience = 'all')
                OR
                (target_audience = 'students' AND department IS NULL)
                OR
                (target_audience = 'students' AND department = :department AND (semester IS NULL OR semester = :semester))
            )";
            $params[':department'] = $student['department'];
            $params[':semester'] = $student['semester'];
        } else {
            // Fallback if student record not found
            $whereConditions[] = "(target_audience = 'all')";
        }
    } elseif ($user['role'] === 'teacher' || $user['role'] === 'staff') {
        // Get teacher details for department filtering
        $teacherQuery = "SELECT department FROM teachers WHERE user_id = :user_id";
        $teacherStmt = $db->prepare($teacherQuery);
        $teacherStmt->execute([':user_id' => $user['user_id']]);
        $teacher = $teacherStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($teacher) {
            // Teachers see:
            // 1. All general notices (target_audience = 'all' or 'teachers')
            // 2. General student notices (department IS NULL)
            // 3. Department-specific notices for their department (semester IS NULL - excludes individual reminders)
            $whereConditions[] = "(
                (target_audience IN ('all', 'teachers', 'staff')) 
                OR 
                (target_audience = 'students' AND department IS NULL)
                OR
                (target_audience = 'students' AND department = :teacher_dept AND semester IS NULL)
            )";
            $params[':teacher_dept'] = $teacher['department'];
        } else {
            // Fallback if teacher record not found
            $whereConditions[] = "(target_audience IN ('all', 'teachers', 'staff') OR (target_audience = 'students' AND department IS NULL))";
        }
    } else {
        // Admin sees everything
        // No additional filters needed
    }
    
    $whereClause = implode(' AND ', $whereConditions);
    
    $query = "SELECT n.id, n.title, n.content, n.type, n.target_audience, n.department, n.semester, n.attachment_url, n.created_at, n.updated_at,
                     u.username as created_by_name
              FROM notices n
              LEFT JOIN users u ON n.created_by = u.id
              WHERE $whereClause
              ORDER BY n.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    
    $notices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map type to category for frontend compatibility if needed
    foreach ($notices as &$notice) {
        $notice['category'] = $notice['type'];
        $notice['image_url'] = $notice['attachment_url'];
        // Default priority since DB doesn't have it yet
        $notice['priority'] = 'normal';
        // Use username if available, otherwise 'Admin'
        $notice['created_by'] = $notice['created_by_name'] ?? 'Admin';
    }
    
    sendSuccess(['notices' => $notices, 'total' => count($notices)]);
} catch (PDOException $e) {
    logError('DB error get notices: ' . $e->getMessage());
    // Don't leak exception message in production
    sendError('An unexpected error occurred', 'server_error', 500);
}
