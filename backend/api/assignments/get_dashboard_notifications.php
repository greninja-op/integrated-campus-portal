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

    // Get pending and rejected assignments (max 4)
    $stmt = $db->prepare("
        SELECT a.id, a.title, a.due_date, s.subject_name, s.subject_code,
            sub.status as submission_status, sub.rejection_reason,
            CASE 
                WHEN sub.status = 'rejected' THEN 'rejected'
                WHEN sub.id IS NULL AND a.due_date >= CURDATE() THEN 'pending'
                ELSE NULL
            END as notification_type
        FROM assignments a
        JOIN subjects s ON a.subject_id = s.id
        LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.student_id = ?
        WHERE a.department = ? AND a.semester = ? AND a.is_active = 1
            AND (
                (sub.status = 'rejected') OR 
                (sub.id IS NULL AND a.due_date >= CURDATE())
            )
        ORDER BY 
            CASE WHEN sub.status = 'rejected' THEN 0 ELSE 1 END,
            a.due_date ASC
        LIMIT 4
    ");
    $stmt->execute([$student['id'], $student['department'], $student['semester']]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total counts
    $stmt = $db->prepare("
        SELECT 
            COUNT(DISTINCT CASE WHEN sub.id IS NULL AND a.due_date >= CURDATE() THEN a.id END) as pending_count,
            COUNT(DISTINCT CASE WHEN sub.status = 'rejected' THEN a.id END) as rejected_count
        FROM assignments a
        LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.student_id = ?
        WHERE a.department = ? AND a.semester = ? AND a.is_active = 1
    ");
    $stmt->execute([$student['id'], $student['department'], $student['semester']]);
    $counts = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => [
            'notifications' => $notifications,
            'pending_count' => (int)$counts['pending_count'],
            'rejected_count' => (int)$counts['rejected_count'],
            'total_count' => (int)$counts['pending_count'] + (int)$counts['rejected_count']
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
