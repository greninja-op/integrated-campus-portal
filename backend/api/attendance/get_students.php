<?php
/**
 * Get Students for Attendance API
 * Fetches students based on department and semester
 * Method: GET
 * Auth: Required (teacher, admin)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized', 'unauthorized', 401);
}

if (!in_array($user['role'], ['teacher', 'admin'])) {
    sendError('Forbidden', 'forbidden', 403);
}

$department = isset($_GET['department']) ? trim($_GET['department']) : null;
$semester = isset($_GET['semester']) ? (int)$_GET['semester'] : null;
$subjectId = isset($_GET['subject_id']) ? (int)$_GET['subject_id'] : null;
$date = isset($_GET['date']) ? trim($_GET['date']) : date('Y-m-d');

if (!$department || !$semester) {
    sendError('Department and Semester are required', 'missing_params', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get students
    $query = "SELECT id, student_id, first_name, last_name, profile_image 
              FROM students 
              WHERE department = :department AND semester = :semester 
              ORDER BY student_id ASC";
              
    $stmt = $db->prepare($query);
    $stmt->bindParam(':department', $department);
    $stmt->bindParam(':semester', $semester);
    $stmt->execute();
    
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // If subject_id and date provided, fetch existing attendance
    if ($subjectId && $date) {
        $attQuery = "SELECT student_id, status FROM attendance 
                     WHERE subject_id = :subject_id AND attendance_date = :date";
        $attStmt = $db->prepare($attQuery);
        $attStmt->bindParam(':subject_id', $subjectId);
        $attStmt->bindParam(':date', $date);
        $attStmt->execute();
        
        $attendanceMap = [];
        while ($row = $attStmt->fetch(PDO::FETCH_ASSOC)) {
            $attendanceMap[$row['student_id']] = $row['status'];
        }
        
        // Merge attendance status
        foreach ($students as &$student) {
            $student['status'] = isset($attendanceMap[$student['id']]) ? $attendanceMap[$student['id']] : 'present'; // Default to present
        }
    } else {
        // Default status
        foreach ($students as &$student) {
            $student['status'] = 'present';
        }
    }
    
    sendSuccess(['students' => $students]);
    
} catch (PDOException $e) {
    logError('Database error: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
}
