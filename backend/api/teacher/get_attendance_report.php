<?php
/**
 * Get Attendance Report API
 * Returns attendance statistics for students in a subject
 * Method: GET
 * Auth: Required (teacher role)
 * Query Params: subject_id, start_date?, end_date?
 */

// Include required files
require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';
require_once '../../includes/validation.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'teacher') {
    sendError('Forbidden - This endpoint is only accessible to teachers', 'forbidden', 403);
}

try {
    // Get query parameters
    $subjectId = isset($_GET['subject_id']) ? (int) $_GET['subject_id'] : null;
    $startDate = isset($_GET['start_date']) ? trim($_GET['start_date']) : null;
    $endDate = isset($_GET['end_date']) ? trim($_GET['end_date']) : null;
    
    // Validate required parameters
    if ($subjectId === null) {
        sendError('subject_id is required', 'validation_error', 400);
    }
    
    // Validate dates if provided
    if ($startDate !== null && !validateDate($startDate)) {
        sendError('Invalid start_date format. Use YYYY-MM-DD', 'invalid_date', 400);
    }
    
    if ($endDate !== null && !validateDate($endDate)) {
        sendError('Invalid end_date format. Use YYYY-MM-DD', 'invalid_date', 400);
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
    
    // Verify subject exists and get details
    $subjectQuery = "SELECT id, subject_code, subject_name, semester, department 
                     FROM subjects WHERE id = :id";
    $subjectStmt = $db->prepare($subjectQuery);
    $subjectStmt->bindParam(':id', $subjectId, PDO::PARAM_INT);
    $subjectStmt->execute();
    $subject = $subjectStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$subject) {
        sendError('Subject not found', 'subject_not_found', 404);
    }
    
    // Build attendance query with date filters
    $query = "SELECT 
                s.id as student_id,
                s.student_id as student_number,
                s.first_name,
                s.last_name,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                COUNT(*) as total_classes,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
                SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_count,
                ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as percentage
              FROM attendance a
              JOIN students s ON a.student_id = s.id
              WHERE a.subject_id = :subject_id
              AND a.session_id = :session_id";
    
    $params = [
        ':subject_id' => $subjectId,
        ':session_id' => $sessionId
    ];
    
    // Add date filters if provided
    if ($startDate !== null) {
        $query .= " AND a.attendance_date >= :start_date";
        $params[':start_date'] = $startDate;
    }
    
    if ($endDate !== null) {
        $query .= " AND a.attendance_date <= :end_date";
        $params[':end_date'] = $endDate;
    }
    
    $query .= " GROUP BY s.id, s.student_id, s.first_name, s.last_name
                ORDER BY percentage DESC, s.student_id";
    
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    
    $report = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate overall statistics
    $totalStudents = count($report);
    $overallPresent = 0;
    $overallAbsent = 0;
    $overallClasses = 0;
    $studentsAbove75 = 0;
    $studentsBelow75 = 0;
    
    foreach ($report as &$record) {
        // Convert to proper types
        $record['total_classes'] = (int) $record['total_classes'];
        $record['present_count'] = (int) $record['present_count'];
        $record['absent_count'] = (int) $record['absent_count'];
        $record['late_count'] = (int) $record['late_count'];
        $record['excused_count'] = (int) $record['excused_count'];
        $record['percentage'] = (float) $record['percentage'];
        
        // Calculate totals
        $overallClasses += $record['total_classes'];
        $overallPresent += $record['present_count'];
        $overallAbsent += $record['absent_count'];
        
        // Count students by attendance threshold
        if ($record['percentage'] >= 75) {
            $studentsAbove75++;
        } else {
            $studentsBelow75++;
        }
    }
    
    // Calculate overall percentage
    $overallPercentage = $overallClasses > 0 
        ? round(($overallPresent / $overallClasses) * 100, 2) 
        : 0.00;
    
    // Prepare response
    $response = [
        'subject' => [
            'subject_id' => (int) $subject['id'],
            'subject_code' => $subject['subject_code'],
            'subject_name' => $subject['subject_name'],
            'semester' => $subject['semester'] ? (int) $subject['semester'] : null,
            'department' => $subject['department']
        ],
        'date_range' => [
            'start_date' => $startDate,
            'end_date' => $endDate
        ],
        'report' => $report,
        'summary' => [
            'total_students' => $totalStudents,
            'overall_classes' => $overallClasses,
            'overall_present' => $overallPresent,
            'overall_absent' => $overallAbsent,
            'overall_percentage' => $overallPercentage,
            'students_above_75' => $studentsAbove75,
            'students_below_75' => $studentsBelow75
        ]
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in get_attendance_report.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id'],
        'subject_id' => $subjectId ?? null
    ]);
    sendError('An error occurred while generating attendance report', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in get_attendance_report.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
