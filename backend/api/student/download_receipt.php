<?php
/**
 * Download Payment Receipt
 * 
 * Generates and downloads a PDF receipt for a specific payment.
 * 
 * Requirements: 12.1-12.5, 14.1-14.5
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

// Validate payment_id query parameter
if (!isset($_GET['payment_id']) || empty($_GET['payment_id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'missing_parameter',
        'message' => 'Payment ID is required'
    ]);
    exit();
}

$paymentId = intval($_GET['payment_id']);

try {
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Query payment data joined with fee and student tables
    $query = "SELECT 
                p.id,
                p.receipt_number,
                p.amount_paid,
                p.late_fine,
                p.total_amount,
                p.payment_date,
                p.payment_method,
                p.transaction_id,
                f.fee_type,
                f.fee_name,
                f.amount as base_amount,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.student_id,
                s.department,
                s.semester,
                s.user_id
              FROM payments p
              JOIN fees f ON p.fee_id = f.id
              JOIN students s ON p.student_id = s.id
              WHERE p.id = :payment_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':payment_id', $paymentId, PDO::PARAM_INT);
    $stmt->execute();
    
    $paymentData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$paymentData) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'payment_not_found',
            'message' => 'Payment record not found'
        ]);
        exit();
    }
    
    // Verify payment belongs to authenticated student
    // IDOR Protection: Allow admin to download any receipt, but restrict students to their own
    if ($user['role'] !== 'admin' && $paymentData['user_id'] != $user['user_id']) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'forbidden',
            'message' => 'You do not have permission to access this receipt'
        ]);
        exit();
    }
    
    // Remove user_id from data (not needed for PDF)
    unset($paymentData['user_id']);
    
    // Generate receipt PDF
    $pdfPath = generateReceipt($paymentData);
    
    // Output PDF for download
    $filename = 'Receipt_' . $paymentData['receipt_number'] . '_' . $paymentData['student_id'] . '.pdf';
    outputPDFDownload($pdfPath, $filename);
    
} catch (PDOException $e) {
    error_log("Database error in download_receipt.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'database_error',
        'message' => 'An error occurred while generating receipt'
    ]);
    exit();
} catch (Exception $e) {
    error_log("Error in download_receipt.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'generation_error',
        'message' => 'An error occurred while generating receipt'
    ]);
    exit();
}
?>
