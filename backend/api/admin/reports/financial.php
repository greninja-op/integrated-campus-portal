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
$start_date = isset($_GET['start_date']) ? trim(htmlspecialchars(strip_tags($_GET['start_date']))) : null;
$end_date = isset($_GET['end_date']) ? trim(htmlspecialchars(strip_tags($_GET['end_date']))) : null;
$department = isset($_GET['department']) ? trim(htmlspecialchars(strip_tags($_GET['department']))) : null;

// Validate date format if provided
if ($start_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $start_date)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid_date', 'message' => 'Invalid start_date format. Use YYYY-MM-DD']);
    exit();
}

if ($end_date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end_date)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid_date', 'message' => 'Invalid end_date format. Use YYYY-MM-DD']);
    exit();
}

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
    
    // Build query for financial report
    $query = "SELECT 
        f.fee_type,
        SUM(CASE WHEN p.status = 'completed' THEN p.total_amount ELSE 0 END) as collected,
        SUM(CASE WHEN p.status IS NULL OR p.status = 'pending' THEN f.amount ELSE 0 END) as pending,
        SUM(CASE WHEN p.status = 'completed' THEN p.late_fine ELSE 0 END) as late_fines,
        COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_payments,
        COUNT(DISTINCT f.id) as total_fees
    FROM fees f
    LEFT JOIN payments p ON f.id = p.fee_id
    WHERE f.session_id = :session_id
    AND f.is_active = 1";
    
    $params = [':session_id' => $session_id];
    
    // Add date range filter
    if ($start_date && $end_date) {
        $query .= " AND f.due_date BETWEEN :start_date AND :end_date";
        $params[':start_date'] = $start_date;
        $params[':end_date'] = $end_date;
    } elseif ($start_date) {
        $query .= " AND f.due_date >= :start_date";
        $params[':start_date'] = $start_date;
    } elseif ($end_date) {
        $query .= " AND f.due_date <= :end_date";
        $params[':end_date'] = $end_date;
    }
    
    // Add department filter
    if ($department !== null) {
        $query .= " AND (f.department IS NULL OR f.department = :department)";
        $params[':department'] = $department;
    }
    
    $query .= " GROUP BY f.fee_type
                ORDER BY f.fee_type";
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $paymentBreakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate totals
    $total_collected = 0;
    $total_pending = 0;
    $total_late_fines = 0;
    
    foreach ($paymentBreakdown as $row) {
        $total_collected += floatval($row['collected']);
        $total_pending += floatval($row['pending']);
        $total_late_fines += floatval($row['late_fines']);
    }
    
    // Get payment statistics by month (if date range provided)
    $monthlyStats = [];
    if ($start_date && $end_date) {
        $monthlyQuery = "SELECT 
            DATE_FORMAT(p.payment_date, '%Y-%m') as month,
            SUM(p.total_amount) as amount,
            COUNT(*) as payment_count
        FROM payments p
        JOIN fees f ON p.fee_id = f.id
        WHERE p.status = 'completed'
        AND p.payment_date BETWEEN :start_date AND :end_date
        AND f.session_id = :session_id";
        
        $monthlyParams = [
            ':start_date' => $start_date,
            ':end_date' => $end_date,
            ':session_id' => $session_id
        ];
        
        if ($department !== null) {
            $monthlyQuery .= " AND (f.department IS NULL OR f.department = :department)";
            $monthlyParams[':department'] = $department;
        }
        
        $monthlyQuery .= " GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m')
                          ORDER BY month";
        
        $monthlyStmt = $db->prepare($monthlyQuery);
        $monthlyStmt->execute($monthlyParams);
        $monthlyStats = $monthlyStmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'period' => [
                'start_date' => $start_date,
                'end_date' => $end_date
            ],
            'total_collected' => round($total_collected, 2),
            'total_pending' => round($total_pending, 2),
            'total_late_fines' => round($total_late_fines, 2),
            'payment_breakdown' => array_map(function($row) {
                return [
                    'fee_type' => $row['fee_type'],
                    'collected' => round(floatval($row['collected']), 2),
                    'pending' => round(floatval($row['pending']), 2),
                    'late_fines' => round(floatval($row['late_fines']), 2),
                    'completed_payments' => intval($row['completed_payments']),
                    'total_fees' => intval($row['total_fees'])
                ];
            }, $paymentBreakdown),
            'monthly_stats' => array_map(function($row) {
                return [
                    'month' => $row['month'],
                    'amount' => round(floatval($row['amount']), 2),
                    'payment_count' => intval($row['payment_count'])
                ];
            }, $monthlyStats)
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in financial report: " . $e->getMessage());
    http_response_code(500);
    // Don't leak exception message in production
    echo json_encode(['success' => false, 'error' => 'database_error', 'message' => 'An error occurred while generating the report']);
}
?>
