<?php
/**
 * Download Performance Report
 * 
 * Generates and downloads a PDF performance report with marks, GPA, and CGPA.
 * 
 * Requirements: 13.1-13.5, 14.1-14.5
 */

require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/pdf_generator.php';
require_once '../../config/database.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'unauthorized',
        'message' => 'Authentication required'
    ]);
    exit();
}

// Require student or admin role
if ($user['role'] !== 'student' && $user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden', 'message' => 'Access denied']);
    exit();
}

try {
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get student information
    // IDOR Protection: Derive student_id from authenticated user_id
    // If admin, allow fetching any student report
    if ($user['role'] === 'admin' && isset($_GET['student_id'])) {
        $studentQuery = "SELECT 
                            s.id,
                            s.student_id,
                            CONCAT(s.first_name, ' ', s.last_name) as full_name,
                            s.department,
                            s.semester,
                            s.enrollment_date
                         FROM students s
                         WHERE s.id = :student_id";
        $stmt = $db->prepare($studentQuery);
        $stmt->bindParam(':student_id', $_GET['student_id'], PDO::PARAM_INT);
    } else {
        $studentQuery = "SELECT 
                            s.id,
                            s.student_id,
                            CONCAT(s.first_name, ' ', s.last_name) as full_name,
                            s.department,
                            s.semester,
                            s.enrollment_date
                         FROM students s
                         WHERE s.user_id = :user_id";
        $stmt = $db->prepare($studentQuery);
        $stmt->bindParam(':user_id', $user['user_id'], PDO::PARAM_INT);
    }
    $stmt->execute();
    
    $studentData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$studentData) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'student_not_found',
            'message' => 'Student record not found'
        ]);
        exit();
    }
    
    // Query all marks data grouped by semester
    $marksQuery = "SELECT 
                    m.semester,
                    s.subject_code,
                    s.subject_name,
                    s.credit_hours,
                    m.internal_marks,
                    m.external_marks,
                    m.total_marks,
                    m.letter_grade,
                    m.grade_point,
                    (m.grade_point * s.credit_hours) as credit_points
                   FROM marks m
                   JOIN subjects s ON m.subject_id = s.id
                   WHERE m.student_id = :student_id
                   ORDER BY m.semester, s.subject_code";
    
    $stmt = $db->prepare($marksQuery);
    $stmt->bindParam(':student_id', $studentData['id'], PDO::PARAM_INT);
    $stmt->execute();
    
    $allMarks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($allMarks)) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'no_marks_found',
            'message' => 'No marks data available for performance report'
        ]);
        exit();
    }
    
    // Group marks by semester
    $marksData = [];
    foreach ($allMarks as $mark) {
        $semester = $mark['semester'];
        if (!isset($marksData[$semester])) {
            $marksData[$semester] = [];
        }
        $marksData[$semester][] = $mark;
    }
    
    // Generate performance report PDF
    $pdfPath = generatePerformanceReport($studentData, $marksData);
    
    // Output PDF for download
    $date = date('Y-m-d');
    $filename = 'Performance_Report_' . $studentData['student_id'] . '_' . $date . '.pdf';
    outputPDFDownload($pdfPath, $filename);
    
} catch (PDOException $e) {
    error_log("Database error in download_performance_report.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'database_error',
        'message' => 'An error occurred while generating performance report'
    ]);
    exit();
} catch (Exception $e) {
    error_log("Error in download_performance_report.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'generation_error',
        'message' => 'An error occurred while generating performance report'
    ]);
    exit();
}
?>
