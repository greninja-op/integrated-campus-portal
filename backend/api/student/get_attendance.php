<?php
/**
 * Get Attendance API
 * Returns student attendance records with percentages
 * Method: GET
 * Auth: Required (student role)
 * Query Params: semester (optional)
 */

// Include required files
require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

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
    // IDOR Protection: Derive student_id from authenticated user_id
    $studentId = getStudentIdFromUserId($user['user_id'], $db);
    if (!$studentId) {
        // Admin override for viewing specific student attendance
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
    
    // Query attendance grouped by subject
    $query = "SELECT 
                s.subject_code,
                s.subject_name,
                s.credit_hours,
                COUNT(*) as total_classes,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
                SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_count,
                ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as percentage
              FROM attendance a
              JOIN subjects s ON a.subject_id = s.id
              WHERE a.student_id = :student_id
              AND a.session_id = :session_id";
    
    // Add semester filter if specified
    if ($semester !== null) {
        $query .= " AND s.semester = :semester";
    }
    
    $query .= " GROUP BY s.id, s.subject_code, s.subject_name, s.credit_hours
                ORDER BY s.subject_code";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $stmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
    
    if ($semester !== null) {
        $stmt->bindParam(':semester', $semester, PDO::PARAM_INT);
    }
    
    $stmt->execute();
    
    $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate overall attendance statistics
    $totalClasses = 0;
    $totalPresent = 0;
    
    foreach ($attendance as &$record) {
        // Convert to proper types
        $record['credit_hours'] = (int) $record['credit_hours'];
        $record['total_classes'] = (int) $record['total_classes'];
        $record['present_count'] = (int) $record['present_count'];
        $record['absent_count'] = (int) $record['absent_count'];
        $record['late_count'] = (int) $record['late_count'];
        $record['excused_count'] = (int) $record['excused_count'];
        $record['percentage'] = (float) $record['percentage'];
        
        $totalClasses += $record['total_classes'];
        $totalPresent += $record['present_count'];
    }
    
    // Calculate overall percentage
    $overallPercentage = $totalClasses > 0 
        ? round(($totalPresent / $totalClasses) * 100, 2) 
        : 0.00;
    
    // Prepare response
    $response = [
        'attendance' => $attendance,
        'summary' => [
            'total_subjects' => count($attendance),
            'total_classes' => $totalClasses,
            'total_present' => $totalPresent,
            'total_absent' => $totalClasses - $totalPresent,
            'overall_percentage' => $overallPercentage
        ]
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in get_attendance.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id'],
        'semester' => $semester ?? null
    ]);
    sendError('An error occurred while fetching attendance', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in get_attendance.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
