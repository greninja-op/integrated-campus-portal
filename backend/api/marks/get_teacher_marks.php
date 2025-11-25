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

    $semester = $_GET['semester'] ?? null;
    $subjectId = $_GET['subject_id'] ?? null;
    $examType = $_GET['exam_type'] ?? null;

    // Get exam marks entered by this teacher
    $examQuery = "
        SELECT 
            em.id,
            em.student_id,
            s.student_id as roll_no,
            s.first_name,
            s.last_name,
            sub.subject_name,
            sub.subject_code,
            em.semester,
            em.exam_type,
            em.marks_obtained,
            em.max_marks,
            em.exam_date,
            em.created_at
        FROM exam_marks em
        JOIN students s ON em.student_id = s.id
        JOIN subjects sub ON em.subject_id = sub.id
        WHERE em.entered_by = ?
    ";

    $params = [$teacher['id']];

    if ($semester) {
        $examQuery .= " AND em.semester = ?";
        $params[] = $semester;
    }

    if ($subjectId) {
        $examQuery .= " AND em.subject_id = ?";
        $params[] = $subjectId;
    }

    if ($examType) {
        $examQuery .= " AND em.exam_type = ?";
        $params[] = $examType;
    }

    $examQuery .= " ORDER BY em.created_at DESC, s.first_name, s.last_name";

    $stmt = $db->prepare($examQuery);
    $stmt->execute($params);
    $examMarks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get subjects taught by this teacher
    $subjectsQuery = "
        SELECT DISTINCT s.id, s.subject_name, s.subject_code, s.semester
        FROM subjects s
        JOIN teacher_subjects ts ON s.id = ts.subject_id
        WHERE ts.teacher_id = ?
        ORDER BY s.semester, s.subject_name
    ";
    $stmt = $db->prepare($subjectsQuery);
    $stmt->execute([$teacher['id']]);
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => [
            'exam_marks' => $examMarks,
            'subjects' => $subjects,
            'teacher_department' => $teacher['department']
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
