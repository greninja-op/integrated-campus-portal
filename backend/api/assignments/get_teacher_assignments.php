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
checkRole($user, ['teacher']);

try {
    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare("SELECT id FROM teachers WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit();
    }

    $subjectId = $_GET['subject_id'] ?? null;

    $query = "
        SELECT a.*, s.subject_name, s.subject_code,
            (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submission_count,
            (SELECT COUNT(*) FROM students WHERE department = a.department AND semester = a.semester) as total_students
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.teacher_id = ? AND a.is_active = 1
    ";
    $params = [$teacher['id']];

    if ($subjectId) {
        $query .= " AND a.subject_id = ?";
        $params[] = $subjectId;
    }

    $query .= " ORDER BY a.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => ['assignments' => $assignments]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
