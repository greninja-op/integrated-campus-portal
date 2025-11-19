<?php
/**
 * Authentication Helper Functions
 */

require_once __DIR__ . '/../config/jwt.php';

/**
 * Get JWT token from Authorization header
 * 
 * @return string|null Token or null if not found
 */
function getBearerToken() {
    $headers = getallheaders();
    
    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    
    return null;
}

/**
 * Verify user authentication
 * 
 * @return array|false User data or false if not authenticated
 */
function verifyAuth() {
    $token = getBearerToken();
    
    if (!$token) {
        return false;
    }
    
    $payload = verifyJWT($token);
    
    if (!$payload) {
        return false;
    }

    // Check if token is blacklisted
    if (isset($payload['jti'])) {
        require_once __DIR__ . '/../config/database.php';
        require_once __DIR__ . '/TokenBlacklist.php';
        
        try {
            $database = new Database();
            $db = $database->getConnection();
            if ($db) {
                $blacklist = new TokenBlacklist($db);
                if ($blacklist->isBlacklisted($payload['jti'])) {
                    return false;
                }
            }
        } catch (Exception $e) {
            // Fail open or closed? Closed is safer.
            error_log("Blacklist check failed: " . $e->getMessage());
            return false;
        }
    }
    
    return $payload;
}

/**
 * Check if user has required role
 * 
 * @param string $required_role Required role (student, teacher, admin)
 * @return bool True if user has role, false otherwise
 */
function checkRole($required_role) {
    $user = verifyAuth();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized', 'message' => 'Please login to continue']);
        exit();
    }
    
    // Admin can access all endpoints
    if ($user['role'] === 'admin') {
        return true;
    }
    
    if ($user['role'] !== $required_role) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden', 'message' => 'You do not have permission to access this resource']);
        exit();
    }
    
    return true;
}

/**
 * Require specific role (alias for checkRole for backward compatibility)
 * 
 * @param string $required_role Required role (student, teacher, admin)
 * @return bool True if user has role, exits otherwise
 */
function requireRole($required_role) {
    return checkRole($required_role);
}

// Note: sendResponse and sendError functions are defined in functions.php
?>
