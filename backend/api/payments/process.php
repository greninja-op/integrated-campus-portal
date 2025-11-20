<?php
/**
 * Student Payment Processing API
 * Method: POST
 * Auth: Required (student)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

// Verify authentication
$user = verifyAuth();
if (!$user || $user['role'] !== 'student') {
    sendError('Unauthorized', 'unauthorized', 403);
}

// Get posted data
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['fee_id'], $data['amount'], $data['payment_method'])) {
    sendError('Missing required fields', 'missing_param', 400);
}

$feeId = (int) $data['fee_id'];
$amount = (float) $data['amount'];
$paymentMethod = trim($data['payment_method']);

// Validate Amount
if ($amount <= 0) {
    sendError('Invalid amount. Amount must be greater than 0.', 'invalid_amount', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $studentId = getStudentIdFromUserId($user['user_id'], $db);
    if (!$studentId) {
        sendError('Student profile not found', 'student_not_found', 404);
    }
    
    $db->beginTransaction();

    // 1. Verify Fee exists and belongs to student's session/department/semester
    // For simplicity, we check if fee exists and relies on student's integrity for now,
    // or ideally check if fee is applicable.
    $stmt = $db->prepare("SELECT * FROM fees WHERE id = ? LIMIT 1 FOR UPDATE");
    $stmt->execute([$feeId]);
    $fee = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$fee) {
        $db->rollBack();
        sendError('Fee record not found', 'not_found', 404);
    }

    // 2. Check if fee is already paid or if overpaying
    // Calculate total paid so far
    $stmt = $db->prepare("SELECT SUM(amount_paid) as total_paid FROM payments WHERE student_id = ? AND fee_id = ? AND status = 'completed'");
    $stmt->execute([$studentId, $feeId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $totalPaidSoFar = (float) ($result['total_paid'] ?? 0);

    $remaining = (float)$fee['amount'] - $totalPaidSoFar;

    if ($remaining <= 0) {
        $db->rollBack();
        sendError('Fee is already fully paid.', 'fee_paid', 400);
    }

    if ($amount > $remaining) {
        $db->rollBack();
        sendError('Amount exceeds remaining balance. Remaining: ' . formatCurrency($remaining), 'overpayment', 400);
    }

    // 3. Process Payment
    // In a real system, here we would integrate with a Payment Gateway (Stripe, PayPal, etc.)
    // For now, we assume the frontend has handled the gateway or this IS the gateway callback simulation.

    $txnId = 'TXN' . strtoupper(uniqid());
    $receiptNo = generateReceiptNumber(); // Fixed: Removed argument

    // Insert Payment Record
    $query = "INSERT INTO payments (student_id, fee_id, amount_paid, total_amount, payment_date, payment_method, transaction_id, status, receipt_number, remarks) 
              VALUES (:sid, :fid, :amount, :total_amount, CURRENT_DATE, :method, :txn, 'completed', :receipt, 'Online Payment')";
              
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':sid' => $studentId,
        ':fid' => $feeId,
        ':amount' => $amount,
        ':total_amount' => $amount, // total_amount in payments usually refers to the total for this transaction
        ':method' => $paymentMethod,
        ':txn' => $txnId,
        ':receipt' => $receiptNo
    ]);
    
    $paymentId = $db->lastInsertId();

    $db->commit();
    
    sendSuccess([
        'message' => 'Payment processed successfully',
        'payment_id' => $paymentId,
        'transaction_id' => $txnId,
        'receipt_number' => $receiptNo,
        'remaining_balance' => $remaining - $amount
    ]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    logError('Payment processing error: ' . $e->getMessage());
    sendError('Payment processing failed: ' . $e->getMessage(), 'server_error', 500);
}
