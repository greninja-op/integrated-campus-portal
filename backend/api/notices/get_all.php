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
            // Filter by audience
            $whereConditions[] = "(target_audience IN ('all', 'students'))";
            
            // Filter by department (if notice has specific department)
            $whereConditions[] = "(department IS NULL OR department = :department)";
            $params[':department'] = $student['department'];
            
            // Filter by semester (if notice has specific semester)
            $whereConditions[] = "(semester IS NULL OR semester = :semester)";
            $params[':semester'] = $student['semester'];
        } else {
            // Fallback if student record not found (shouldn't happen)
            $whereConditions[] = "(target_audience = 'all')";
        }
    } elseif ($user['role'] === 'teacher') {
        $whereConditions[] = "(target_audience IN ('all', 'teachers', 'staff'))";
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
