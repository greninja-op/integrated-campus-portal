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
checkRole($user, ['teacher']);

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get teacher info
    $stmt = $db->prepare("SELECT id, department FROM teachers WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit();
    }

    $title = $_POST['title'] ?? '';
    $description = $_POST['description'] ?? '';
    $subjectId = $_POST['subject_id'] ?? '';
    $semester = $_POST['semester'] ?? '';
    $dueDate = $_POST['due_date'] ?? '';

    if (empty($title) || empty($subjectId) || empty($semester) || empty($dueDate)) {
        echo json_encode(['success' => false, 'message' => 'Title, subject, semester and due date are required']);
        exit();
    }

    // Handle file upload
    $filePath = null;
    $fileName = null;

    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/assignments/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileName = $_FILES['file']['name'];
        $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

        if (!in_array($fileExt, $allowedTypes)) {
            echo json_encode(['success' => false, 'message' => 'Invalid file type']);
            exit();
        }

        $newFileName = uniqid() . '_' . $fileName;
        $filePath = '/uploads/assignments/' . $newFileName;

        if (!move_uploaded_file($_FILES['file']['tmp_name'], $uploadDir . $newFileName)) {
            echo json_encode(['success' => false, 'message' => 'Failed to upload file']);
            exit();
        }
    }

    $stmt = $db->prepare("
        INSERT INTO assignments (teacher_id, subject_id, department, semester, title, description, file_path, file_name, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $teacher['id'],
        $subjectId,
        $teacher['department'],
        $semester,
        $title,
        $description,
        $filePath,
        $fileName,
        $dueDate
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Assignment created successfully',
        'data' => ['id' => $db->lastInsertId()]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
