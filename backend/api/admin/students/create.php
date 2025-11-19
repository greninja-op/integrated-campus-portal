<?php
/**
 * Create Student API
 * Creates a new student account with user record
 * Method: POST
 * Auth: Required (admin role)
 * Body: Complete student information including credentials
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
    // Removed 'last_name', 'phone', 'date_of_birth', 'enrollment_date', 'program', 'batch_year' from required to match frontend form
    $required = [
        'username', 'password', 'email', 'first_name',
        'gender', 'semester', 'department'
    ];
    $missing = validateRequired($required, $data);
    
    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 'validation_error', 400, ['missing_fields' => $missing]);
    }
    
    // Extract and validate data
    $username = trim($data['username']);
    $password = $data['password'];
    $email = trim($data['email']);
    $firstName = trim($data['first_name']);
    $lastName = isset($data['last_name']) ? trim($data['last_name']) : '';
    // Default DOB if missing
    $dateOfBirth = isset($data['date_of_birth']) && !empty($data['date_of_birth']) ? trim($data['date_of_birth']) : '2000-01-01';
    $gender = strtolower(trim($data['gender']));
    $phone = isset($data['phone']) ? trim($data['phone']) : null;
    $address = isset($data['address']) ? trim($data['address']) : null;
    $enrollmentDate = isset($data['enrollment_date']) && !empty($data['enrollment_date']) ? trim($data['enrollment_date']) : date('Y-m-d');
    $semester = (int) $data['semester'];
    $department = trim($data['department']);
    $program = isset($data['program']) && !empty($data['program']) ? trim($data['program']) : 'Bachelors';
    $batchYear = isset($data['batch_year']) && !empty($data['batch_year']) ? (int) $data['batch_year'] : (int) date('Y');
    $guardianName = isset($data['guardian_name']) ? trim($data['guardian_name']) : null;
    $guardianPhone = isset($data['guardian_phone']) ? trim($data['guardian_phone']) : null;
    $guardianEmail = isset($data['guardian_email']) ? trim($data['guardian_email']) : null;
    
    // Get student ID from request if provided
    $studentId = isset($data['student_id']) && !empty($data['student_id']) ? trim($data['student_id']) : null;

    // Validate username
    if (!validateUsername($username)) {
        sendError('Invalid username format. Must be 3-50 alphanumeric characters', 'invalid_username', 400);
    }
    
    // Validate password
    $passwordValidation = validatePassword($password);
    if (!$passwordValidation['valid']) {
        sendError($passwordValidation['message'], 'invalid_password', 400);
    }
    
    // Validate email
    if (!validateEmail($email)) {
        sendError('Invalid email format', 'invalid_email', 400);
    }
    
    // Validate phone if provided
    if ($phone && !validatePhone($phone)) {
        sendError('Invalid phone number format', 'invalid_phone', 400);
    }
    
    // Validate dates
    if (!validateDate($dateOfBirth)) {
        sendError('Invalid date of birth format. Use YYYY-MM-DD', 'invalid_date', 400);
    }
    
    if (!validateDate($enrollmentDate)) {
        sendError('Invalid enrollment date format. Use YYYY-MM-DD', 'invalid_date', 400);
    }
    
    // Validate gender
    if (!validateGender($gender)) {
        sendError('Invalid gender. Must be male, female, or other', 'invalid_gender', 400);
    }
    
    // Validate semester
    if (!validateSemester($semester)) {
        sendError('Invalid semester. Must be between 1 and 6', 'invalid_semester', 400);
    }
    
    // Validate batch year
    if (!validateBatchYear($batchYear)) {
        sendError('Invalid batch year', 'invalid_batch_year', 400);
    }
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if username already exists
    if (usernameExists($username, $db)) {
        sendError('Username already exists', 'username_exists', 409);
    }
    
    // Check if email already exists
    if (emailExists($email, $db)) {
        sendError('Email already exists', 'email_exists', 409);
    }
    
    // Get active session
    $session = getActiveSession($db);
    if (!$session) {
        sendError('No active academic session found', 'no_active_session', 404);
    }
    $sessionId = $session['id'];
    
    // Hash password
    // Use PASSWORD_DEFAULT which is currently bcrypt but allows future upgrades
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Generate unique student ID if not provided
    if (empty($studentId)) {
        $studentId = generateUniqueId('STU', $db, 'students', 'student_id');
    } else {
        // Check if exists
        $checkStmt = $db->prepare("SELECT id FROM students WHERE student_id = ?");
        $checkStmt->execute([$studentId]);
        if ($checkStmt->rowCount() > 0) {
            sendError('Student ID already exists', 'student_id_exists', 409);
        }
    }
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Insert user record
        $userQuery = "INSERT INTO users (username, password, email, role, status) 
                      VALUES (:username, :password, :email, 'student', 'active')";
        
        $userStmt = $db->prepare($userQuery);
        $userStmt->bindParam(':username', $username, PDO::PARAM_STR);
        $userStmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
        $userStmt->bindParam(':email', $email, PDO::PARAM_STR);
        
        if (!$userStmt->execute()) {
            throw new Exception('Failed to create user account');
        }
        
        $userId = $db->lastInsertId();
        
        // Insert student record
        $studentQuery = "INSERT INTO students 
                        (user_id, student_id, first_name, last_name, date_of_birth, gender, 
                         phone, address, enrollment_date, session_id, semester, department, 
                         program, batch_year, guardian_name, guardian_phone, guardian_email)
                        VALUES 
                        (:user_id, :student_id, :first_name, :last_name, :date_of_birth, :gender,
                         :phone, :address, :enrollment_date, :session_id, :semester, :department,
                         :program, :batch_year, :guardian_name, :guardian_phone, :guardian_email)";
        
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $studentStmt->bindParam(':student_id', $studentId, PDO::PARAM_STR);
        $studentStmt->bindParam(':first_name', $firstName, PDO::PARAM_STR);
        $studentStmt->bindParam(':last_name', $lastName, PDO::PARAM_STR);
        $studentStmt->bindParam(':date_of_birth', $dateOfBirth, PDO::PARAM_STR);
        $studentStmt->bindParam(':gender', $gender, PDO::PARAM_STR);
        $studentStmt->bindParam(':phone', $phone, PDO::PARAM_STR);
        $studentStmt->bindParam(':address', $address, PDO::PARAM_STR);
        $studentStmt->bindParam(':enrollment_date', $enrollmentDate, PDO::PARAM_STR);
        $studentStmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
        $studentStmt->bindParam(':semester', $semester, PDO::PARAM_INT);
        $studentStmt->bindParam(':department', $department, PDO::PARAM_STR);
        $studentStmt->bindParam(':program', $program, PDO::PARAM_STR);
        $studentStmt->bindParam(':batch_year', $batchYear, PDO::PARAM_INT);
        $studentStmt->bindParam(':guardian_name', $guardianName, PDO::PARAM_STR);
        $studentStmt->bindParam(':guardian_phone', $guardianPhone, PDO::PARAM_STR);
        $studentStmt->bindParam(':guardian_email', $guardianEmail, PDO::PARAM_STR);
        
        if (!$studentStmt->execute()) {
            throw new Exception('Failed to create student record');
        }
        
        $dbStudentId = $db->lastInsertId();
        
        // Commit transaction
        $db->commit();
        
        // Prepare response
        $response = [
            'id' => (int) $dbStudentId,
            'user_id' => (int) $userId,
            'student_id' => $studentId,
            'username' => $username,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'semester' => $semester,
            'department' => $department,
            'program' => $program,
            'batch_year' => $batchYear,
            'created' => true
        ];
        
        sendSuccess($response, 201);
        
    } catch (Exception $e) {
        // Rollback transaction
        $db->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    logError('Database error in create student: ' . $e->getMessage(), [
        'admin_id' => $user['user_id'],
        'username' => $username ?? null
    ]);
    sendError('An error occurred while creating student', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in create student: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    // Don't leak exception message in production
    sendError('An unexpected error occurred', 'server_error', 500);
}
