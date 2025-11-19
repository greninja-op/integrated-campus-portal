<?php
/**
 * Get All Study Materials API (Admin)
 * Method: GET
 * Auth: Required (admin)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

$user = verifyAuth();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized access', 'unauthorized', 403);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT m.*, u.username as uploader_name 
              FROM study_materials m 
              JOIN users u ON m.uploaded_by = u.id 
              ORDER BY m.uploaded_at DESC";
              
    $stmt = $db->prepare($query);
    $stmt->execute();
    $materials = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    sendSuccess(['materials' => $materials]);

} catch (Exception $e) {
    sendError($e->getMessage(), 'server_error', 500);
}
