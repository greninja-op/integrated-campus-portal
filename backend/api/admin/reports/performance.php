<?php
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../config/database.php';

// Verify admin authentication
$user = verifyAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'unauthorized', 'message' => 'Authentication required']);
    exit();
}

requireRole('admin');

// Get optional filters from query parameters
$semester = isset($_GET['semester']) ? intval($_GET['semester']) : null;
$department = isset($_GET['department']) ? trim(htmlspecialchars(strip_tags($_GET['department']))) : null;
$subject_id = isset($_GET['subject_id']) ? intval($_GET['subject_id']) : null;

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get active session
    $sessionQuery = "SELECT id FROM sessions WHERE is_active = 1 LIMIT 1";
    $sessionStmt = $db->query($sessionQuery);
    $activeSession = $sessionStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$activeSession) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'no_active_session', 'message' => 'No active session found']);
        exit();
    }
    
    $session_id = $activeSession['id'];
    
    // Build query for performance statistics
    $query = "SELECT 
        s.department,
        m.semester,
        COUNT(DISTINCT m.student_id) as total_students,
        ROUND(AVG(m.grade_point), 2) as average_gpa,
        ROUND((SUM(CASE WHEN m.grade_point >= 1.50 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as pass_percentage
    FROM marks m
    JOIN students s ON m.student_id = s.id
    WHERE m.session_id = :session_id";
    
    $params = [':session_id' => $session_id];
    
    // Add optional filters
    if ($semester !== null) {
        $query .= " AND m.semester = :semester";
        $params[':semester'] = $semester;
    }
    
    if ($department !== null) {
        $query .= " AND s.department = :department";
        $params[':department'] = $department;
    }
    
    if ($subject_id !== null) {
        $query .= " AND m.subject_id = :subject_id";
        $params[':subject_id'] = $subject_id;
    }
    
    $query .= " GROUP BY s.department, m.semester
                ORDER BY s.department, m.semester";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $performanceStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get subject-wise averages
    $subjectQuery = "SELECT 
        sub.subject_code,
        sub.subject_name,
        ROUND(AVG(m.total_marks), 2) as average_marks,
        ROUND(AVG(m.grade_point), 2) as average_gpa,
        COUNT(DISTINCT m.student_id) as student_count
    FROM marks m
    JOIN subjects sub ON m.subject_id = sub.id
    JOIN students s ON m.student_id = s.id
    WHERE m.session_id = :session_id";
    
    $subjectParams = [':session_id' => $session_id];
    
    if ($semester !== null) {
        $subjectQuery .= " AND m.semester = :semester";
        $subjectParams[':semester'] = $semester;
    }
    
    if ($department !== null) {
        $subjectQuery .= " AND s.department = :department";
        $subjectParams[':department'] = $department;
    }
    
    if ($subject_id !== null) {
        $subjectQuery .= " AND m.subject_id = :subject_id";
        $subjectParams[':subject_id'] = $subject_id;
    }
    
    $subjectQuery .= " GROUP BY sub.id, sub.subject_code, sub.subject_name
                       ORDER BY sub.subject_code";
    
    $subjectStmt = $db->prepare($subjectQuery);
    $subjectStmt->execute($subjectParams);
    $subjectAverages = $subjectStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate overall statistics
    $overallQuery = "SELECT 
        COUNT(DISTINCT m.student_id) as total_students,
        ROUND(AVG(m.grade_point), 2) as overall_average_gpa,
        ROUND((SUM(CASE WHEN m.grade_point >= 1.50 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as overall_pass_percentage
    FROM marks m
    JOIN students s ON m.student_id = s.id
    WHERE m.session_id = :session_id";
    
    $overallParams = [':session_id' => $session_id];
    
    if ($semester !== null) {
        $overallQuery .= " AND m.semester = :semester";
        $overallParams[':semester'] = $semester;
    }
    
    if ($department !== null) {
        $overallQuery .= " AND s.department = :department";
        $overallParams[':department'] = $department;
    }
    
    if ($subject_id !== null) {
        $overallQuery .= " AND m.subject_id = :subject_id";
        $overallParams[':subject_id'] = $subject_id;
    }
    
    $overallStmt = $db->prepare($overallQuery);
    $overallStmt->execute($overallParams);
    $overallStats = $overallStmt->fetch(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'filters' => [
                'semester' => $semester,
                'department' => $department,
                'subject_id' => $subject_id
            ],
            'overall' => $overallStats,
            'by_department_semester' => $performanceStats,
            'subject_averages' => $subjectAverages
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in performance report: " . $e->getMessage());
    http_response_code(500);
    // Don't leak exception message in production
    echo json_encode(['success' => false, 'error' => 'database_error', 'message' => 'An error occurred while generating the report']);
}
?>
