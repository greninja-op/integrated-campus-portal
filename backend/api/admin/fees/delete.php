<?php
/**
 * Delete Fee API
 * Soft deletes a fee structure (sets is_active = false)
 * Method: DELETE
 * Auth: Required (admin role)
 * Body: { fee_id }
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
    if (!isset($data['fee_id']) || empty($data['fee_id'])) {
        sendError('fee_id is required', 'validation_error', 400);
    }
    
    $feeId = (int) $data['fee_id'];
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify fee exists
    $checkQuery = "SELECT fee_name FROM fees WHERE id = :fee_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':fee_id', $feeId, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        sendError('Fee not found', 'not_found', 404);
    }
    
    $fee = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    // Soft delete (set is_active = false)
    $deleteQuery = "UPDATE fees SET is_active = 0, updated_at = NOW() WHERE id = :fee_id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(':fee_id', $feeId, PDO::PARAM_INT);
    
    if (!$deleteStmt->execute()) {
        sendError('Failed to delete fee', 'delete_failed', 500);
    }
    
    // Prepare response
    $response = [
        'deleted' => true,
        'fee_id' => $feeId,
        'fee_name' => $fee['fee_name']
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in delete fee: ' . $e->getMessage(), [
        'admin_id' => $user['user_id'],
        'fee_id' => $feeId ?? null
    ]);
    sendError('An error occurred while deleting fee', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in delete fee: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
