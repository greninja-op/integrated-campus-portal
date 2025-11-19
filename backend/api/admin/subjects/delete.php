<?php
/**
 * Delete Subject API - Soft delete (set is_active = false)
 * Method: DELETE | Auth: admin
 */
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';

$user = verifyAuth();
if (!$user || $user['role'] !== 'admin') sendError('Forbidden', 'forbidden', 403);

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['subject_id'])) sendError('subject_id required', 'validation_error', 400);

try {
    $subjectId = (int) $data['subject_id'];
    $database = new Database();
    $db = $database->getConnection();
    
    $check = $db->prepare("SELECT subject_code, subject_name FROM subjects WHERE id = :id");
    $check->bindParam(':id', $subjectId, PDO::PARAM_INT);
    $check->execute();
    if ($check->rowCount() === 0) sendError('Subject not found', 'not_found', 404);
    
    $subject = $check->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $db->prepare("UPDATE subjects SET is_active = 0, updated_at = NOW() WHERE id = :id");
    $stmt->bindParam(':id', $subjectId, PDO::PARAM_INT);
    $stmt->execute();
    
    sendSuccess(['deleted' => true, 'subject_code' => $subject['subject_code'], 'subject_name' => $subject['subject_name']]);
} catch (PDOException $e) {
    logError('DB error delete subject: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
}
