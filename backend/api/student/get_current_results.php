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
    
    $stmt = $db->prepare("SELECT id, semester, department FROM students WHERE user_id = ?");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit();
    }

    // Get all exam types with marks for current semester
    $query = "
        SELECT 
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
            AND em.semester = ?
        ORDER BY em.exam_type, sub.subject_name
    ";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$student['id'], $student['semester']]);
    $marks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group by exam type
    $results = [
        'class_test' => [],
        'internal_1' => [],
        'internal_2' => []
    ];

    foreach ($marks as $mark) {
        $results[$mark['exam_type']][] = $mark;
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'student' => $student,
            'results' => $results
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
