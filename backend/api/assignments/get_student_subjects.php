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

    // Get subjects with assignment counts
    $stmt = $db->prepare("
        SELECT s.id, s.subject_name, s.subject_code,
            COUNT(DISTINCT a.id) as total_assignments,
            COUNT(DISTINCT CASE 
                WHEN sub.id IS NULL AND a.due_date >= CURDATE() THEN a.id 
            END) as pending_count,
            COUNT(DISTINCT CASE 
                WHEN sub.status = 'rejected' THEN a.id 
            END) as rejected_count
        FROM subjects s
        LEFT JOIN assignments a ON a.subject_id = s.id 
            AND a.department = ? AND a.semester = ? AND a.is_active = 1
        LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.student_id = ?
        WHERE s.department = ? AND s.semester = ?
        GROUP BY s.id, s.subject_name, s.subject_code
        ORDER BY s.subject_name
    ");
    $stmt->execute([
        $student['department'], 
        $student['semester'], 
        $student['id'],
        $student['department'], 
        $student['semester']
    ]);
    $subjects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => ['subjects' => $subjects]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
