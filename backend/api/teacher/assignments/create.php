<?php
/**
 * Create Assignment
 */

require_once __DIR__ . '/../../../includes/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../includes/auth.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

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

$teacher_id = $auth['user_id'];

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Sanitize inputs
if (isset($data->title)) $data->title = htmlspecialchars(strip_tags($data->title));
if (isset($data->description)) $data->description = htmlspecialchars(strip_tags($data->description));

// Validate input
if (empty($data->title) || empty($data->description) || empty($data->due_date)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'Title, description, and due date are required'
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
    // Insert assignment
    $query = "INSERT INTO assignments 
              (teacher_id, subject_id, title, description, due_date, max_marks, created_at) 
              VALUES 
              (:teacher_id, :subject_id, :title, :description, :due_date, :max_marks, NOW())";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':teacher_id', $teacher_id);
    $stmt->bindParam(':subject_id', $data->subject_id);
    $stmt->bindParam(':title', $data->title);
    $stmt->bindParam(':description', $data->description);
    $stmt->bindParam(':due_date', $data->due_date);
    $stmt->bindParam(':max_marks', $data->max_marks);
    
    if ($stmt->execute()) {
        $assignment_id = $db->lastInsertId();
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Assignment created successfully',
            'data' => [
                'assignment_id' => $assignment_id
            ]
        ]);
    } else {
        throw new Exception('Failed to create assignment');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'server_error',
        'message' => 'Failed to create assignment: ' . $e->getMessage()
    ]);
}
?>
