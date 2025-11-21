<?php
/**
 * Get Teacher Profile API
 * Returns the authenticated teacher's profile information
 * Method: GET
 * Auth: Required (teacher role)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'teacher' && $user['role'] !== 'staff') {
    sendError('Forbidden - This endpoint is only accessible to teachers', 'forbidden', 403);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get teacher profile with user data
    $query = "SELECT t.*, u.username, u.email, u.status, u.last_login
              FROM teachers t
              JOIN users u ON t.user_id = u.id
              WHERE t.user_id = :user_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['user_id'], PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        sendError('Teacher profile not found', 'not_found', 404);
    }
    
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Convert numeric fields
    if ($teacher['experience_years']) {
        $teacher['experience_years'] = (int) $teacher['experience_years'];
    }
    
    // Get assigned subjects
    $subjectsQuery = "SELECT s.id, s.subject_code, s.subject_name, s.credit_hours, s.semester
                      FROM subjects s
                      JOIN teacher_subjects ts ON s.id = ts.subject_id
                      WHERE ts.teacher_id = :teacher_id AND ts.is_active = 1";
    
    $subjectsStmt = $db->prepare($subjectsQuery);
    $subjectsStmt->bindParam(':teacher_id', $teacher['id'], PDO::PARAM_INT);
    $subjectsStmt->execute();
    
    $teacher['assigned_subjects'] = $subjectsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    sendSuccess($teacher);
    
} catch (PDOException $e) {
    logError('Database error in get teacher profile: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An error occurred while fetching profile', 'database_error', 500);
}
