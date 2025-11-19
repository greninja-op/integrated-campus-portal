<?php
/**
 * Create Notice API - Admin creates notice
 * Method: POST | Auth: admin
 */
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';
require_once '../../../includes/validation.php';

$user = verifyAuth();
if (!$user || $user['role'] !== 'admin') sendError('Forbidden', 'forbidden', 403);

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) sendError('Invalid JSON', 'invalid_json', 400);

try {
    $required = ['title', 'content', 'target_role'];
    $missing = validateRequired($required, $data);
    if (!empty($missing)) sendError('Missing: ' . implode(', ', $missing), 'validation_error', 400);
    
    $title = htmlspecialchars(strip_tags(trim($data['title'])));
    $content = htmlspecialchars(strip_tags(trim($data['content'])));
    $targetRole = strtolower(trim($data['target_role']));
    $expiryDate = isset($data['expiry_date']) ? trim($data['expiry_date']) : null;
    
    $validRoles = ['student', 'teacher', 'all'];
    if (!in_array($targetRole, $validRoles)) {
        sendError('target_role must be: student, teacher, or all', 'invalid_role', 400);
    }
    
    if ($expiryDate && !validateDate($expiryDate)) {
        sendError('Invalid expiry_date format. Use YYYY-MM-DD', 'invalid_date', 400);
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "INSERT INTO notices (title, content, target_role, expiry_date, is_active, created_by)
              VALUES (:title, :content, :target_role, :expiry_date, 1, :created_by)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':content', $content);
    $stmt->bindParam(':target_role', $targetRole);
    $stmt->bindParam(':expiry_date', $expiryDate);
    $stmt->bindParam(':created_by', $user['user_id'], PDO::PARAM_INT);
    $stmt->execute();
    
    sendSuccess([
        'id' => (int) $db->lastInsertId(),
        'title' => $title,
        'content' => $content,
        'target_role' => $targetRole,
        'expiry_date' => $expiryDate,
        'created' => true
    ], 201);
} catch (PDOException $e) {
    logError('DB error create notice: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
}
