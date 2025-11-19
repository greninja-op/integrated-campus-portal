<?php
/**
 * Create Fee API
 * Creates a new fee structure
 * Method: POST
 * Auth: Required (admin role)
 * Body: Fee details including amount, due date, late fine configuration
 */

// Include required files
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';
require_once '../../../includes/validation.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'admin') {
    sendError('Forbidden - This endpoint is only accessible to admins', 'forbidden', 403);
}

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    sendError('Invalid JSON data', 'invalid_json', 400);
}

try {
    // Validate required fields
    $required = ['fee_type', 'fee_name', 'amount', 'due_date'];
    $missing = validateRequired($required, $data);
    
    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 'validation_error', 400, ['missing_fields' => $missing]);
    }
    
    // Extract data
    $feeType = trim(htmlspecialchars(strip_tags($data['fee_type'])));
    $feeName = trim(htmlspecialchars(strip_tags($data['fee_name'])));
    $amount = (float) $data['amount'];
    $dueDate = trim($data['due_date']);
    $semester = isset($data['semester']) && $data['semester'] !== null ? (int) $data['semester'] : null;
    $department = isset($data['department']) ? trim(htmlspecialchars(strip_tags($data['department']))) : null;
    $program = isset($data['program']) ? trim(htmlspecialchars(strip_tags($data['program']))) : null;
    $lateFinePerDay = isset($data['late_fine_per_day']) ? (float) $data['late_fine_per_day'] : 0.00;
    $maxLateFine = isset($data['max_late_fine']) ? (float) $data['max_late_fine']) : 0.00;
    $description = isset($data['description']) ? trim(htmlspecialchars(strip_tags($data['description']))) : null;
    
    // Validate amount
    if ($amount <= 0) {
        sendError('Amount must be greater than 0', 'invalid_amount', 400);
    }
    
    // Validate due date
    if (!validateDate($dueDate)) {
        sendError('Invalid due date format. Use YYYY-MM-DD', 'invalid_date', 400);
    }
    
    // Validate semester if provided
    if ($semester !== null && !validateSemester($semester)) {
        sendError('Invalid semester. Must be between 1 and 6', 'invalid_semester', 400);
    }
    
    // Validate late fines
    if ($lateFinePerDay < 0) {
        sendError('Late fine per day cannot be negative', 'invalid_fine', 400);
    }
    
    if ($maxLateFine < 0) {
        sendError('Max late fine cannot be negative', 'invalid_fine', 400);
    }
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get active session
    $session = getActiveSession($db);
    if (!$session) {
        sendError('No active academic session found', 'no_active_session', 404);
    }
    $sessionId = $session['id'];
    
    // Insert fee
    $query = "INSERT INTO fees 
              (fee_type, fee_name, amount, semester, department, program, session_id, 
               due_date, late_fine_per_day, max_late_fine, description, is_active)
              VALUES 
              (:fee_type, :fee_name, :amount, :semester, :department, :program, :session_id,
               :due_date, :late_fine_per_day, :max_late_fine, :description, 1)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':fee_type', $feeType, PDO::PARAM_STR);
    $stmt->bindParam(':fee_name', $feeName, PDO::PARAM_STR);
    $stmt->bindParam(':amount', $amount);
    $stmt->bindParam(':semester', $semester, PDO::PARAM_INT);
    $stmt->bindParam(':department', $department, PDO::PARAM_STR);
    $stmt->bindParam(':program', $program, PDO::PARAM_STR);
    $stmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
    $stmt->bindParam(':due_date', $dueDate, PDO::PARAM_STR);
    $stmt->bindParam(':late_fine_per_day', $lateFinePerDay);
    $stmt->bindParam(':max_late_fine', $maxLateFine);
    $stmt->bindParam(':description', $description, PDO::PARAM_STR);
    
    if (!$stmt->execute()) {
        sendError('Failed to create fee', 'insert_failed', 500);
    }
    
    $feeId = $db->lastInsertId();
    
    // Prepare response
    $response = [
        'id' => (int) $feeId,
        'fee_type' => $feeType,
        'fee_name' => $feeName,
        'amount' => $amount,
        'semester' => $semester,
        'department' => $department,
        'program' => $program,
        'due_date' => $dueDate,
        'late_fine_per_day' => $lateFinePerDay,
        'max_late_fine' => $maxLateFine,
        'description' => $description,
        'created' => true
    ];
    
    sendSuccess($response, 201);
    
} catch (PDOException $e) {
    logError('Database error in create fee: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An error occurred while creating fee', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in create fee: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
