<?php
/**
 * List Payments API
 * Returns list of payment records with filters
 * Method: GET
 * Auth: Required (admin role)
 * Query Params: student_id, fee_id, status, start_date, end_date, page, limit
 */

// Include required files
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'admin') {
    sendError('Forbidden - This endpoint is only accessible to admins', 'forbidden', 403);
}

try {
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get query parameters
    $studentId = isset($_GET['student_id']) ? (int) $_GET['student_id'] : null;
    $feeId = isset($_GET['fee_id']) ? (int) $_GET['fee_id'] : null;
    $status = isset($_GET['status']) ? trim($_GET['status']) : null;
    $startDate = isset($_GET['start_date']) ? trim($_GET['start_date']) : null;
    $endDate = isset($_GET['end_date']) ? trim($_GET['end_date']) : null;
    $page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? min(100, max(1, (int) $_GET['limit'])) : 20;
    
    // Calculate offset
    $offset = getPaginationOffset($page, $limit);
    
    // Build base query
    $baseQuery = "FROM payments p
                  JOIN students s ON p.student_id = s.id
                  JOIN fees f ON p.fee_id = f.id
                  JOIN users u ON s.user_id = u.id
                  WHERE 1=1";
    
    $params = [];
    
    // Add filters
    if ($studentId !== null) {
        $baseQuery .= " AND p.student_id = :student_id";
        $params[':student_id'] = $studentId;
    }
    
    if ($feeId !== null) {
        $baseQuery .= " AND p.fee_id = :fee_id";
        $params[':fee_id'] = $feeId;
    }
    
    if ($status !== null) {
        $baseQuery .= " AND p.status = :status";
        $params[':status'] = $status;
    }
    
    if ($startDate !== null) {
        $baseQuery .= " AND p.payment_date >= :start_date";
        $params[':start_date'] = $startDate;
    }
    
    if ($endDate !== null) {
        $baseQuery .= " AND p.payment_date <= :end_date";
        $params[':end_date'] = $endDate;
    }
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total " . $baseQuery;
    $countStmt = $db->prepare($countQuery);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $totalCount = (int) $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get payments with pagination
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
                p.created_at,
                s.student_id as student_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.semester,
                s.department,
                f.fee_type,
                f.fee_name,
                f.amount as fee_amount,
                f.due_date
              " . $baseQuery . "
              ORDER BY p.payment_date DESC, p.created_at DESC
              LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert types
    foreach ($payments as &$payment) {
        $payment['amount_paid'] = (float) $payment['amount_paid'];
        $payment['late_fine'] = (float) $payment['late_fine'];
        $payment['total_amount'] = (float) $payment['total_amount'];
        $payment['fee_amount'] = (float) $payment['fee_amount'];
        $payment['semester'] = (int) $payment['semester'];
    }
    
    // Calculate summary statistics
    $totalPaid = 0;
    $totalLateFines = 0;
    
    foreach ($payments as $payment) {
        $totalPaid += $payment['total_amount'];
        $totalLateFines += $payment['late_fine'];
    }
    
    // Calculate pagination
    $totalPages = getTotalPages($totalCount, $limit);
    
    // Prepare response
    $response = [
        'payments' => $payments,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $totalCount,
            'total_pages' => $totalPages,
            'has_next' => $page < $totalPages,
            'has_previous' => $page > 1
        ],
        'summary' => [
            'total_payments' => count($payments),
            'total_amount_paid' => round($totalPaid, 2),
            'total_late_fines' => round($totalLateFines, 2)
        ],
        'filters' => [
            'student_id' => $studentId,
            'fee_id' => $feeId,
            'status' => $status,
            'start_date' => $startDate,
            'end_date' => $endDate
        ]
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in list payments: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An error occurred while fetching payments', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in list payments: ' . $e->getMessage(), [
        'admin_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
