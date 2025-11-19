<?php
/**
 * Update Student API
 * Updates an existing student record
 * Method: PUT
 * Auth: Required (admin role)
 * Body: Student ID and fields to update
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
    // Validate required ID
    if (!isset($data['student_id']) || empty($data['student_id'])) {
        sendError('student_id is required', 'validation_error', 400);
    }
    
    $studentIdToUpdate = (int) $data['student_id'];
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify student exists and get current data
    $checkQuery = "SELECT s.*, u.id as user_id, u.username, u.email 
                   FROM students s 
                   JOIN users u ON s.user_id = u.id 
                   WHERE s.id = :student_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':student_id', $studentIdToUpdate, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        sendError('Student not found', 'not_found', 404);
    }
    
    $existingStudent = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $userId = $existingStudent['user_id'];
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Update user table if username or email changed
        $userUpdates = [];
        $userParams = [':user_id' => $userId];
        
        if (isset($data['username']) && $data['username'] !== $existingStudent['username']) {
            $username = trim($data['username']);
            if (!validateUsername($username)) {
                throw new Exception('Invalid username format');
            }
            if (usernameExists($username, $db, $userId)) {
                throw new Exception('Username already exists');
            }
            $userUpdates[] = "username = :username";
            $userParams[':username'] = $username;
        }
        
        if (isset($data['email']) && $data['email'] !== $existingStudent['email']) {
            $email = trim($data['email']);
            if (!validateEmail($email)) {
                throw new Exception('Invalid email format');
            }
            if (emailExists($email, $db, $userId)) {
                throw new Exception('Email already exists');
            }
            $userUpdates[] = "email = :email";
            $userParams[':email'] = $email;
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            $passwordValidation = validatePassword($data['password']);
            if (!$passwordValidation['valid']) {
                throw new Exception($passwordValidation['message']);
            }
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
            $userUpdates[] = "password = :password";
            $userParams[':password'] = $hashedPassword;
        }
        
        // Execute user update if there are changes
        if (!empty($userUpdates)) {
            $userQuery = "UPDATE users SET " . implode(', ', $userUpdates) . ", updated_at = NOW() WHERE id = :user_id";
            $userStmt = $db->prepare($userQuery);
            foreach ($userParams as $key => $value) {
                $userStmt->bindValue($key, $value);
            }
            $userStmt->execute();
        }
        
        // Update student table
        $studentUpdates = [];
        $studentParams = [':student_id' => $studentIdToUpdate];
        
        $studentFields = [
            'first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'address',
            'semester', 'department', 'program', 'batch_year',
            'guardian_name', 'guardian_phone', 'guardian_email', 'profile_image'
        ];
        
        foreach ($studentFields as $field) {
            if (isset($data[$field])) {
                $value = $data[$field];
                // Sanitize inputs
                if (is_string($value)) {
                    $value = trim(htmlspecialchars(strip_tags($value)));
                }
                
                // Validate specific fields
                if ($field === 'date_of_birth' && !validateDate($value)) {
                    throw new Exception('Invalid date of birth format');
                }
                if ($field === 'gender' && !validateGender($value)) {
                    throw new Exception('Invalid gender');
                }
                if ($field === 'phone' && !validatePhone($value)) {
                    throw new Exception('Invalid phone number');
                }
                if ($field === 'semester' && !validateSemester((int)$value)) {
                    throw new Exception('Invalid semester');
                }
                if ($field === 'batch_year' && !validateBatchYear((int)$value)) {
                    throw new Exception('Invalid batch year');
                }
                
                $studentUpdates[] = "$field = :$field";
                $studentParams[":$field"] = $value;
            }
        }
        
        // Execute student update if there are changes
        if (!empty($studentUpdates)) {
            $studentQuery = "UPDATE students SET " . implode(', ', $studentUpdates) . ", updated_at = NOW() WHERE id = :student_id";
            $studentStmt = $db->prepare($studentQuery);
            foreach ($studentParams as $key => $value) {
                $studentStmt->bindValue($key, $value);
            }
            $studentStmt->execute();
        }
        
        // Commit transaction
        $db->commit();
        
        // Get updated student data
        $getQuery = "SELECT s.*, u.username, u.email, u.status 
                     FROM students s 
                     JOIN users u ON s.user_id = u.id 
                     WHERE s.id = :student_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':student_id', $studentIdToUpdate, PDO::PARAM_INT);
        $getStmt->execute();
        $updatedStudent = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        // Convert types
        $updatedStudent['semester'] = (int) $updatedStudent['semester'];
        $updatedStudent['batch_year'] = (int) $updatedStudent['batch_year'];
        
        sendSuccess($updatedStudent);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    logError('Database error in update student: ' . $e->getMessage(), [
        'admin_id' => $user['user_id'],
        'student_id' => $studentIdToUpdate ?? null
    ]);
    sendError('An error occurred while updating student', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in update student: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    // Don't leak exception message in production
    sendError('An unexpected error occurred', 'server_error', 500);
}
