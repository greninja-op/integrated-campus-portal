<?php
require_once __DIR__ . '/EnvLoader.php';

// Load environment variables
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    EnvLoader::load($envPath);
}

// Set timezone
date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'Asia/Kolkata');

// Error reporting based on environment
if (getenv('APP_ENV') === 'production') {
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Limit request body size (e.g., 10MB)
if (isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 10 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'Payload Too Large']);
    exit();
}

// Generate Request ID
if (!defined('REQUEST_ID')) {
    define('REQUEST_ID', bin2hex(random_bytes(16)));
}
header('X-Request-ID: ' . REQUEST_ID);

// Enforce HTTPS in production
if (getenv('APP_ENV') === 'production') {
    if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
        if (!isset($_SERVER['HTTP_X_FORWARDED_PROTO']) || $_SERVER['HTTP_X_FORWARDED_PROTO'] !== 'https') {
            header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
            exit();
        }
    }
}
