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
if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit();
}

if (!in_array($user['role'], ['teacher', 'staff'])) {
    echo json_encode(['success' => false, 'message' => 'Access denied. Teacher role required.']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get teacher ID
    $userId = $user['user_id'] ?? $user['id'] ?? null;
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'User ID not found']);
        exit();
    }
    
    $stmt = $db->prepare("SELECT id FROM teachers WHERE user_id = ?");
    $stmt->execute([$userId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true);
    
    $subjectId = $data['subject_id'] ?? null;
    $semester = $data['semester'] ?? null;
    $examType = $data['exam_type'] ?? null;
    $maxMarks = $data['max_marks'] ?? 40;
    $marksData = $data['marks'] ?? [];
    $examDate = $data['exam_date'] ?? date('Y-m-d');

    if (!$subjectId || !$semester || !$examType || empty($marksData)) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit();
    }

    // Insert or update marks for each student
    $stmt = $db->prepare("
        INSERT INTO exam_marks (student_id, subject_id, semester, exam_type, marks_obtained, max_marks, exam_date, entered_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            marks_obtained = VALUES(marks_obtained),
            max_marks = VALUES(max_marks),
            exam_date = VALUES(exam_date),
            updated_at = CURRENT_TIMESTAMP
    ");

    $successCount = 0;
    foreach ($marksData as $studentId => $marks) {
        if ($marks !== null && $marks !== '') {
            $stmt->execute([$studentId, $subjectId, $semester, $examType, $marks, $maxMarks, $examDate, $teacher['id']]);
            $successCount++;
        }
    }

    echo json_encode([
        'success' => true,
        'message' => "Marks entered successfully for $successCount students"
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
