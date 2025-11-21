<?php
/**
 * Create Teacher API
 * Creates a new teacher account with user record
 * Method: POST
 * Auth: Required (admin role)
 * Body: Complete teacher information including credentials
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
    // Removed 'last_name', 'phone', 'date_of_birth', 'joining_date' from required to match frontend form
    $required = [
        'username', 'password', 'email', 'first_name',
        'gender', 'department', 'designation'
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
    $dateOfBirth = isset($data['date_of_birth']) && !empty($data['date_of_birth']) ? trim($data['date_of_birth']) : '1980-01-01';
    $gender = strtolower(trim($data['gender']));
    $phone = isset($data['phone']) ? trim($data['phone']) : null;
    $address = isset($data['address']) ? trim($data['address']) : null;
    $joiningDate = isset($data['joining_date']) && !empty($data['joining_date']) ? trim($data['joining_date']) : date('Y-m-d');
    $department = trim($data['department']);
    $designation = trim($data['designation']);
    $qualification = isset($data['qualification']) ? trim($data['qualification']) : null;
    $specialization = isset($data['specialization']) ? trim($data['specialization']) : null;
    $experienceYears = isset($data['experience_years']) ? (int) $data['experience_years'] : 0;
    $profileImage = isset($data['profile_image']) ? trim($data['profile_image']) : null;
    
    // Check for manual teacher_id
    $manualTeacherId = isset($data['teacher_id']) && !empty(trim($data['teacher_id'])) ? trim($data['teacher_id']) : null;
    
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
    
    // Validate phone only if provided
    if ($phone && !validatePhone($phone)) {
        sendError('Invalid phone number format', 'invalid_phone', 400);
    }
    
    // Validate dates
    if (!validateDate($dateOfBirth)) {
        sendError('Invalid date of birth format. Use YYYY-MM-DD', 'invalid_date', 400);
    }
    
    if (!validateDate($joiningDate)) {
        sendError('Invalid joining date format. Use YYYY-MM-DD', 'invalid_date', 400);
    }
    
    // Validate gender
    if (!validateGender($gender)) {
        sendError('Invalid gender. Must be male, female, or other', 'invalid_gender', 400);
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
    
    // Hash password
    // Use PASSWORD_DEFAULT which is currently bcrypt but allows future upgrades
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Generate unique teacher ID or use manual
    if ($manualTeacherId) {
        // Check if manual ID exists
        $checkIdQuery = "SELECT COUNT(*) as count FROM teachers WHERE teacher_id = :teacher_id";
        $checkIdStmt = $db->prepare($checkIdQuery);
        $checkIdStmt->bindParam(':teacher_id', $manualTeacherId);
        $checkIdStmt->execute();
        if ($checkIdStmt->fetch(PDO::FETCH_ASSOC)['count'] > 0) {
             sendError('Teacher ID already exists', 'duplicate_id', 409);
        }
        $teacherId = $manualTeacherId;
    } else {
        $teacherId = generateUniqueId('TCH', $db, 'teachers', 'teacher_id');
    }
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Insert user record
        $userQuery = "INSERT INTO users (username, password, email, role, status) 
                      VALUES (:username, :password, :email, 'teacher', 'active')";
        
        $userStmt = $db->prepare($userQuery);
        $userStmt->bindParam(':username', $username, PDO::PARAM_STR);
        $userStmt->bindParam(':password', $hashedPassword, PDO::PARAM_STR);
        $userStmt->bindParam(':email', $email, PDO::PARAM_STR);
        
        if (!$userStmt->execute()) {
            throw new Exception('Failed to create user account');
        }
        
        $userId = $db->lastInsertId();
        
        // Insert teacher record
        $teacherQuery = "INSERT INTO teachers 
                        (user_id, teacher_id, first_name, last_name, date_of_birth, gender, 
                         phone, address, joining_date, department, designation, qualification,
                         specialization, experience_years, profile_image)
                        VALUES 
                        (:user_id, :teacher_id, :first_name, :last_name, :date_of_birth, :gender,
                         :phone, :address, :joining_date, :department, :designation, :qualification,
                         :specialization, :experience_years, :profile_image)";
        
        $teacherStmt = $db->prepare($teacherQuery);
        $teacherStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $teacherStmt->bindParam(':teacher_id', $teacherId, PDO::PARAM_STR);
        $teacherStmt->bindParam(':first_name', $firstName, PDO::PARAM_STR);
        $teacherStmt->bindParam(':last_name', $lastName, PDO::PARAM_STR);
        $teacherStmt->bindParam(':date_of_birth', $dateOfBirth, PDO::PARAM_STR);
        $teacherStmt->bindParam(':gender', $gender, PDO::PARAM_STR);
        $teacherStmt->bindParam(':phone', $phone, PDO::PARAM_STR);
        $teacherStmt->bindParam(':address', $address, PDO::PARAM_STR);
        $teacherStmt->bindParam(':joining_date', $joiningDate, PDO::PARAM_STR);
        $teacherStmt->bindParam(':department', $department, PDO::PARAM_STR);
        $teacherStmt->bindParam(':designation', $designation, PDO::PARAM_STR);
        $teacherStmt->bindParam(':qualification', $qualification, PDO::PARAM_STR);
        $teacherStmt->bindParam(':specialization', $specialization, PDO::PARAM_STR);
        $teacherStmt->bindParam(':experience_years', $experienceYears, PDO::PARAM_INT);
        $teacherStmt->bindParam(':profile_image', $profileImage, PDO::PARAM_STR);
        
        if (!$teacherStmt->execute()) {
            throw new Exception('Failed to create teacher record');
        }
        
        $teacherDbId = $db->lastInsertId();
        
        // Handle subject assignments if provided
        if (isset($data['assigned_subjects']) && is_array($data['assigned_subjects']) && !empty($data['assigned_subjects'])) {
            $subjectQuery = "INSERT INTO teacher_subjects (teacher_id, subject_id, is_active) VALUES (:teacher_id, :subject_id, 1)";
            $subjectStmt = $db->prepare($subjectQuery);
            
            foreach ($data['assigned_subjects'] as $subjectId) {
                $subjectStmt->bindParam(':teacher_id', $teacherDbId, PDO::PARAM_INT);
                $subjectStmt->bindParam(':subject_id', $subjectId, PDO::PARAM_INT);
                $subjectStmt->execute();
            }
        }
        
        // Commit transaction
        $db->commit();
        
        // Prepare response
        $response = [
            'user_id' => (int) $userId,
            'teacher_id' => $teacherId,
            'username' => $username,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'department' => $department,
            'designation' => $designation,
            'created' => true
        ];
        
        sendSuccess($response, 201);
        
    } catch (Exception $e) {
        // Rollback transaction
        $db->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    logError('Database error in create teacher: ' . $e->getMessage(), [
        'admin_id' => $user['user_id'],
        'username' => $username ?? null
    ]);
    sendError('An error occurred while creating teacher', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in create teacher: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    // Don't leak exception message in production
    sendError('An unexpected error occurred', 'server_error', 500);
}
