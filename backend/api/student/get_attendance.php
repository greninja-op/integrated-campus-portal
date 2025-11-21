<?php
/**
 * Get Student Attendance API
 * Returns attendance records with filtering and statistics
 * Method: GET
 * Auth: Required (student role)
 * Query params: semester, month, year, view_type (daily/summary)
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
if ($user['role'] !== 'student') {
    sendError('Forbidden - This endpoint is only accessible to students', 'forbidden', 403);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get student ID
    $studentQuery = "SELECT id, semester FROM students WHERE user_id = :user_id";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':user_id', $user['user_id'], PDO::PARAM_INT);
    $studentStmt->execute();
    
    if ($studentStmt->rowCount() === 0) {
        sendError('Student profile not found', 'not_found', 404);
    }
    
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    $studentId = $student['id'];
    $currentSemester = $student['semester'];
    
    // Get query parameters
    $semester = isset($_GET['semester']) ? (int)$_GET['semester'] : $currentSemester;
    $month = isset($_GET['month']) ? (int)$_GET['month'] : null;
    $year = isset($_GET['year']) ? (int)$_GET['year'] : date('Y');
    $viewType = isset($_GET['view_type']) ? $_GET['view_type'] : 'daily';
    
    // Get current month and previous month for daily view restriction
    $currentMonth = (int)date('n');
    $currentYear = (int)date('Y');
    $previousMonth = $currentMonth - 1;
    $previousMonthYear = $currentYear;
    
    if ($previousMonth < 1) {
        $previousMonth = 12;
        $previousMonthYear--;
    }
    
    // Build query based on view type
    if ($viewType === 'daily') {
        // Daily view: Only current and previous month
        if (!$month) {
            $month = $currentMonth;
        }
        
        // Restrict to current and previous month only
        $allowedMonths = [
            ['month' => $currentMonth, 'year' => $currentYear],
            ['month' => $previousMonth, 'year' => $previousMonthYear]
        ];
        
        $isAllowed = false;
        foreach ($allowedMonths as $allowed) {
            if ($month == $allowed['month'] && $year == $allowed['year']) {
                $isAllowed = true;
                break;
            }
        }
        
        if (!$isAllowed) {
            sendError('Daily attendance view is only available for current and previous month', 'invalid_period', 400);
        }
        
        $query = "SELECT 
                    a.id,
                    a.attendance_date,
                    a.status,
                    a.remarks,
                    s.subject_code,
                    s.subject_name,
                    s.semester
                  FROM attendance a
                  JOIN subjects s ON a.subject_id = s.id
                  WHERE a.student_id = :student_id
                  AND s.semester = :semester
                  AND MONTH(a.attendance_date) = :month
                  AND YEAR(a.attendance_date) = :year
                  ORDER BY a.attendance_date DESC, s.subject_name";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->bindParam(':semester', $semester, PDO::PARAM_INT);
        $stmt->bindParam(':month', $month, PDO::PARAM_INT);
        $stmt->bindParam(':year', $year, PDO::PARAM_INT);
        $stmt->execute();
        
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate stats for the month
        $stats = calculateAttendanceStats($records);
        
        sendSuccess([
            'view_type' => 'daily',
            'semester' => $semester,
            'month' => $month,
            'year' => $year,
            'records' => $records,
            'stats' => $stats,
            'current_semester' => $currentSemester
        ]);
        
    } else {
        // Summary view: Subject-wise percentage for past months
        // Get all months before current month for the semester
        $query = "SELECT 
                    s.id as subject_id,
                    s.subject_code,
                    s.subject_name,
                    MONTH(a.attendance_date) as month,
                    YEAR(a.attendance_date) as year,
                    COUNT(*) as total_classes,
                    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
                    SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                    ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as percentage
                  FROM attendance a
                  JOIN subjects s ON a.subject_id = s.id
                  WHERE a.student_id = :student_id
                  AND s.semester = :semester
                  AND (
                    YEAR(a.attendance_date) < :current_year
                    OR (YEAR(a.attendance_date) = :current_year AND MONTH(a.attendance_date) < :current_month - 1)
                  )
                  GROUP BY s.id, MONTH(a.attendance_date), YEAR(a.attendance_date)
                  ORDER BY year DESC, month DESC, s.subject_name";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->bindParam(':semester', $semester, PDO::PARAM_INT);
        $stmt->bindParam(':current_year', $currentYear, PDO::PARAM_INT);
        $stmt->bindParam(':current_month', $currentMonth, PDO::PARAM_INT);
        $stmt->execute();
        
        $summaryData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Group by subject
        $subjectSummary = [];
        foreach ($summaryData as $row) {
            $subjectId = $row['subject_id'];
            if (!isset($subjectSummary[$subjectId])) {
                $subjectSummary[$subjectId] = [
                    'subject_code' => $row['subject_code'],
                    'subject_name' => $row['subject_name'],
                    'months' => [],
                    'overall_total' => 0,
                    'overall_present' => 0,
                    'overall_percentage' => 0
                ];
            }
            
            $subjectSummary[$subjectId]['months'][] = [
                'month' => $row['month'],
                'year' => $row['year'],
                'month_name' => date('F', mktime(0, 0, 0, $row['month'], 1)),
                'total_classes' => (int)$row['total_classes'],
                'present_count' => (int)$row['present_count'],
                'absent_count' => (int)$row['absent_count'],
                'percentage' => (float)$row['percentage']
            ];
            
            $subjectSummary[$subjectId]['overall_total'] += (int)$row['total_classes'];
            $subjectSummary[$subjectId]['overall_present'] += (int)$row['present_count'];
        }
        
        // Calculate overall percentages
        foreach ($subjectSummary as &$subject) {
            if ($subject['overall_total'] > 0) {
                $subject['overall_percentage'] = round(($subject['overall_present'] / $subject['overall_total']) * 100, 2);
            }
        }
        
        sendSuccess([
            'view_type' => 'summary',
            'semester' => $semester,
            'subjects' => array_values($subjectSummary),
            'current_semester' => $currentSemester
        ]);
    }
    
} catch (PDOException $e) {
    logError('Database error in get_attendance.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An error occurred while fetching attendance', 'database_error', 500);
}

function calculateAttendanceStats($records) {
    $total = count($records);
    $present = 0;
    $absent = 0;
    $late = 0;
    $excused = 0;
    
    foreach ($records as $record) {
        switch ($record['status']) {
            case 'present':
                $present++;
                break;
            case 'absent':
                $absent++;
                break;
            case 'late':
                $late++;
                break;
            case 'excused':
                $excused++;
                break;
        }
    }
    
    $percentage = $total > 0 ? round(($present / $total) * 100, 2) : 0;
    
    return [
        'total' => $total,
        'present' => $present,
        'absent' => $absent,
        'late' => $late,
        'excused' => $excused,
        'percentage' => $percentage
    ];
}
