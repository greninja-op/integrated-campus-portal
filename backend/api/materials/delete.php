<?php
/**
 * Delete Material API
 * Method: POST
 * Auth: Required (admin, teacher)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

$user = verifyAuth();
if (!$user || !in_array($user['role'], ['admin', 'teacher'])) {
    sendError('Unauthorized', 'unauthorized', 403);
}

$data = json_decode(file_get_contents("php://input"), true);
$materialId = $data['material_id'] ?? null;

if (!$materialId) {
    sendError('Material ID required', 'missing_param', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare("SELECT * FROM study_materials WHERE id = ?");
    $stmt->execute([$materialId]);
    $material = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$material) {
        sendError('Material not found', 'not_found', 404);
    }

    // Teacher Restriction
    if ($user['role'] === 'teacher') {
        if ($material['uploaded_by'] != $user['user_id']) {
            sendError('You can only delete your own uploads', 'forbidden', 403);
        }
    }

    // Delete File
    if (file_exists($material['file_path'])) {
        unlink($material['file_path']);
    }

    // Delete DB Record
    $delStmt = $db->prepare("DELETE FROM study_materials WHERE id = ?");
    $delStmt->execute([$materialId]);

    sendSuccess(['message' => 'Material deleted successfully']);

} catch (Exception $e) {
    sendError($e->getMessage(), 'server_error', 500);
}
