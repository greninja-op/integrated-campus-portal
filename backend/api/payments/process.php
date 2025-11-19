<?php
/**
 * Student Payment Processing API (Simulation)
 * Method: POST
 * Auth: Required (student)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

$user = verifyAuth();
if (!$user || $user['role'] !== 'student') {
    sendError('Unauthorized', 'unauthorized', 403);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['fee_id'], $data['amount'], $data['payment_method'])) {
    sendError('Missing required fields', 'missing_param', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $studentId = getStudentIdFromUserId($user['user_id'], $db);
    
    // Verify Fee
    $stmt = $db->prepare("SELECT * FROM fees WHERE id = ?");
    $stmt->execute([$data['fee_id']]);
    $fee = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$fee) {
        sendError('Fee record not found', 'not_found', 404);
    }

    // Simulate Transaction ID
    $txnId = 'TXN' . strtoupper(uniqid());
    $receiptNo = generateReceiptNumber($db);

    // Insert Payment
    // Note: For this simple endpoint, we assume amount_paid covers the full requirement or is a partial payment.
    // total_amount usually equals amount_paid unless we are tracking fine logic here.
    $query = "INSERT INTO payments (student_id, fee_id, amount_paid, total_amount, payment_date, payment_method, transaction_id, status, receipt_number, remarks) 
              VALUES (:sid, :fid, :amount, :amount, CURRENT_DATE, :method, :txn, 'completed', :receipt, 'Online Payment')";
              
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':sid' => $studentId,
        ':fid' => $data['fee_id'],
        ':amount' => $data['amount'],
        ':method' => $data['payment_method'],
        ':txn' => $txnId,
        ':receipt' => $receiptNo
    ]);
    
    // Update Fee Status (Simplified logic: if paid >= amount, marked as paid)
    // Real logic should check total paid vs total due
    
    sendSuccess([
        'message' => 'Payment processed successfully',
        'transaction_id' => $txnId,
        'receipt_number' => $receiptNo
    ]);

} catch (Exception $e) {
    sendError($e->getMessage(), 'server_error', 500);
}
