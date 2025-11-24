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
    $examType = $_POST['examType'] ?? null;
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

    // Check for duplicates (question papers only)
    if ($type === 'question_papers') {
        $checkStmt = $db->prepare("SELECT id, file_name, file_path FROM study_materials WHERE department = ? AND semester = ? AND subject = ? AND material_type = ? AND year = ? AND exam_type = ?");
        $checkStmt->execute([$department, $semester, $subject, $type, $year, $examType]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Check if replace flag is set
            $replace = isset($_POST['replace']) && $_POST['replace'] === 'true';
            
            if (!$replace) {
                // Return warning with existing file info
                sendError('A question paper already exists for this year and subject. Set replace=true to overwrite.', 'duplicate_exists', 409, [
                    'existing_file' => $existing['file_name'],
                    'existing_id' => $existing['id']
                ]);
            }
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
    $uploadDir = "../../uploads/materials/$department/semester-$semester/$type/$subDir/";
    
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileName = time() . '_' . basename($file['name']);
    $targetPath = $uploadDir . $fileName;
    $publicUrl = "http://localhost:8080/uploads/materials/$department/semester-$semester/$type/$subDir/$fileName";

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        // If replacing existing question paper
        if ($type === 'question_papers' && isset($existing) && isset($_POST['replace']) && $_POST['replace'] === 'true') {
            // Delete old file
            if (file_exists($existing['file_path'])) {
                unlink($existing['file_path']);
            }
            
            // Update existing record
            $updateStmt = $db->prepare("UPDATE study_materials SET file_name = ?, file_path = ?, file_url = ?, file_size = ?, description = ?, uploaded_by = ?, uploaded_at = NOW() WHERE id = ?");
            $updateStmt->execute([$fileName, $targetPath, $publicUrl, $file['size'], $description, $user['user_id'], $existing['id']]);
            
            sendSuccess(['message' => 'Question paper replaced successfully']);
        } else {
            // Insert new record
            $stmt = $db->prepare("INSERT INTO study_materials (department, semester, subject, material_type, unit, year, exam_type, description, file_name, file_path, file_url, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $department, $semester, $subject, $type, $unit, $year, $examType,
                $description, $fileName, $targetPath, $publicUrl, $file['size'], $user['user_id']
            ]);
            
            sendSuccess(['message' => 'Material uploaded successfully']);
        }
    } else {
        sendError('Failed to save file', 'server_error', 500);
    }

} catch (Exception $e) {
    sendError($e->getMessage(), 'server_error', 500);
}
