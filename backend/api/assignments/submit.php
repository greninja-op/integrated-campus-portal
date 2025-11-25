<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$user = verifyAuth();
checkRole($user, ['student']);

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get student info
    $stmt = $db->prepare("SELECT id FROM students WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit();
    }

    $assignmentId = $_POST['assignment_id'] ?? '';

    if (empty($assignmentId)) {
        echo json_encode(['success' => false, 'message' => 'Assignment ID is required']);
        exit();
    }

    // Check if assignment exists and is not past due date
    $stmt = $db->prepare("SELECT * FROM assignments WHERE id = ? AND is_active = 1");
    $stmt->execute([$assignmentId]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$assignment) {
        echo json_encode(['success' => false, 'message' => 'Assignment not found']);
        exit();
    }

    if (strtotime($assignment['due_date']) < strtotime(date('Y-m-d'))) {
        echo json_encode(['success' => false, 'message' => 'Assignment submission deadline has passed']);
        exit();
    }

    // Handle file upload
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'File upload is required']);
        exit();
    }

    $uploadDir = '../../uploads/submissions/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileName = $_FILES['file']['name'];
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

    if (!in_array($fileExt, $allowedTypes)) {
        echo json_encode(['success' => false, 'message' => 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG']);
        exit();
    }

    $newFileName = 'submission_' . $student['id'] . '_' . $assignmentId . '_' . time() . '.' . $fileExt;
    $filePath = '/uploads/submissions/' . $newFileName;

    if (!move_uploaded_file($_FILES['file']['tmp_name'], $uploadDir . $newFileName)) {
        echo json_encode(['success' => false, 'message' => 'Failed to upload file']);
        exit();
    }

    // Check if already submitted (for resubmission after rejection)
    $stmt = $db->prepare("SELECT id, status FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?");
    $stmt->execute([$assignmentId, $student['id']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // Update existing submission
        $stmt = $db->prepare("
            UPDATE assignment_submissions 
            SET file_path = ?, file_name = ?, submitted_at = NOW(), status = 'submitted', rejection_reason = NULL
            WHERE id = ?
        ");
        $stmt->execute([$filePath, $fileName, $existing['id']]);
    } else {
        // Create new submission
        $stmt = $db->prepare("
            INSERT INTO assignment_submissions (assignment_id, student_id, file_path, file_name)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$assignmentId, $student['id'], $filePath, $fileName]);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Assignment submitted successfully'
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
