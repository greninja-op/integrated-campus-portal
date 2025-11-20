<?php
/**
 * Submit Assignment
 * Handles file upload and submission record creation
 */

require_once __DIR__ . '/../../../includes/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../includes/functions.php';

$user = verifyAuth();
if (!$user || $user['role'] !== 'student') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Check if assignment_id is provided
$assignmentId = $_POST['assignment_id'] ?? null;
if (!$assignmentId) {
    sendError('Assignment ID is required', 'missing_param', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $studentId = getStudentIdFromUserId($user['user_id'], $db);

    // Verify assignment exists and is open (due date check?)
    $stmt = $db->prepare("SELECT due_date FROM assignments WHERE id = ?");
    $stmt->execute([$assignmentId]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$assignment) {
        sendError('Assignment not found', 'not_found', 404);
    }

    // Check due date (optional strictness)
    // if (strtotime($assignment['due_date']) < time()) {
    //    sendError('Assignment is past due date', 'past_due', 400);
    // }

    $filePath = null;

    // Handle File Upload
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../../../uploads/assignments/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileInfo = pathinfo($_FILES['file']['name']);
        $ext = strtolower($fileInfo['extension']);
        $allowedExts = ['pdf', 'doc', 'docx', 'zip', 'txt'];

        if (!in_array($ext, $allowedExts)) {
            sendError('Invalid file type. Allowed: pdf, doc, docx, zip, txt', 'invalid_file', 400);
        }

        if ($_FILES['file']['size'] > 10 * 1024 * 1024) { // 10MB
            sendError('File too large. Max 10MB', 'file_too_large', 400);
        }

        // Generate safe filename
        $filename = 'submission_' . $assignmentId . '_' . $studentId . '_' . time() . '.' . $ext;
        $targetPath = $uploadDir . $filename;

        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
            $filePath = 'uploads/assignments/' . $filename;
        } else {
            sendError('Failed to save file', 'upload_failed', 500);
        }
    } else {
        // Maybe text submission or link? For now enforce file or check if file was required.
        // If just updating text...
        // For this implementation, let's assume file is required.
        sendError('File upload is required', 'no_file', 400);
    }

    // Insert or Update Submission
    $query = "INSERT INTO assignment_submissions (assignment_id, student_id, status, file_path, submitted_at)
              VALUES (:aid, :sid, 'submitted', :path, NOW())
              ON DUPLICATE KEY UPDATE
              status = 'submitted', file_path = VALUES(file_path), submitted_at = NOW()";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':aid' => $assignmentId,
        ':sid' => $studentId,
        ':path' => $filePath
    ]);

    sendSuccess(['message' => 'Assignment submitted successfully', 'file_path' => $filePath]);

} catch (Exception $e) {
    logError("Error submitting assignment: " . $e->getMessage());
    sendError('Server error', 'server_error', 500);
}
