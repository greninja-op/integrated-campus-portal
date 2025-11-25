<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../includes/auth.php';

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

    $userId = $user['user_id'] ?? $user['id'] ?? null;
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'User ID not found']);
        exit();
    }
    
    $stmt = $db->prepare("SELECT id, department FROM teachers WHERE user_id = ?");
    $stmt->execute([$userId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit();
    }

    $batchYear = $_GET['batch_year'] ?? null;
    $semester = $_GET['semester'] ?? null;
    $subjectId = $_GET['subject_id'] ?? null;
    $examType = $_GET['exam_type'] ?? null;

    if (!$batchYear || !$semester || !$subjectId || !$examType) {
        echo json_encode(['success' => false, 'message' => 'All filters required']);
        exit();
    }

    // Get marks with student details
    $query = "
        SELECT 
            em.id as mark_id,
            em.marks_obtained,
            em.max_marks,
            em.exam_date,
            em.updated_at,
            s.id as student_id,
            s.student_id as roll_number,
            s.first_name,
            s.last_name,
            s.batch_year,
            s.semester as current_semester
        FROM exam_marks em
        JOIN students s ON em.student_id = s.id
        WHERE s.batch_year = ?
            AND em.semester = ?
            AND em.subject_id = ?
            AND em.exam_type = ?
            AND s.department = ?
            AND em.entered_by = ?
        ORDER BY s.student_id
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$batchYear, $semester, $subjectId, $examType, $teacher['department'], $teacher['id']]);
    $marks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => ['marks' => $marks]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
