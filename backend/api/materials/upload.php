<?php
/**
 * Upload Material API
 * Method: POST
 * Auth: Required (admin, teacher)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

$user = verifyAuth();
if (!$user || !in_array($user['role'], ['admin', 'teacher'])) {
    sendError('Unauthorized', 'unauthorized', 403);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 'method_not_allowed', 405);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Inputs
    $department = $_POST['department'] ?? '';
    $semester = $_POST['semester'] ?? '';
    $subject = $_POST['subject'] ?? '';
    $type = $_POST['materialType'] ?? 'notes';
    $unit = $_POST['unit'] ?? null;
    $year = $_POST['year'] ?? null;
    $description = $_POST['description'] ?? '';
    
    // Teacher Restriction: Can only upload for own department
    if ($user['role'] === 'teacher') {
        $stmt = $db->prepare("SELECT department FROM teachers WHERE user_id = ?");
        $stmt->execute([$user['user_id']]);
        $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($teacher['department'] !== $department) {
            sendError('You can only upload for your own department', 'forbidden', 403);
        }
    }

    // File Handling
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        sendError('File upload failed', 'upload_error', 400);
    }

    $file = $_FILES['file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($ext !== 'pdf') {
        sendError('Only PDF files are allowed', 'invalid_file', 400);
    }

    // Create Directory: uploads/materials/{dept}/semester-{sem}/{type}/{unit_or_year}/
    $subDir = $type === 'notes' ? $unit : $year;
    $uploadDir = "../../../uploads/materials/$department/semester-$semester/$type/$subDir/";
    
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileName = time() . '_' . basename($file['name']);
    $targetPath = $uploadDir . $fileName;
    $publicUrl = "/uploads/materials/$department/semester-$semester/$type/$subDir/$fileName";

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $stmt = $db->prepare("INSERT INTO study_materials (department, semester, subject, material_type, unit, year, description, file_name, file_path, file_url, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $department, $semester, $subject, $type, $unit, $year, 
            $description, $fileName, $targetPath, $publicUrl, $file['size'], $user['user_id']
        ]);
        
        sendSuccess(['message' => 'Material uploaded successfully']);
    } else {
        sendError('Failed to save file', 'server_error', 500);
    }

} catch (Exception $e) {
    sendError($e->getMessage(), 'server_error', 500);
}
