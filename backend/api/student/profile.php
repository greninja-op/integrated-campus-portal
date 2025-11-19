<?php
/**
 * Get Student Profile
 */

require_once __DIR__ . '/../../includes/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/auth.php';

// Verify authentication
$auth = verifyAuth();
if (!$auth || $auth['role'] !== 'student') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'unauthorized',
        'message' => 'Access denied'
    ]);
    exit();
}

$user_id = $auth['user_id'];

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
    // Get student profile
    $query = "SELECT 
                s.*,
                u.email,
                u.username
              FROM students s
              JOIN users u ON s.user_id = u.id
              WHERE s.user_id = :user_id
              LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'not_found',
            'message' => 'Student profile not found'
        ]);
        exit();
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $student
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'server_error',
        'message' => 'Failed to fetch profile: ' . $e->getMessage()
    ]);
}
?>
