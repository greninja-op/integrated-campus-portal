<?php
/**
 * Delete Notice API
 * Deletes a notice
 * Method: POST
 * Auth: Required (admin or teacher)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized', 'unauthorized', 401);
}

// Check role (only admin and teacher can delete notices)
if (!in_array($user['role'], ['admin', 'teacher'])) {
    sendError('Forbidden', 'forbidden', 403);
}

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id'])) {
    sendError('Missing notice ID', 'missing_id', 400);
}

$noticeId = (int)$data['id'];

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if notice exists and user has permission to delete it
    // Admin can delete any notice. Teacher can only delete their own.
    $checkQuery = "SELECT created_by FROM notices WHERE id = :id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':id', $noticeId);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        sendError('Notice not found', 'not_found', 404);
    }
    
    $notice = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user['role'] === 'teacher' && $notice['created_by'] != $user['user_id']) {
        sendError('You can only delete your own notices', 'forbidden', 403);
    }
    
    // Delete notice
    $query = "DELETE FROM notices WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $noticeId);
    
    if ($stmt->execute()) {
        sendSuccess(['message' => 'Notice deleted successfully']);
    } else {
        throw new Exception('Failed to delete notice');
    }
    
} catch (PDOException $e) {
    logError('Database error: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
} catch (Exception $e) {
    logError('Error: ' . $e->getMessage());
    sendError('Server error', 'server_error', 500);
}
