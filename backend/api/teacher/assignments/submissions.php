<?php
/**
 * Get Assignment Submissions
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

$assignment_id = $_GET['assignment_id'] ?? null;

if (!$assignment_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'Assignment ID is required'
    ]);
    exit();
}

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
    // Get all students enrolled in the subject
    $query = "SELECT 
                s.id as student_id,
                s.student_id as roll_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                asub.id as submission_id,
                asub.status,
                asub.submitted_at,
                asub.marks,
                asub.file_path
              FROM students s
              CROSS JOIN assignments a
              LEFT JOIN assignment_submissions asub ON s.id = asub.student_id AND a.id = asub.assignment_id
              WHERE a.id = :assignment_id AND a.teacher_id = :teacher_id
              ORDER BY s.student_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':assignment_id', $assignment_id);
    $stmt->bindParam(':teacher_id', $auth['user_id']);
    $stmt->execute();
    
    $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add default status for students who haven't submitted
    foreach ($submissions as &$submission) {
        if (!$submission['submission_id']) {
            $submission['status'] = 'not_submitted';
            $submission['submitted_at'] = null;
            $submission['marks'] = null;
        }
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $submissions
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'server_error',
        'message' => 'Failed to fetch submissions: ' . $e->getMessage()
    ]);
}
?>
