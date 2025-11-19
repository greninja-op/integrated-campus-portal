<?php
/**
 * CORS Configuration
 * 
 * Handles Cross-Origin Resource Sharing headers
 */

require_once __DIR__ . '/bootstrap.php';

// Security Headers
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");
// header("Content-Security-Policy: default-src 'self'"); // Commented out to avoid breaking frontend dev

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/RateLimiter.php';

// Rate Limiting
try {
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        $rateLimiter = new RateLimiter($db);
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $endpoint = $_SERVER['REQUEST_URI'];
        
        // 100 requests per minute
        if (!$rateLimiter->check($ip, $endpoint, 100, 60)) {
            http_response_code(429);
            echo json_encode(['error' => 'Too Many Requests']);
            exit();
        }
    }
} catch (Exception $e) {
    // Fail open if DB fails for rate limiting, or log it
    error_log("Rate limiter error: " . $e->getMessage());
}

// Allow from any origin in development, specific domains in production
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// In production, you should list specific allowed origins
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:8000'
];

// Allow any localhost origin for development convenience
if (preg_match('/^http:\/\/localhost:\d+$/', $origin)) {
    $allowed_origins[] = $origin;
}

// If we are in development mode (or if origin is in allowed list), allow it
// You can set APP_ENV in .env file
$is_development = getenv('APP_ENV') !== 'production';

if ($is_development || in_array($origin, $allowed_origins)) {
    // If origin is set, use it. Otherwise use a default for tools like Postman
    $allow_origin = $origin ? $origin : '*';
    header("Access-Control-Allow-Origin: $allow_origin");
} else {
    // Default fallback
    header("Access-Control-Allow-Origin: http://localhost:5173");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 3600");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set content type to JSON
header("Content-Type: application/json; charset=UTF-8");
?>
