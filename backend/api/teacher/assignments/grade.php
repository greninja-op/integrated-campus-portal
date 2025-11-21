<?php
/**
 * Grade Assignment Submission
 * Updates marks and feedback for a student submission
 */

require_once __DIR__ . '/../../../includes/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../includes/auth.php';

// Verify authentication
$auth = verifyAuth();
if (!$auth || $auth['role'] !== 'teacher') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'unauthorized',
        'message' => 'Access denied'
    ]);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if (empty($data->submission_id) || !isset($data->marks)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'Submission ID and Marks are required'
    ]);
    exit();
}

$submission_id = (int) $data->submission_id;
$marks = (int) $data->marks;
$feedback = isset($data->feedback) ? trim($data->feedback) : null;

// Get database connection
$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'server_error',
        'message' => 'Database connection failed'
    ]);
    exit();
}

try {
    // Verify submission exists and belongs to an assignment created by this teacher
    $checkQuery = "SELECT asub.id, a.max_marks
                   FROM assignment_submissions asub
                   JOIN assignments a ON asub.assignment_id = a.id
                   WHERE asub.id = :submission_id AND a.teacher_id = :teacher_id";

    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':submission_id', $submission_id);
    $checkStmt->bindParam(':teacher_id', $auth['user_id']);
    $checkStmt->execute();

    if ($checkStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'not_found',
            'message' => 'Submission not found or you do not have permission to grade it'
        ]);
        exit();
    }

    $submission = $checkStmt->fetch(PDO::FETCH_ASSOC);

    // Validate marks against max marks
    if ($marks < 0 || $marks > $submission['max_marks']) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'validation_error',
            'message' => "Marks must be between 0 and " . $submission['max_marks']
        ]);
        exit();
    }

    // Update marks and status
    $updateQuery = "UPDATE assignment_submissions
                    SET marks = :marks,
                        feedback = :feedback,
                        status = 'graded',
                        updated_at = NOW()
                    WHERE id = :submission_id";

    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':marks', $marks);
    $updateStmt->bindParam(':feedback', $feedback);
    $updateStmt->bindParam(':submission_id', $submission_id);

    if ($updateStmt->execute()) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Submission graded successfully'
        ]);
    } else {
        throw new Exception('Failed to update submission');
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'server_error',
        'message' => 'Error grading submission: ' . $e->getMessage()
    ]);
}
?>
