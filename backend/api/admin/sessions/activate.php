<?php
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../config/database.php';
require_once '../../../includes/validation.php';

// Verify admin authentication
$user = verifyAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'unauthorized', 'message' => 'Unauthorized']);
    exit();
}

requireRole('admin');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['session_id'];
$missing = validateRequired($required, (object)$input);

if (!empty($missing)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'Missing required fields',
        'details' => ['missing_fields' => $missing]
    ]);
    exit();
}

$session_id = (int)$input['session_id'];

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Validate session_id exists
    $query = "SELECT id FROM sessions WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $session_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'not_found',
            'message' => 'Session not found'
        ]);
        exit();
    }
    
    // Begin database transaction
    $db->beginTransaction();
    
    try {
        // Set is_active to false for all sessions
        $query = "UPDATE sessions SET is_active = 0";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        // Set is_active to true for specified session
        $query = "UPDATE sessions SET is_active = 1 WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $session_id, PDO::PARAM_INT);
        $stmt->execute();
        
        // Commit transaction
        $db->commit();
        
        // Retrieve the activated session
        $query = "SELECT id, session_name, start_year, end_year, start_date, end_date, is_active, created_at 
                  FROM sessions WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $session_id, PDO::PARAM_INT);
        $stmt->execute();
        
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Convert is_active to boolean
        $session['is_active'] = (bool)$session['is_active'];
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Session activated successfully',
            'data' => $session
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    error_log("Database error in activate session: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'database_error',
        'message' => 'An error occurred while activating the session'
    ]);
}
