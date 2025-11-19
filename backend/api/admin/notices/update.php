<?php
/**
 * Update Notice API - Admin updates notice
 * Method: PUT | Auth: admin
 */
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';
require_once '../../../includes/validation.php';

$user = verifyAuth();
if (!$user || $user['role'] !== 'admin') sendError('Forbidden', 'forbidden', 403);

$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['notice_id'])) sendError('notice_id required', 'validation_error', 400);

try {
    $noticeId = (int) $data['notice_id'];
    $database = new Database();
    $db = $database->getConnection();
    
    $check = $db->prepare("SELECT id FROM notices WHERE id = :id");
    $check->bindParam(':id', $noticeId, PDO::PARAM_INT);
    $check->execute();
    if ($check->rowCount() === 0) sendError('Notice not found', 'not_found', 404);
    
    $updates = [];
    $params = [':id' => $noticeId];
    
    if (isset($data['title'])) {
        $updates[] = "title = :title";
        $params[':title'] = trim($data['title']);
    }
    if (isset($data['content'])) {
        $updates[] = "content = :content";
        $params[':content'] = trim($data['content']);
    }
    if (isset($data['target_role'])) {
        $role = strtolower(trim($data['target_role']));
        if (!in_array($role, ['student', 'teacher', 'all'])) {
            sendError('Invalid target_role', 'invalid_role', 400);
        }
        $updates[] = "target_role = :target_role";
        $params[':target_role'] = $role;
    }
    if (isset($data['expiry_date'])) {
        if ($data['expiry_date'] && !validateDate($data['expiry_date'])) {
            sendError('Invalid expiry_date', 'invalid_date', 400);
        }
        $updates[] = "expiry_date = :expiry_date";
        $params[':expiry_date'] = $data['expiry_date'];
    }
    
    if (!empty($updates)) {
        $query = "UPDATE notices SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) $stmt->bindValue($key, $value);
        $stmt->execute();
    }
    
    $getStmt = $db->prepare("SELECT * FROM notices WHERE id = :id");
    $getStmt->bindParam(':id', $noticeId, PDO::PARAM_INT);
    $getStmt->execute();
    
    sendSuccess($getStmt->fetch(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    logError('DB error update notice: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
}
