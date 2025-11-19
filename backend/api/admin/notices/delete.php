<?php
/**
 * Delete Notice API - Soft delete
 * Method: DELETE | Auth: admin
 */
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';

$user = verifyAuth();
if (!$user || $user['role'] !== 'admin') sendError('Forbidden', 'forbidden', 403);

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['notice_id'])) sendError('notice_id required', 'validation_error', 400);

try {
    $noticeId = (int) $data['notice_id'];
    $database = new Database();
    $db = $database->getConnection();
    
    $check = $db->prepare("SELECT title FROM notices WHERE id = :id");
    $check->bindParam(':id', $noticeId, PDO::PARAM_INT);
    $check->execute();
    if ($check->rowCount() === 0) sendError('Notice not found', 'not_found', 404);
    
    $notice = $check->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $db->prepare("UPDATE notices SET is_active = 0, updated_at = NOW() WHERE id = :id");
    $stmt->bindParam(':id', $noticeId, PDO::PARAM_INT);
    $stmt->execute();
    
    sendSuccess(['deleted' => true, 'notice_id' => $noticeId, 'title' => $notice['title']]);
} catch (PDOException $e) {
    logError('DB error delete notice: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
}
