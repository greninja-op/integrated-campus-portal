<?php
/**
 * Download Student ID Card
 * 
 * Generates and downloads a PDF ID card for the authenticated student.
 * 
 * Requirements: 11.1-11.5, 14.1-14.5
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
    
    // Query student data including profile_image
    // IDOR Protection: Derive student_id from authenticated user_id
    // If admin, allow fetching any student ID card
    if ($user['role'] === 'admin' && isset($_GET['student_id'])) {
        $query = "SELECT 
                    s.id,
                    s.student_id,
                    CONCAT(s.first_name, ' ', s.last_name) as full_name,
                    s.department,
                    s.semester,
                    s.enrollment_date,
                    s.profile_image,
                    DATE_ADD(s.enrollment_date, INTERVAL 3 YEAR) as valid_until
                  FROM students s
                  WHERE s.id = :student_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $_GET['student_id'], PDO::PARAM_INT);
    } else {
        $query = "SELECT 
                    s.id,
                    s.student_id,
                    CONCAT(s.first_name, ' ', s.last_name) as full_name,
                    s.department,
                    s.semester,
                    s.enrollment_date,
                    s.profile_image,
                    DATE_ADD(s.enrollment_date, INTERVAL 3 YEAR) as valid_until
                  FROM students s
                  WHERE s.user_id = :user_id";
        $stmt = $db->prepare($query);
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
    
    // Generate ID card PDF
    $pdfPath = generateIDCard($studentData);
    
    // Output PDF for download
    $filename = 'ID_Card_' . $studentData['student_id'] . '.pdf';
    outputPDFDownload($pdfPath, $filename);
    
} catch (PDOException $e) {
    error_log("Database error in download_id_card.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'database_error',
        'message' => 'An error occurred while generating ID card'
    ]);
    exit();
} catch (Exception $e) {
    error_log("Error in download_id_card.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'generation_error',
        'message' => 'An error occurred while generating ID card'
    ]);
    exit();
}
?>
