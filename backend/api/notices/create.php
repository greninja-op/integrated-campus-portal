<?php
/**
 * Create Notice API
 * Creates a new notice
 * Method: POST
 * Auth: Required (admin or teacher)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';
require_once '../../includes/validation.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized', 'unauthorized', 401);
}

// Check role (only admin and teacher can create notices)
if (!in_array($user['role'], ['admin', 'teacher'])) {
    sendError('Forbidden', 'forbidden', 403);
}

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    sendError('Invalid JSON data', 'invalid_json', 400);
}

// Validate required fields
$required = ['title', 'content', 'type', 'target_audience'];
$missing = validateRequired($required, $data);

if (!empty($missing)) {
    sendError('Missing required fields: ' . implode(', ', $missing), 'validation_error', 400);
}

$title = trim($data['title']);
$content = trim($data['content']);
$type = trim($data['type']);
$targetAudience = trim($data['target_audience']);
$department = isset($data['department']) && !empty($data['department']) ? trim($data['department']) : null;
$semester = isset($data['semester']) && !empty($data['semester']) ? (int)$data['semester'] : null;
$attachmentUrl = isset($data['attachment_url']) ? trim($data['attachment_url']) : null;

// Validate type
$validTypes = ['general', 'academic', 'exam', 'event', 'holiday'];
if (!in_array($type, $validTypes)) {
    sendError('Invalid notice type', 'invalid_type', 400);
}

// Validate audience
$validAudiences = ['all', 'students', 'teachers', 'staff'];
if (!in_array($targetAudience, $validAudiences)) {
    sendError('Invalid target audience', 'invalid_audience', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "INSERT INTO notices (title, content, type, target_audience, department, semester, attachment_url, created_by) 
              VALUES (:title, :content, :type, :target_audience, :department, :semester, :attachment_url, :created_by)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':content', $content);
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':target_audience', $targetAudience);
    $stmt->bindParam(':department', $department);
    $stmt->bindParam(':semester', $semester);
    $stmt->bindParam(':attachment_url', $attachmentUrl);
    $stmt->bindParam(':created_by', $user['user_id']);
    
    if ($stmt->execute()) {
        $noticeId = $db->lastInsertId();
        sendSuccess(['id' => $noticeId, 'message' => 'Notice created successfully'], 201);
    } else {
        throw new Exception('Failed to create notice');
    }
    
} catch (PDOException $e) {
    logError('Database error: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
} catch (Exception $e) {
    logError('Error: ' . $e->getMessage());
    sendError('Server error', 'server_error', 500);
}
