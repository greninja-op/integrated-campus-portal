<?php
/**
 * Update Teacher API
 * Updates an existing teacher record
 * Method: PUT
 * Auth: Required (admin role)
 * Body: Teacher ID and fields to update
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
    if (!isset($data['teacher_id']) || empty($data['teacher_id'])) {
        sendError('teacher_id is required', 'validation_error', 400);
    }
    
    $teacherIdToUpdate = trim($data['teacher_id']);
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify teacher exists and get current data (search by teacher_id string, not database id)
    $checkQuery = "SELECT t.*, u.id as user_id, u.username, u.email 
                   FROM teachers t 
                   JOIN users u ON t.user_id = u.id 
                   WHERE t.teacher_id = :teacher_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':teacher_id', $teacherIdToUpdate, PDO::PARAM_STR);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        sendError('Teacher not found', 'not_found', 404);
    }
    
    $existingTeacher = $checkStmt->fetch(PDO::FETCH_ASSOC);
    $userId = $existingTeacher['user_id'];
    $teacherDbId = $existingTeacher['id']; // Store the database ID for updates
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Update user table if username or email changed
        $userUpdates = [];
        $userParams = [':user_id' => $userId];
        
        if (isset($data['username']) && $data['username'] !== $existingTeacher['username']) {
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
        
        if (isset($data['email']) && $data['email'] !== $existingTeacher['email']) {
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
        
        // Update teacher table
        $teacherUpdates = [];
        $teacherParams = [':where_teacher_id' => $teacherDbId];
        
        $teacherFields = [
            'first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'address',
            'joining_date', 'department', 'designation', 'qualification',
            'specialization', 'experience_years', 'profile_image'
        ];
        
        foreach ($teacherFields as $field) {
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
                if ($field === 'joining_date' && !validateDate($value)) {
                    throw new Exception('Invalid joining date format');
                }
                if ($field === 'gender' && !validateGender($value)) {
                    throw new Exception('Invalid gender');
                }
                if ($field === 'phone' && !validatePhone($value)) {
                    throw new Exception('Invalid phone number');
                }
                
                $teacherUpdates[] = "$field = :$field";
                $teacherParams[":$field"] = $value;
            }
        }
        
        // Execute teacher update if there are changes
        if (!empty($teacherUpdates)) {
            $teacherQuery = "UPDATE teachers SET " . implode(', ', $teacherUpdates) . ", updated_at = NOW() WHERE id = :where_teacher_id";
            $teacherStmt = $db->prepare($teacherQuery);
            foreach ($teacherParams as $key => $value) {
                $teacherStmt->bindValue($key, $value);
            }
            $teacherStmt->execute();
        }
        
        // Handle subject assignments if provided
        if (isset($data['assigned_subjects']) && is_array($data['assigned_subjects'])) {
            logError('Updating subjects for teacher: ' . $teacherDbId . ', subjects: ' . json_encode($data['assigned_subjects']));
            
            // Delete existing assignments
            $deleteSubjectsQuery = "DELETE FROM teacher_subjects WHERE teacher_id = :teacher_id";
            $deleteSubjectsStmt = $db->prepare($deleteSubjectsQuery);
            $deleteSubjectsStmt->bindParam(':teacher_id', $teacherDbId, PDO::PARAM_INT);
            $deleteSubjectsStmt->execute();
            
            logError('Deleted existing assignments, affected rows: ' . $deleteSubjectsStmt->rowCount());
            
            // Insert new assignments
            if (!empty($data['assigned_subjects'])) {
                $insertSubjectQuery = "INSERT INTO teacher_subjects (teacher_id, subject_id, is_active) VALUES (:teacher_id, :subject_id, 1)";
                $insertSubjectStmt = $db->prepare($insertSubjectQuery);
                
                foreach ($data['assigned_subjects'] as $subjectId) {
                    $insertSubjectStmt->bindParam(':teacher_id', $teacherDbId, PDO::PARAM_INT);
                    $insertSubjectStmt->bindParam(':subject_id', $subjectId, PDO::PARAM_INT);
                    $insertSubjectStmt->execute();
                    logError('Inserted subject: ' . $subjectId . ' for teacher: ' . $teacherDbId);
                }
            }
        } else {
            logError('No assigned_subjects in request data or not an array');
        }
        
        // Commit transaction
        $db->commit();
        
        // Get updated teacher data
        $getQuery = "SELECT t.*, u.username, u.email, u.status 
                     FROM teachers t 
                     JOIN users u ON t.user_id = u.id 
                     WHERE t.id = :teacher_id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindParam(':teacher_id', $teacherDbId, PDO::PARAM_INT);
        $getStmt->execute();
        $updatedTeacher = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        // Convert types
        if ($updatedTeacher['experience_years']) {
            $updatedTeacher['experience_years'] = (int) $updatedTeacher['experience_years'];
        }
        
        sendSuccess($updatedTeacher);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    logError('Database error in update teacher: ' . $e->getMessage(), [
        'admin_id' => $user['user_id'],
        'teacher_id' => $teacherIdToUpdate ?? null
    ]);
    sendError('An error occurred while updating teacher', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in update teacher: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    // Don't leak exception message in production
    sendError('An unexpected error occurred', 'server_error', 500);
}
