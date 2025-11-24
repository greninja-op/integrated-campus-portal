<?php
/**
 * Test Authentication Endpoint
 * Debug endpoint to check if auth is working
 */
require_once '../includes/cors.php';
require_once '../includes/auth.php';
require_once '../includes/functions.php';

// Get the token
$token = getBearerToken();

if (!$token) {
    sendError('No token provided', 'no_token', 401);
}

// Try to verify it
$user = verifyAuth();

if (!$user) {
    sendError('Token verification failed', 'invalid_token', 401);
}

// Success - return user data
sendSuccess([
    'message' => 'Authentication working',
    'user' => $user,
    'token_received' => substr($token, 0, 20) . '...'
]);
?>
