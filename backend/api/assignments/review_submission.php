<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$user = verifyAuth();
checkRole($user, ['teacher']);

try {
    $database = new Database();
    $db = $database->getConnection();

    $data = json_decode(file_get_contents('php://input'), true);

    $submissionId = $data['submission_id'] ?? null;
    $action = $data['action'] ?? null; // 'accept' or 'reject'
    $reason = $data['reason'] ?? null;

    if (!$submissionId || !$action) {
        echo json_encode(['success' => false, 'message' => 'Submission ID and action required']);
        exit();
    }

    $stmt = $db->prepare("SELECT id FROM teachers WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    $status = $action === 'accept' ? 'accepted' : 'rejected';

    $stmt = $db->prepare("
        UPDATE assignment_submissions 
        SET status = ?, rejection_reason = ?, reviewed_at = NOW(), reviewed_by = ?
        WHERE id = ?
    ");
    $stmt->execute([$status, $reason, $teacher['id'], $submissionId]);

    echo json_encode([
        'success' => true,
        'message' => $action === 'accept' ? 'Submission accepted' : 'Submission rejected'
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
