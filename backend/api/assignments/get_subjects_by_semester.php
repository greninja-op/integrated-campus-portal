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
checkRole($user, ['teacher', 'staff']);

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

    $semester = $_GET['semester'] ?? null;

    if (!$semester) {
        echo json_encode(['success' => false, 'message' => 'Semester is required']);
        exit();
    }

    // Get subjects assigned to this teacher for the specified semester
    $stmt = $db->prepare("
        SELECT s.id, s.subject_name, s.subject_code, s.semester
        FROM subjects s
        JOIN teacher_subjects ts ON s.id = ts.subject_id
        WHERE ts.teacher_id = ? AND s.semester = ? AND s.department = ?
        ORDER BY s.subject_name
    ");
    $stmt->execute([$teacher['id'], $semester, $teacher['department']]);
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => ['subjects' => $subjects]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
