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

if ($user['role'] !== 'student') {
    echo json_encode(['success' => false, 'message' => 'Access denied. Student role required.']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $userId = $user['user_id'] ?? $user['id'] ?? null;
    
    $stmt = $db->prepare("SELECT id, semester FROM students WHERE user_id = ?");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit();
    }

    $filterSemester = $_GET['semester'] ?? null;
    $filterExamType = $_GET['exam_type'] ?? null;

    // Get historical marks (previous semesters)
    $query = "
        SELECT 
            em.semester,
            em.exam_type,
            em.marks_obtained,
            em.max_marks,
            em.exam_date,
            sub.subject_name,
            sub.subject_code,
            sub.credit_hours
        FROM exam_marks em
        JOIN subjects sub ON em.subject_id = sub.id
        WHERE em.student_id = ?
            AND em.semester < ?
    ";
    
    $params = [$student['id'], $student['semester']];
    
    if ($filterSemester) {
        $query .= " AND em.semester = ?";
        $params[] = $filterSemester;
    }
    
    if ($filterExamType) {
        $query .= " AND em.exam_type = ?";
        $params[] = $filterExamType;
    }
    
    $query .= " ORDER BY em.semester DESC, em.exam_type, sub.subject_name";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $marks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get available semesters for filtering
    $stmt = $db->prepare("
        SELECT DISTINCT semester 
        FROM exam_marks 
        WHERE student_id = ? AND semester < ?
        ORDER BY semester DESC
    ");
    $stmt->execute([$student['id'], $student['semester']]);
    $availableSemesters = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'success' => true,
        'data' => [
            'marks' => $marks,
            'available_semesters' => $availableSemesters
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
