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
    
    // Get teacher profile to find department
    $stmt = $db->prepare("SELECT department FROM teachers WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$teacher) {
        sendError('Teacher profile not found', 'not_found', 404);
    }
    
    $department = $teacher['department'];
    
    // Query subjects by department
    // Since we don't have a specific teacher_subjects assignment table yet,
    // we assume a teacher can view/manage all subjects in their department.
    $query = "SELECT 
                id,
                subject_code,
                subject_name,
                credit_hours,
                semester,
                department,
                created_at as assigned_at
              FROM subjects
              WHERE department = :department
              ORDER BY semester, subject_code";
              
    $stmt = $db->prepare($query);
    $stmt->bindParam(':department', $department);
    $stmt->bindParam(':teacher_id', $teacherId, PDO::PARAM_INT);
    $stmt->execute();
    
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format response
    $response = [
        'count' => count($subjects),
        'subjects' => $subjects
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
