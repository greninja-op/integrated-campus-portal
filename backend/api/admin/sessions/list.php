<?php
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../config/database.php';

// Verify admin authentication
$user = verifyAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'unauthorized', 'message' => 'Unauthorized']);
    exit();
}

requireRole('admin');

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Query sessions table ordered by start_year descending
    $query = "SELECT id, session_name, start_year, end_year, start_date, end_date, is_active, created_at 
              FROM sessions 
              ORDER BY start_year DESC, start_date DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert is_active to boolean for each session
    foreach ($sessions as &$session) {
        $session['is_active'] = (bool)$session['is_active'];
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $sessions
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in list sessions: " . $e->getMessage());
    http_response_code(500);
    // Don't leak exception message in production
    echo json_encode([
        'success' => false,
        'error' => 'database_error',
        'message' => 'An error occurred while retrieving sessions'
    ]);
}
