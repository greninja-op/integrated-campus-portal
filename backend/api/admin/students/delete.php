<?php
/**
 * Delete Student API
 * Deletes a student record (CASCADE deletes user)
 * Method: DELETE
 * Auth: Required (admin role)
 * Body: { student_id }
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
    if (!isset($data['student_id']) || empty($data['student_id'])) {
        sendError('student_id is required', 'validation_error', 400);
    }
    
    $studentId = (int) $data['student_id'];
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify student exists and get user_id
    $checkQuery = "SELECT user_id, student_id, first_name, last_name 
                   FROM students 
                   WHERE student_id = :student_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':student_id', $studentId);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        sendError('Student not found', 'not_found', 404);
    }
    
    $student = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $userId = $student['user_id'];
    
    // Delete user (CASCADE will delete student record)
    $deleteQuery = "DELETE FROM users WHERE id = :user_id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    
    if (!$deleteStmt->execute()) {
        sendError('Failed to delete student', 'delete_failed', 500);
    }
    
    // Prepare response
    $response = [
        'deleted' => true,
        'student_id' => $student['student_id'],
        'name' => $student['first_name'] . ' ' . $student['last_name']
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in delete student: ' . $e->getMessage(), [
        'admin_id' => $user['user_id'],
        'student_id' => $studentId ?? null
    ]);
    sendError('An error occurred while deleting student', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in delete student: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
