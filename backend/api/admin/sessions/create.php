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
$required = ['session_name', 'start_year', 'end_year', 'start_date', 'end_date'];
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

$session_name = htmlspecialchars(strip_tags(trim($input['session_name'])));
$start_year = (int)$input['start_year'];
$end_year = (int)$input['end_year'];
$start_date = trim($input['start_date']);
$end_date = trim($input['end_date']);

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

// Validate years are consistent with dates
$start_date_year = (int)date('Y', strtotime($start_date));
$end_date_year = (int)date('Y', strtotime($end_date));

if ($start_year !== $start_date_year) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'start_year must match the year in start_date'
    ]);
    exit();
}

if ($end_year !== $end_date_year) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'validation_error',
        'message' => 'end_year must match the year in end_date'
    ]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Insert session record with is_active defaulting to false
    $query = "INSERT INTO sessions (session_name, start_year, end_year, start_date, end_date, is_active, created_at) 
              VALUES (:session_name, :start_year, :end_year, :start_date, :end_date, 0, NOW())";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':session_name', $session_name, PDO::PARAM_STR);
    $stmt->bindParam(':start_year', $start_year, PDO::PARAM_INT);
    $stmt->bindParam(':end_year', $end_year, PDO::PARAM_INT);
    $stmt->bindParam(':start_date', $start_date, PDO::PARAM_STR);
    $stmt->bindParam(':end_date', $end_date, PDO::PARAM_STR);
    
    $stmt->execute();
    
    $session_id = $db->lastInsertId();
    
    // Retrieve the created session
    $query = "SELECT id, session_name, start_year, end_year, start_date, end_date, is_active, created_at 
              FROM sessions WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $session_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Convert is_active to boolean
    $session['is_active'] = (bool)$session['is_active'];
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'data' => $session
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in create session: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'database_error',
        'message' => 'An error occurred while creating the session'
    ]);
}
