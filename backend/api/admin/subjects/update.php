<?php
/**
 * Update Subject API - Admin updates subject
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
if (!$data || !isset($data['subject_id'])) sendError('subject_id required', 'validation_error', 400);

try {
    $subjectId = (int) $data['subject_id'];
    $database = new Database();
    $db = $database->getConnection();
    
    $check = $db->prepare("SELECT * FROM subjects WHERE id = :id");
    $check->bindParam(':id', $subjectId, PDO::PARAM_INT);
    $check->execute();
    if ($check->rowCount() === 0) sendError('Subject not found', 'not_found', 404);
    
    $updates = [];
    $params = [':id' => $subjectId];
    $fields = ['subject_code', 'subject_name', 'credit_hours', 'department', 'semester', 'description'];
    
    foreach ($fields as $field) {
        if (isset($data[$field])) {
            if ($field === 'semester' && !validateSemester((int)$data[$field])) {
                sendError('Invalid semester', 'invalid_semester', 400);
            }
            $updates[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }
    
    if (!empty($updates)) {
        $query = "UPDATE subjects SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) $stmt->bindValue($key, $value);
        $stmt->execute();
    }
    
    $getStmt = $db->prepare("SELECT * FROM subjects WHERE id = :id");
    $getStmt->bindParam(':id', $subjectId, PDO::PARAM_INT);
    $getStmt->execute();
    $subject = $getStmt->fetch(PDO::FETCH_ASSOC);
    $subject['credit_hours'] = (int) $subject['credit_hours'];
    $subject['semester'] = (int) $subject['semester'];
    $subject['is_active'] = (bool) $subject['is_active'];
    
    sendSuccess($subject);
} catch (PDOException $e) {
    logError('DB error update subject: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
}
