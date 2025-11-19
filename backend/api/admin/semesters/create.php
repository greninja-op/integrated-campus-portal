<?php
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../config/database.php';
require_once '../../../includes/validation.php';

// Verify admin authentication
$user = verifyAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'unauthorized', 'message' => 'Unauthorized']);
    exit();
}

requireRole('admin');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['session_id', 'semester_number', 'start_date', 'end_date'];
$missing = validateRequired($required, (object)$input);

if (!empty($missing)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'Missing required fields',
        'details' => ['missing_fields' => $missing]
    ]);
    exit();
}

$session_id = (int)$input['session_id'];
$semester_number = (int)$input['semester_number'];
$start_date = trim(htmlspecialchars(strip_tags($input['start_date'])));
$end_date = trim(htmlspecialchars(strip_tags($input['end_date'])));

// Validate semester_number is between 1 and 6
if (!validateSemester($semester_number)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'semester_number must be between 1 and 6'
    ]);
    exit();
}

// Validate dates
if (!validateDate($start_date)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'Invalid start_date format. Use YYYY-MM-DD'
    ]);
    exit();
}

if (!validateDate($end_date)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'Invalid end_date format. Use YYYY-MM-DD'
    ]);
    exit();
}

// Validate start_date is before end_date
if (strtotime($start_date) >= strtotime($end_date)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'start_date must be before end_date'
    ]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Validate session_id exists and get session dates
    $query = "SELECT id, start_date, end_date FROM sessions WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $session_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'not_found',
            'message' => 'Session not found'
        ]);
        exit();
    }
    
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $session_start = strtotime($session['start_date']);
    $session_end = strtotime($session['end_date']);
    $semester_start = strtotime($start_date);
    $semester_end = strtotime($end_date);
    
    // Validate dates fall within parent session dates
    if ($semester_start < $session_start || $semester_end > $session_end) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'validation_error',
            'message' => 'Semester dates must fall within the parent session dates',
            'details' => [
                'session_start_date' => $session['start_date'],
                'session_end_date' => $session['end_date']
            ]
        ]);
        exit();
    }
    
    // Generate semester name (e.g., "Semester 1", "Semester 2")
    $semester_name = "Semester " . $semester_number;
    
    // Insert semester record
    $query = "INSERT INTO semesters (session_id, semester_number, semester_name, start_date, end_date, created_at) 
              VALUES (:session_id, :semester_number, :semester_name, :start_date, :end_date, NOW())";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':session_id', $session_id, PDO::PARAM_INT);
    $stmt->bindParam(':semester_number', $semester_number, PDO::PARAM_INT);
    $stmt->bindParam(':semester_name', $semester_name, PDO::PARAM_STR);
    $stmt->bindParam(':start_date', $start_date, PDO::PARAM_STR);
    $stmt->bindParam(':end_date', $end_date, PDO::PARAM_STR);
    
    $stmt->execute();
    
    $semester_id = $db->lastInsertId();
    
    // Retrieve the created semester
    $query = "SELECT id, session_id, semester_number, semester_name, start_date, end_date, is_active, created_at 
              FROM semesters WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $semester_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $semester = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Convert is_active to boolean
    $semester['is_active'] = (bool)$semester['is_active'];
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'data' => $semester
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in create semester: " . $e->getMessage());
    http_response_code(500);
    // Don't leak exception message in production
    echo json_encode([
        'success' => false,
        'error' => 'database_error',
        'message' => 'An error occurred while creating the semester'
    ]);
}
