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

// Allow both 'teacher' and 'staff' roles
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
    
    $stmt = $db->prepare("SELECT department FROM teachers WHERE user_id = ?");
    $stmt->execute([$userId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit();
    }

    $semester = $_GET['semester'] ?? null;
    $subjectId = $_GET['subject_id'] ?? null;
    $examType = $_GET['exam_type'] ?? null;

    if (!$semester) {
        echo json_encode(['success' => false, 'message' => 'Semester required']);
        exit();
    }

    // Get students with existing marks if any
    if ($examType && in_array($examType, ['class_test', 'internal_1', 'internal_2'])) {
        // For exam marks
        $query = "
            SELECT s.id, s.student_id, s.first_name, s.last_name, s.semester,
                   em.marks_obtained, em.max_marks
            FROM students s
            LEFT JOIN exam_marks em ON s.id = em.student_id 
                AND em.subject_id = ? AND em.exam_type = ?
            WHERE s.department = ? AND s.semester = ?
            ORDER BY s.first_name, s.last_name
        ";
        $stmt = $db->prepare($query);
        $stmt->execute([$subjectId, $examType, $teacher['department'], $semester]);
    } else {
        // For semester marks
        $query = "
            SELECT s.id, s.student_id, s.first_name, s.last_name, s.semester,
                   m.esa_marks, m.isa_marks, m.total_marks, m.letter_grade, m.grade_point, m.credit_points
            FROM students s
            LEFT JOIN marks m ON s.id = m.student_id 
                AND m.subject_id = ? AND m.semester = ?
            WHERE s.department = ? AND s.semester = ?
            ORDER BY s.first_name, s.last_name
        ";
        $stmt = $db->prepare($query);
        $stmt->execute([$subjectId, $semester, $teacher['department'], $semester]);
    }

    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => ['students' => $students]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
