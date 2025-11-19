<?php
/**
 * Send Fee Notification API
 * Sends bulk fee notifications
 * Method: POST
 * Auth: Required (admin role)
 */

require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';
require_once '../../../includes/validation.php';

// Verify authentication
$user = verifyAuth();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized', 'unauthorized', 403);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['fee_id']) || !isset($data['title']) || !isset($data['message'])) {
    sendError('Missing required fields', 'validation_error', 400);
}

$feeId = (int)$data['fee_id'];
$title = trim($data['title']);
$message = trim($data['message']);
$targetDepartment = isset($data['department']) ? trim($data['department']) : null;
$targetSemester = isset($data['semester']) ? (int)$data['semester'] : null;
$targetProgram = isset($data['program']) ? trim($data['program']) : null;

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify fee exists
    $checkStmt = $db->prepare("SELECT id FROM fees WHERE id = ?");
    $checkStmt->execute([$feeId]);
    if ($checkStmt->rowCount() === 0) {
        sendError('Fee not found', 'not_found', 404);
    }
    
    // Insert notification
    $query = "INSERT INTO fee_notifications (fee_id, title, message, target_department, target_semester, target_program, sent_by) 
              VALUES (:fee_id, :title, :message, :dept, :sem, :prog, :sent_by)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':fee_id', $feeId);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':message', $message);
    $stmt->bindParam(':dept', $targetDepartment);
    $stmt->bindParam(':sem', $targetSemester);
    $stmt->bindParam(':prog', $targetProgram);
    $stmt->bindParam(':sent_by', $user['user_id']);
    
    if ($stmt->execute()) {
        // Here you would typically trigger the actual sending (email/SMS)
        // For now, we just record it in the database
        
        sendSuccess(['message' => 'Fee notification sent successfully'], 201);
    } else {
        throw new Exception('Failed to create notification');
    }
    
} catch (Exception $e) {
    logError('Error sending fee notification: ' . $e->getMessage());
    sendError('Server error', 'server_error', 500);
}
