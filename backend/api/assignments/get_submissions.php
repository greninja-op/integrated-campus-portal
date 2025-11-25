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

    $assignmentId = $_GET['assignment_id'] ?? null;

    if (!$assignmentId) {
        echo json_encode(['success' => false, 'message' => 'Assignment ID required']);
        exit();
    }

    // Get assignment details
    $stmt = $db->prepare("SELECT * FROM assignments WHERE id = ?");
    $stmt->execute([$assignmentId]);
    $assignment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$assignment) {
        echo json_encode(['success' => false, 'message' => 'Assignment not found']);
        exit();
    }

    // Get all students in that department/semester
    $stmt = $db->prepare("
        SELECT s.id, s.student_id, s.first_name, s.last_name, u.email,
            sub.id as submission_id, sub.file_path, sub.file_name, sub.submitted_at, sub.status, sub.rejection_reason
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN assignment_submissions sub ON sub.student_id = s.id AND sub.assignment_id = ?
        WHERE s.department = ? AND s.semester = ?
        ORDER BY s.first_name, s.last_name
    ");
    $stmt->execute([$assignmentId, $assignment['department'], $assignment['semester']]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $submitted = [];
    $notSubmitted = [];

    foreach ($students as $student) {
        if ($student['submission_id']) {
            $submitted[] = $student;
        } else {
            $notSubmitted[] = $student;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'assignment' => $assignment,
            'submitted' => $submitted,
            'not_submitted' => $notSubmitted,
            'total' => count($students),
            'submitted_count' => count($submitted)
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
