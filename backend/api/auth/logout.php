<?php
/**
 * Logout Endpoint
 * 
 * Handles user logout (JWT is stateless, so this is mainly for logging)
 */

require_once __DIR__ . '/../../includes/cors.php';
require_once __DIR__ . '/../../includes/auth.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Verify authentication
$user = verifyAuth();

if (!$user) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'unauthorized',
        'message' => 'Not authenticated'
    ]);
    exit();
}

// Log logout (optional - add to database if needed)
// For JWT, client just needs to delete the token, but we blacklist it to be safe
if (isset($user['jti']) && isset($user['exp'])) {
    require_once __DIR__ . '/../../includes/TokenBlacklist.php';
    require_once __DIR__ . '/../../config/database.php';
    
    try {
        $database = new Database();
        $db = $database->getConnection();
        if ($db) {
            $blacklist = new TokenBlacklist($db);
            $blacklist->add($user['jti'], $user['exp']);
        }
    } catch (Exception $e) {
        error_log("Logout blacklist failed: " . $e->getMessage());
        // Continue to send success response to client
    }
}

// Send response
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Logged out successfully'
]);
?>
