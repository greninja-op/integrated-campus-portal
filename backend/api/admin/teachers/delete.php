<?php
/**
 * Delete Teacher API
 * Deletes a teacher record (CASCADE deletes user)
 * Method: DELETE
 * Auth: Required (admin role)
 * Body: { teacher_id }
 */

// Include required files
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'admin') {
    sendError('Forbidden - This endpoint is only accessible to admins', 'forbidden', 403);
}

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    sendError('Invalid JSON data', 'invalid_json', 400);
}

try {
    // Validate required ID
    if (!isset($data['teacher_id']) || empty($data['teacher_id'])) {
        sendError('teacher_id is required', 'validation_error', 400);
    }
    
    $teacherId = trim($data['teacher_id']);
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify teacher exists and get user_id (search by teacher_id string)
    $checkQuery = "SELECT user_id, teacher_id, first_name, last_name 
                   FROM teachers 
                   WHERE teacher_id = :teacher_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':teacher_id', $teacherId, PDO::PARAM_STR);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        sendError('Teacher not found', 'not_found', 404);
    }
    
    $teacher = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $userId = $teacher['user_id'];
    
    // Delete user (CASCADE will delete teacher record)
    $deleteQuery = "DELETE FROM users WHERE id = :user_id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    
    if (!$deleteStmt->execute()) {
        sendError('Failed to delete teacher', 'delete_failed', 500);
    }
    
    // Prepare response
    $response = [
        'deleted' => true,
        'teacher_id' => $teacher['teacher_id'],
        'name' => $teacher['first_name'] . ' ' . $teacher['last_name']
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in delete teacher: ' . $e->getMessage(), [
        'admin_id' => $user['user_id'],
        'teacher_id' => $teacherId ?? null
    ]);
    sendError('An error occurred while deleting teacher', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in delete teacher: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
