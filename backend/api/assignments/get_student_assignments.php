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
checkRole($user, ['student']);

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get student info
    $stmt = $db->prepare("SELECT id, department, semester FROM students WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit();
    }

    $subjectId = $_GET['subject_id'] ?? null;

    // Get assignments for student's department and semester
    $query = "
        SELECT a.*, s.subject_name, s.subject_code,
            t.first_name as teacher_first_name, t.last_name as teacher_last_name,
            sub.id as submission_id, sub.status as submission_status, 
            sub.submitted_at, sub.rejection_reason, sub.file_path as submission_file,
            CASE 
                WHEN sub.id IS NOT NULL THEN 'submitted'
                WHEN a.due_date < CURDATE() THEN 'overdue'
                ELSE 'pending'
            END as assignment_status
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        JOIN teachers t ON a.teacher_id = t.id
        LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.student_id = ?
        WHERE a.department = ? AND a.semester = ? AND a.is_active = 1
    ";
    $params = [$student['id'], $student['department'], $student['semester']];

    if ($subjectId) {
        $query .= " AND a.subject_id = ?";
        $params[] = $subjectId;
    }

    $query .= " ORDER BY a.due_date ASC, a.created_at DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Categorize assignments
    $pending = [];
    $rejected = [];
    $submitted = [];
    $overdue = [];

    foreach ($assignments as $assignment) {
        if ($assignment['submission_status'] === 'rejected') {
            $rejected[] = $assignment;
        } elseif ($assignment['submission_status'] === 'submitted' || $assignment['submission_status'] === 'accepted') {
            $submitted[] = $assignment;
        } elseif ($assignment['assignment_status'] === 'overdue') {
            $overdue[] = $assignment;
        } else {
            $pending[] = $assignment;
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'pending' => $pending,
            'rejected' => $rejected,
            'submitted' => $submitted,
            'overdue' => $overdue,
            'all' => $assignments
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
