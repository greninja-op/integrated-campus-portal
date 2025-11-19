<?php
/**
 * Process Payment API
 * Records a new payment for a student
 * Method: POST
 * Auth: Required (admin role)
 * Body: { student_id, fee_id, amount_paid, payment_method, transaction_id?, remarks? }
 */

// Include required files
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';
require_once '../../../includes/validation.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'admin') {
    sendError('Forbidden - This endpoint is only accessible to admins', 'forbidden', 403);
}

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    sendError('Invalid JSON data', 'invalid_json', 400);
}

try {
    // Validate required fields
    $required = ['student_id', 'fee_id', 'amount_paid', 'payment_method'];
    $missing = validateRequired($required, $data);
    
    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 'validation_error', 400, ['missing_fields' => $missing]);
    }
    
    // Extract data
    $studentId = (int) $data['student_id'];
    $feeId = (int) $data['fee_id'];
    $amountPaid = (float) $data['amount_paid'];
    $paymentMethod = trim(htmlspecialchars(strip_tags($data['payment_method'])));
    $transactionId = isset($data['transaction_id']) ? trim(htmlspecialchars(strip_tags($data['transaction_id']))) : null;
    $remarks = isset($data['remarks']) ? trim(htmlspecialchars(strip_tags($data['remarks']))) : null;
    $paymentDate = isset($data['payment_date']) ? trim($data['payment_date']) : date('Y-m-d');
    
    // Validate amount
    if ($amountPaid <= 0) {
        sendError('Amount paid must be greater than 0', 'invalid_amount', 400);
    }
    
    // Validate payment method
    $validMethods = ['cash', 'card', 'online', 'cheque', 'other'];
    if (!in_array(strtolower($paymentMethod), $validMethods)) {
        sendError('Invalid payment method. Must be: ' . implode(', ', $validMethods), 'invalid_method', 400);
    }
    
    // Validate payment date
    if (!validateDate($paymentDate)) {
        sendError('Invalid payment date format. Use YYYY-MM-DD', 'invalid_date', 400);
    }
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify student exists
    $studentCheck = $db->prepare("SELECT id FROM students WHERE id = :id");
    $studentCheck->bindParam(':id', $studentId, PDO::PARAM_INT);
    $studentCheck->execute();
    
    if ($studentCheck->rowCount() === 0) {
        sendError('Student not found', 'student_not_found', 404);
    }
    
    // Verify fee exists and get details
    $feeQuery = "SELECT id, amount, due_date, late_fine_per_day, max_late_fine 
                 FROM fees WHERE id = :id";
    $feeStmt = $db->prepare($feeQuery);
    $feeStmt->bindParam(':id', $feeId, PDO::PARAM_INT);
    $feeStmt->execute();
    
    if ($feeStmt->rowCount() === 0) {
        sendError('Fee not found', 'fee_not_found', 404);
    }
    
    $fee = $feeStmt->fetch(PDO::FETCH_ASSOC);
    
    // Check if payment already exists
    $checkPayment = $db->prepare("SELECT id FROM payments 
                                   WHERE student_id = :student_id 
                                   AND fee_id = :fee_id 
                                   AND status = 'completed'");
    $checkPayment->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $checkPayment->bindParam(':fee_id', $feeId, PDO::PARAM_INT);
    $checkPayment->execute();
    
    if ($checkPayment->rowCount() > 0) {
        sendError('Payment already exists for this fee', 'payment_exists', 409);
    }
    
    // Calculate late fine
    $lateFine = calculateLateFine(
        $fee['due_date'],
        (float) $fee['late_fine_per_day'],
        (float) $fee['max_late_fine']
    );
    
    // Fix: Treat amount_paid as the TOTAL amount received from student
    // We subtract the fine from the total received to get the base fee paid
    $totalReceived = $amountPaid;
    
    if ($totalReceived < $lateFine) {
        // Optional: Reject if they can't even pay the fine?
        // For now, we allow it but base fee paid will be negative or zero? 
        // Better to just record what was paid.
        // Let's assume late_fine is what is DUE, but we store what is PAID.
        // Actually, standard practice: 
        // amount_paid = base fee portion
        // late_fine = fine portion
        // total_amount = sum
        
        // If input is TOTAL:
        $feePortion = $totalReceived - $lateFine;
        $amountPaid = $feePortion; // Update variable for insertion
        $totalAmount = $totalReceived;
    } else {
        $feePortion = $totalReceived - $lateFine;
        $amountPaid = $feePortion;
        $totalAmount = $totalReceived;
    }
    
    // Generate unique receipt number
    $receiptNumber = generateReceiptNumber();
    
    // Insert payment record
    $insertQuery = "INSERT INTO payments 
                   (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date,
                    payment_method, transaction_id, receipt_number, status, remarks, processed_by)
                   VALUES 
                   (:student_id, :fee_id, :amount_paid, :late_fine, :total_amount, :payment_date,
                    :payment_method, :transaction_id, :receipt_number, 'completed', :remarks, :processed_by)";
    
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $insertStmt->bindParam(':fee_id', $feeId, PDO::PARAM_INT);
    $insertStmt->bindParam(':amount_paid', $amountPaid);
    $insertStmt->bindParam(':late_fine', $lateFine);
    $insertStmt->bindParam(':total_amount', $totalAmount);
    $insertStmt->bindParam(':payment_date', $paymentDate, PDO::PARAM_STR);
    $insertStmt->bindParam(':payment_method', $paymentMethod, PDO::PARAM_STR);
    $insertStmt->bindParam(':transaction_id', $transactionId, PDO::PARAM_STR);
    $insertStmt->bindParam(':receipt_number', $receiptNumber, PDO::PARAM_STR);
    $insertStmt->bindParam(':remarks', $remarks, PDO::PARAM_STR);
    $insertStmt->bindParam(':processed_by', $user['user_id'], PDO::PARAM_INT);
    
    if (!$insertStmt->execute()) {
        sendError('Failed to process payment', 'insert_failed', 500);
    }
    
    $paymentId = $db->lastInsertId();
    
    // Prepare response
    $response = [
        'id' => (int) $paymentId,
        'student_id' => $studentId,
        'fee_id' => $feeId,
        'receipt_number' => $receiptNumber,
        'amount_paid' => $amountPaid,
        'late_fine' => $lateFine,
        'total_amount' => $totalAmount,
        'payment_date' => $paymentDate,
        'payment_method' => $paymentMethod,
        'transaction_id' => $transactionId,
        'status' => 'completed',
        'created' => true
    ];
    
    sendSuccess($response, 201);
    
} catch (PDOException $e) {
    logError('Database error in process payment: ' . $e->getMessage(), [
        'admin_id' => $user['user_id'],
        'student_id' => $studentId ?? null,
        'fee_id' => $feeId ?? null
    ]);
    sendError('An error occurred while processing payment', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in process payment: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
