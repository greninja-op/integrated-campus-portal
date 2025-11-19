<?php
/**
 * Update Marks API
 * Allows teachers to update existing marks
 * Method: PUT
 * Auth: Required (teacher role)
 * Body: { marks_id, internal_marks, external_marks, remarks? }
 */

// Include required files
require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';
require_once '../../includes/validation.php';
require_once '../../includes/grade_calculator.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'teacher') {
    sendError('Forbidden - This endpoint is only accessible to teachers', 'forbidden', 403);
}

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    sendError('Invalid JSON data', 'invalid_json', 400);
}

try {
    // Validate required fields
    $required = ['marks_id', 'internal_marks', 'external_marks'];
    $missing = validateRequired($required, $data);
    
    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 'validation_error', 400, ['missing_fields' => $missing]);
    }
    
    // Get and validate data
    $marksId = (int) $data['marks_id'];
    $internalMarks = (float) $data['internal_marks'];
    $externalMarks = (float) $data['external_marks'];
    $remarks = isset($data['remarks']) ? trim($data['remarks']) : null;
    
    // Validate marks ranges
    if (!validateMarks($internalMarks, 30)) {
        sendError('Internal marks must be between 0 and 30', 'invalid_marks', 400);
    }
    
    if (!validateMarks($externalMarks, 70)) {
        sendError('External marks must be between 0 and 70', 'invalid_marks', 400);
    }
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify marks record exists and get current data
    $checkQuery = "SELECT m.id, m.student_id, m.subject_id, m.semester, s.credit_hours, s.subject_code, s.subject_name
                   FROM marks m
                   JOIN subjects s ON m.subject_id = s.id
                   WHERE m.id = :marks_id";
    
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':marks_id', $marksId, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        sendError('Marks record not found', 'not_found', 404);
    }
    
    $existingMarks = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    // Department Restriction Check
    // Get teacher's department
    $teacherQuery = "SELECT department FROM teachers WHERE user_id = :user_id";
    $teacherStmt = $db->prepare($teacherQuery);
    $teacherStmt->bindParam(':user_id', $user['user_id'], PDO::PARAM_INT);
    $teacherStmt->execute();
    $teacher = $teacherStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$teacher) {
        sendError('Teacher profile not found', 'not_found', 404);
    }
    
    // Get student's department
    $studentQuery = "SELECT department FROM students WHERE id = :student_id";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':student_id', $existingMarks['student_id'], PDO::PARAM_INT);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        sendError('Student not found', 'not_found', 404);
    }
    
    // Check if departments match
    // Note: This might be too restrictive if teachers teach across departments.
    // If so, we should check if the teacher is assigned to the subject instead.
    if ($teacher['department'] !== $student['department']) {
        sendError('You can only update marks for students in your department (' . $teacher['department'] . ')', 'forbidden', 403);
    }
    
    // Calculate new total marks and grade
    $totalMarks = $internalMarks + $externalMarks;
    $gradeData = calculateGrade($totalMarks);
    $gradePoint = $gradeData['grade_point'];
    $letterGrade = $gradeData['letter_grade'];
    
    // Update marks
    $updateQuery = "UPDATE marks 
                   SET internal_marks = :internal_marks,
                       external_marks = :external_marks,
                       total_marks = :total_marks,
                       grade_point = :grade_point,
                       letter_grade = :letter_grade,
                       remarks = :remarks,
                       updated_at = NOW()
                   WHERE id = :marks_id";
    
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':internal_marks', $internalMarks);
    $updateStmt->bindParam(':external_marks', $externalMarks);
    $updateStmt->bindParam(':total_marks', $totalMarks);
    $updateStmt->bindParam(':grade_point', $gradePoint);
    $updateStmt->bindParam(':letter_grade', $letterGrade, PDO::PARAM_STR);
    $updateStmt->bindParam(':remarks', $remarks, PDO::PARAM_STR);
    $updateStmt->bindParam(':marks_id', $marksId, PDO::PARAM_INT);
    
    if (!$updateStmt->execute()) {
        sendError('Failed to update marks', 'update_failed', 500);
    }
    
    // Calculate credit points
    $creditPoints = calculateCP($gradePoint, (int) $existingMarks['credit_hours']);
    
    // Prepare response
    $response = [
        'id' => $marksId,
        'student_id' => (int) $existingMarks['student_id'],
        'subject_code' => $existingMarks['subject_code'],
        'subject_name' => $existingMarks['subject_name'],
        'semester' => (int) $existingMarks['semester'],
        'internal_marks' => $internalMarks,
        'external_marks' => $externalMarks,
        'total_marks' => $totalMarks,
        'grade_point' => $gradePoint,
        'letter_grade' => $letterGrade,
        'credit_hours' => (int) $existingMarks['credit_hours'],
        'credit_points' => $creditPoints,
        'remarks' => $remarks,
        'updated' => true
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in update_marks.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id'],
        'marks_id' => $marksId ?? null
    ]);
    sendError('An error occurred while updating marks', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in update_marks.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
