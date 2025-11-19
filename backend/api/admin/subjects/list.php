<?php
/**
 * List Subjects API - Get all subjects with filters
 * Method: GET | Auth: admin
 */
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';

$user = verifyAuth();
if (!$user) sendError('Unauthorized', 'unauthorized', 401);
// Allow admin, teacher, and student to view subjects
// if (!$user || $user['role'] !== 'admin') sendError('Forbidden', 'forbidden', 403);

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $semester = isset($_GET['semester']) ? (int) $_GET['semester'] : null;
    $department = isset($_GET['department']) ? trim($_GET['department']) : null;
    $isActive = isset($_GET['is_active']) ? ($_GET['is_active'] === 'true' || $_GET['is_active'] === '1') : null;
    
    $query = "SELECT s.*, 
              (SELECT CONCAT(t.first_name, ' ', t.last_name) 
               FROM teachers t 
               WHERE t.department = s.department 
               LIMIT 1) as teacher 
              FROM subjects s WHERE 1=1";
    $params = [];
    
    if ($semester !== null) {
        $query .= " AND s.semester = :semester";
        $params[':semester'] = $semester;
    }
    if ($department !== null) {
        $query .= " AND (s.department IS NULL OR s.department = :department)";
        $params[':department'] = $department;
    }
    if ($isActive !== null) {
        $query .= " AND s.is_active = :is_active";
        $params[':is_active'] = $isActive ? 1 : 0;
    }
    
    $query .= " ORDER BY s.semester, s.subject_code";
    
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) $stmt->bindValue($key, $value);
    $stmt->execute();
    
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($subjects as &$subject) {
        $subject['credit_hours'] = (int) $subject['credit_hours'];
        $subject['semester'] = (int) $subject['semester'];
        $subject['is_active'] = (bool) $subject['is_active'];
    }
    
    sendSuccess(['subjects' => $subjects, 'total' => count($subjects)]);
} catch (PDOException $e) {
    logError('DB error list subjects: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
}
