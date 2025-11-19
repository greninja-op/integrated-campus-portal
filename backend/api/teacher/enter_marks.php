<?php
/**
 * Enter Marks API
 * Allows teachers to enter marks for a student
 * Method: POST
 * Auth: Required (teacher role)
 * Body: { student_id, subject_id, semester?, internal_marks, external_marks, remarks? }
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
    $required = ['student_id', 'subject_id', 'internal_marks', 'external_marks'];
    $missing = validateRequired($required, $data);
    
    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 'validation_error', 400, ['missing_fields' => $missing]);
    }
    
    // Get and validate data
    $studentId = (int) $data['student_id'];
    $subjectId = (int) $data['subject_id'];
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
    
    // Get active session
    $session = getActiveSession($db);
    if (!$session) {
        sendError('No active academic session found', 'no_active_session', 404);
    }
    $sessionId = $session['id'];

    // Get teacher's department
    $teacherQuery = "SELECT department FROM teachers WHERE user_id = :user_id";
    $teacherStmt = $db->prepare($teacherQuery);
    $teacherStmt->bindParam(':user_id', $user['user_id'], PDO::PARAM_INT);
    $teacherStmt->execute();
    $teacher = $teacherStmt->fetch(PDO::FETCH_ASSOC);

    if (!$teacher) {
        sendError('Teacher profile not found', 'teacher_not_found', 404);
    }
    
    // Verify student exists and get their semester
    $studentQuery = "SELECT id, semester, department FROM students WHERE id = :id";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':id', $studentId, PDO::PARAM_INT);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        sendError('Student not found', 'student_not_found', 404);
    }

    // Check if student belongs to teacher's department
    // Note: This might be too restrictive if teachers teach across departments. 
    // If so, we should check if the SUBJECT belongs to the teacher's department or if the teacher is assigned to the subject.
    // For now, implementing the requested department check.
    if (strcasecmp($student['department'], $teacher['department']) !== 0) {
         sendError('You can only enter marks for students in your department (' . $teacher['department'] . ')', 'forbidden_department', 403);
    }
    
    // Use provided semester or student's current semester
    $semester = isset($data['semester']) ? (int) $data['semester'] : (int) $student['semester'];
    
    // Validate semester
    if (!validateSemester($semester)) {
        sendError('Invalid semester number. Must be between 1 and 6', 'invalid_semester', 400);
    }
    
    // Verify subject exists
    $subjectQuery = "SELECT id, subject_code, subject_name, credit_hours FROM subjects WHERE id = :id";
    $subjectStmt = $db->prepare($subjectQuery);
    $subjectStmt->bindParam(':id', $subjectId, PDO::PARAM_INT);
    $subjectStmt->execute();
    $subject = $subjectStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$subject) {
        sendError('Subject not found', 'subject_not_found', 404);
    }
    
    // Calculate total marks and grade
    $totalMarks = $internalMarks + $externalMarks;
    $gradeData = calculateGrade($totalMarks);
    $gradePoint = $gradeData['grade_point'];
    $letterGrade = $gradeData['letter_grade'];
    
    // Check if marks already exist for this student-subject-semester combination
    $checkQuery = "SELECT id FROM marks 
                   WHERE student_id = :student_id 
                   AND subject_id = :subject_id 
                   AND semester = :semester 
                   AND session_id = :session_id";
    
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $checkStmt->bindParam(':subject_id', $subjectId, PDO::PARAM_INT);
    $checkStmt->bindParam(':semester', $semester, PDO::PARAM_INT);
    $checkStmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        sendError('Marks already exist for this student-subject-semester combination. Use update endpoint instead.', 'marks_exist', 409);
    }
    
    // Insert marks
    $insertQuery = "INSERT INTO marks 
                   (student_id, subject_id, session_id, semester, internal_marks, external_marks, 
                    total_marks, grade_point, letter_grade, remarks, entered_by)
                   VALUES 
                   (:student_id, :subject_id, :session_id, :semester, :internal_marks, :external_marks,
                    :total_marks, :grade_point, :letter_grade, :remarks, :entered_by)";
    
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $insertStmt->bindParam(':subject_id', $subjectId, PDO::PARAM_INT);
    $insertStmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
    $insertStmt->bindParam(':semester', $semester, PDO::PARAM_INT);
    $insertStmt->bindParam(':internal_marks', $internalMarks);
    $insertStmt->bindParam(':external_marks', $externalMarks);
    $insertStmt->bindParam(':total_marks', $totalMarks);
    $insertStmt->bindParam(':grade_point', $gradePoint);
    $insertStmt->bindParam(':letter_grade', $letterGrade, PDO::PARAM_STR);
    $insertStmt->bindParam(':remarks', $remarks, PDO::PARAM_STR);
    $insertStmt->bindParam(':entered_by', $user['user_id'], PDO::PARAM_INT);
    
    if (!$insertStmt->execute()) {
        sendError('Failed to insert marks', 'insert_failed', 500);
    }
    
    $marksId = $db->lastInsertId();
    
    // Calculate credit points
    $creditPoints = calculateCP($gradePoint, (int) $subject['credit_hours']);
    
    // Prepare response
    $response = [
        'id' => (int) $marksId,
        'student_id' => $studentId,
        'subject_code' => $subject['subject_code'],
        'subject_name' => $subject['subject_name'],
        'semester' => $semester,
        'internal_marks' => $internalMarks,
        'external_marks' => $externalMarks,
        'total_marks' => $totalMarks,
        'grade_point' => $gradePoint,
        'letter_grade' => $letterGrade,
        'credit_hours' => (int) $subject['credit_hours'],
        'credit_points' => $creditPoints,
        'remarks' => $remarks
    ];
    
    sendSuccess($response, 201);
    
} catch (PDOException $e) {
    logError('Database error in enter_marks.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id'],
        'student_id' => $studentId ?? null,
        'subject_id' => $subjectId ?? null
    ]);
    sendError('An error occurred while entering marks', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in enter_marks.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
