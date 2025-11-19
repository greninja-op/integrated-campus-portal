<?php
/**
 * Get Marks API
 * Returns student marks with GPA and CGPA calculations
 * Method: GET
 * Auth: Required (student role)
 * Query Params: semester (optional)
 */

// Include required files
require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/validation.php';
require_once '../../includes/functions.php';
require_once '../../includes/grade_calculator.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role (allow students and admins)
if ($user['role'] !== 'student' && $user['role'] !== 'admin') {
    sendError('Forbidden - This endpoint is only accessible to students', 'forbidden', 403);
}

try {
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get student ID from user ID
    // IDOR Protection: We derive the student_id directly from the authenticated user_id
    // This prevents a student from passing another student's ID in the request
    $studentId = getStudentIdFromUserId($user['user_id'], $db);
    if (!$studentId) {
        // If user is admin, they might want to see a specific student's marks
        if ($user['role'] === 'admin' && isset($_GET['student_id'])) {
            $studentId = (int) $_GET['student_id'];
            // Verify student exists
            $checkStmt = $db->prepare("SELECT id FROM students WHERE id = :id");
            $checkStmt->bindParam(':id', $studentId, PDO::PARAM_INT);
            $checkStmt->execute();
            if ($checkStmt->rowCount() === 0) {
                sendError('Student not found', 'not_found', 404);
            }
        } else if ($user['role'] === 'admin') {
             sendError('Student ID is required for admin', 'missing_param', 400);
        } else {
             sendError('Student record not found for this user', 'not_found', 404);
        }
    }
    
    // Get active session
    $session = getActiveSession($db);
    if (!$session) {
        sendError('No active academic session found', 'no_active_session', 404);
    }
    $sessionId = $session['id'];
    
    // Get semester from query params (optional)
    $semester = isset($_GET['semester']) ? (int) $_GET['semester'] : null;
    
    // If no semester specified, get current semester
    if ($semester === null) {
        $semester = getCurrentSemester($studentId, $db);
        if (!$semester) {
            sendError('Could not determine current semester', 'semester_not_found', 404);
        }
    }
    
    // Validate semester
    if (!validateSemester($semester)) {
        sendError('Invalid semester number. Must be between 1 and 6', 'invalid_semester', 400);
    }
    
    // Query marks with subject details
    $query = "SELECT 
                m.id,
                m.internal_marks,
                m.external_marks,
                m.total_marks,
                m.grade_point,
                m.letter_grade,
                m.remarks,
                s.subject_code,
                s.subject_name,
                s.credit_hours,
                (m.grade_point * s.credit_hours) as credit_points
              FROM marks m
              JOIN subjects s ON m.subject_id = s.id
              WHERE m.student_id = :student_id
              AND m.semester = :semester
              AND m.session_id = :session_id
              ORDER BY s.subject_code";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $stmt->bindParam(':semester', $semester, PDO::PARAM_INT);
    $stmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
    $stmt->execute();
    
    $marks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate summary statistics
    $totalSubjects = count($marks);
    $totalCredits = 0;
    $totalCreditPoints = 0.0;
    
    foreach ($marks as &$mark) {
        // Convert numeric strings to proper types
        $mark['internal_marks'] = (float) $mark['internal_marks'];
        $mark['external_marks'] = (float) $mark['external_marks'];
        $mark['total_marks'] = (float) $mark['total_marks'];
        $mark['grade_point'] = (float) $mark['grade_point'];
        $mark['credit_hours'] = (int) $mark['credit_hours'];
        $mark['credit_points'] = (float) $mark['credit_points'];
        
        $totalCredits += $mark['credit_hours'];
        $totalCreditPoints += $mark['credit_points'];
    }
    
    // Calculate GPA for this semester
    $gpa = $totalCredits > 0 ? round($totalCreditPoints / $totalCredits, 2) : 0.00;
    
    // Calculate CGPA across all semesters
    $cgpa = calculateCGPAFromDB($db, $studentId, $sessionId);
    
    // Prepare response
    $response = [
        'marks' => $marks,
        'summary' => [
            'semester' => $semester,
            'total_subjects' => $totalSubjects,
            'total_credits' => $totalCredits,
            'total_credit_points' => round($totalCreditPoints, 2),
            'gpa' => $gpa,
            'cgpa' => $cgpa
        ]
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in get_marks.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id'],
        'semester' => $semester ?? null
    ]);
    sendError('An error occurred while fetching marks', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in get_marks.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
