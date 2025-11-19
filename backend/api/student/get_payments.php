<?php
/**
 * Get Payments API
 * Returns student payment history
 * Method: GET
 * Auth: Required (student role)
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
    $studentId = getStudentIdFromUserId($user['user_id'], $db);
    if (!$studentId) {
        sendError('Student record not found', 'not_found', 404);
    }
    
    // Query payments with fee details
    $query = "SELECT 
                p.id,
                p.receipt_number,
                p.amount_paid,
                p.late_fine,
                p.total_amount,
                p.payment_date,
                p.payment_method,
                p.transaction_id,
                p.status,
                p.remarks,
                f.fee_type,
                f.fee_name,
                f.semester,
                f.due_date
              FROM payments p
              JOIN fees f ON p.fee_id = f.id
              WHERE p.student_id = :student_id
              ORDER BY p.payment_date DESC, p.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $stmt->execute();
    
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate summary statistics
    $totalPaid = 0.0;
    $totalLateFines = 0.0;
    $completedCount = 0;
    $pendingCount = 0;
    
    foreach ($payments as &$payment) {
        // Convert to proper types
        $payment['amount_paid'] = (float) $payment['amount_paid'];
        $payment['late_fine'] = (float) $payment['late_fine'];
        $payment['total_amount'] = (float) $payment['total_amount'];
        $payment['semester'] = $payment['semester'] ? (int) $payment['semester'] : null;
        
        // Calculate totals
        if ($payment['status'] === 'completed') {
            $totalPaid += $payment['total_amount'];
            $totalLateFines += $payment['late_fine'];
            $completedCount++;
        } elseif ($payment['status'] === 'pending') {
            $pendingCount++;
        }
    }
    
    // Prepare response
    $response = [
        'payments' => $payments,
        'summary' => [
            'total_payments' => count($payments),
            'completed_count' => $completedCount,
            'pending_count' => $pendingCount,
            'total_paid' => round($totalPaid, 2),
            'total_late_fines' => round($totalLateFines, 2)
        ]
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in get_payments.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An error occurred while fetching payments', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in get_payments.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
