<?php
/**
 * Get Assigned Subjects API
 * Returns list of subjects assigned to the logged-in teacher
 * Method: GET
 * Auth: Required (teacher role)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'teacher') {
    sendError('Forbidden - This endpoint is only accessible to teachers', 'forbidden', 403);
}

try {
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get teacher ID from teachers table
    $teacherQuery = "SELECT id, department FROM teachers WHERE user_id = :user_id";
    $teacherStmt = $db->prepare($teacherQuery);
    $teacherStmt->bindParam(':user_id', $user['user_id'], PDO::PARAM_INT);
    $teacherStmt->execute();
    
    if ($teacherStmt->rowCount() === 0) {
        sendError('Teacher profile not found', 'not_found', 404);
    }
    
    $teacher = $teacherStmt->fetch(PDO::FETCH_ASSOC);
    $teacherId = $teacher['id'];
    $department = $teacher['department'];
    
    // Get semester filter if provided
    $semester = isset($_GET['semester']) ? (int)$_GET['semester'] : null;
    
    // Query only subjects assigned to this teacher
    $query = "SELECT 
                s.id,
                s.subject_code,
                s.subject_name,
                s.credit_hours,
                s.semester,
                s.department,
                ts.created_at as assigned_at
              FROM subjects s
              JOIN teacher_subjects ts ON s.id = ts.subject_id
              WHERE ts.teacher_id = :teacher_id 
              AND ts.is_active = 1";
    
    if ($semester) {
        $query .= " AND s.semester = :semester";
    }
    
    $query .= " ORDER BY s.semester, s.subject_code";
              
    $stmt = $db->prepare($query);
    $stmt->bindParam(':teacher_id', $teacherId, PDO::PARAM_INT);
    
    if ($semester) {
        $stmt->bindParam(':semester', $semester, PDO::PARAM_INT);
    }
    
    $stmt->execute();
    
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format response
    $response = [
        'count' => count($subjects),
        'subjects' => $subjects,
        'teacher_id' => $teacherId,
        'department' => $department
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in get_assigned_subjects.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An error occurred while fetching assigned subjects', 'database_error', 500);
} catch (Exception $e) {
    sendError('An unexpected error occurred', 'server_error', 500);
}
