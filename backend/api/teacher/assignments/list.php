<?php
/**
 * List Teacher Assignments
 */

require_once __DIR__ . '/../../../includes/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../includes/auth.php';

// Verify authentication
$auth = verifyAuth();
if (!$auth || $auth['role'] !== 'teacher') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'unauthorized',
        'message' => 'Access denied'
    ]);
    exit();
}

$teacher_id = $auth['user_id'];

// Get database connection
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'server_error',
        'message' => 'Database connection failed'
    ]);
    exit();
}

try {
    // Get teacher's assignments
    $query = "SELECT 
                a.*,
                s.subject_name,
                s.subject_code,
                COUNT(DISTINCT asub.id) as submission_count
              FROM assignments a
              LEFT JOIN subjects s ON a.subject_id = s.id
              LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
              WHERE a.teacher_id = :teacher_id
              GROUP BY a.id
              ORDER BY a.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':teacher_id', $teacher_id);
    $stmt->execute();
    
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $assignments
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'server_error',
        'message' => 'Failed to fetch assignments: ' . $e->getMessage()
    ]);
}
?>
