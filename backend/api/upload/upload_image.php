<?php
/**
 * Upload Image API
 * Handles image file uploads for profiles
 * Method: POST
 * Auth: Required (any role)
 * Body: FormData with 'file' field
 */

// Include required files
require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';
require_once '../../includes/validation.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

try {
    // Check if file was uploaded
    if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
        sendError('No file uploaded', 'no_file', 400);
    }
    
    $file = $_FILES['file'];
    
    // Allowed MIME types
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    // Maximum file size: 5MB
    $maxSize = 5 * 1024 * 1024;
    
    // Validate file upload
    $validation = validateFileUpload($file, $allowedTypes, $maxSize);
    
    if (!$validation['valid']) {
        sendError($validation['message'], 'upload_error', 400);
    }
    
    // Get file extension
    $fileInfo = pathinfo($file['name']);
    $extension = strtolower($fileInfo['extension']);
    
    // Generate unique, safe filename
    // Use random_bytes for better uniqueness and security
    $randomBytes = bin2hex(random_bytes(16));
    $uniqueFilename = $randomBytes . '.' . $extension;
    
    // Define upload directory
    // Ensure this directory is outside the web root or has .htaccess to prevent execution
    $uploadDir = __DIR__ . '/../../uploads/profiles/';
    
    // Create directory if it doesn't exist
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Full path for the file
    $uploadPath = $uploadDir . $uniqueFilename;
    
    // Prevent directory traversal
    $realUploadDir = realpath($uploadDir);
    if ($realUploadDir === false || strpos(realpath(dirname($uploadPath)), $realUploadDir) !== 0) {
         sendError('Invalid upload path', 'upload_error', 400);
    }
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
        sendError('Failed to save file', 'save_failed', 500);
    }
    
    // Return relative path for database storage
    $relativePath = '/uploads/profiles/' . $uniqueFilename;
    
    // Prepare response
    $response = [
        'uploaded' => true,
        'file_path' => $relativePath,
        'filename' => $uniqueFilename,
        'original_name' => $file['name'],
        'file_size' => $file['size'],
        'mime_type' => $file['type']
    ];
    
    sendSuccess($response, 201);
    
} catch (Exception $e) {
    logError('Error in upload_image.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id'] ?? null
    ]);
    sendError('An unexpected error occurred during upload', 'server_error', 500);
}
