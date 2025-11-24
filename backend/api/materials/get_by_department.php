<?php
/**
 * Get Materials By Department API
 * Method: GET
 * Auth: Required (student, teacher, admin)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized', 'unauthorized', 401);
}

$dept = $_GET['department'] ?? null;
if (!$dept) {
    sendError('Department is required', 'missing_param', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Security check: Students/Teachers can only access their own department
    if ($user['role'] === 'student') {
        $student = getStudentIdFromUserId($user['user_id'], $db); // Returns ID but we need profile
        $stmt = $db->prepare("SELECT department, semester FROM students WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$profile || $profile['department'] !== $dept) {
            sendError('Access denied to other departments', 'forbidden', 403);
        }
    } 
    elseif ($user['role'] === 'teacher') {
        $stmt = $db->prepare("SELECT department FROM teachers WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$profile || $profile['department'] !== $dept) {
            sendError('Access denied to other departments', 'forbidden', 403);
        }
    }

    // Build Query - Students can now see all materials from their department
    $query = "SELECT m.*, u.username as uploader_name 
              FROM study_materials m 
              JOIN users u ON m.uploaded_by = u.id 
              WHERE m.department = :dept
              ORDER BY m.semester DESC, m.uploaded_at DESC";

    $stmt = $db->prepare($query);
    $stmt->bindValue(':dept', $dept);
    $stmt->execute();
    $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    sendSuccess(['materials' => $materials]);

} catch (Exception $e) {
    sendError($e->getMessage(), 'server_error', 500);
}
