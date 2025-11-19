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

// Get required parameters
$metric = isset($_GET['metric']) ? trim(htmlspecialchars(strip_tags($_GET['metric']))) : null;
$period = isset($_GET['period']) ? trim(htmlspecialchars(strip_tags($_GET['period']))) : 'monthly';

// Validate metric parameter
$validMetrics = ['attendance', 'performance', 'payments'];
if (!$metric || !in_array($metric, $validMetrics)) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => 'invalid_metric', 
        'message' => 'Invalid metric. Must be one of: attendance, performance, payments'
    ]);
    exit();
}

// Validate period parameter
$validPeriods = ['monthly', 'semester'];
if (!in_array($period, $validPeriods)) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'error' => 'invalid_period', 
        'message' => 'Invalid period. Must be one of: monthly, semester'
    ]);
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
    $trendData = [];
    
    // Handle different metrics
    if ($metric === 'attendance') {
        if ($period === 'monthly') {
            // Monthly attendance trends
            $query = "SELECT 
                DATE_FORMAT(a.attendance_date, '%Y-%m') as period,
                COUNT(*) as total_records,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
                ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_percentage
            FROM attendance a
            WHERE a.session_id = :session_id
            GROUP BY DATE_FORMAT(a.attendance_date, '%Y-%m')
            ORDER BY period";
        } else {
            // Semester attendance trends
            $query = "SELECT 
                a.semester as period,
                COUNT(*) as total_records,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
                ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_percentage
            FROM attendance a
            WHERE a.session_id = :session_id
            GROUP BY a.semester
            ORDER BY a.semester";
        }
        
        $stmt = $db->prepare($query);
        $stmt->execute([':session_id' => $session_id]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate percentage changes
        for ($i = 0; $i < count($results); $i++) {
            $current = $results[$i];
            $trendItem = [
                'period' => $current['period'],
                'value' => floatval($current['attendance_percentage']),
                'total_records' => intval($current['total_records']),
                'present_count' => intval($current['present_count'])
            ];
            
            if ($i > 0) {
                $previous = $results[$i - 1];
                $previousValue = floatval($previous['attendance_percentage']);
                $currentValue = floatval($current['attendance_percentage']);
                
                if ($previousValue > 0) {
                    $percentageChange = (($currentValue - $previousValue) / $previousValue) * 100;
                    $trendItem['percentage_change'] = round($percentageChange, 2);
                    $trendItem['trend'] = $percentageChange > 0 ? 'up' : ($percentageChange < 0 ? 'down' : 'stable');
                }
            }
            
            $trendData[] = $trendItem;
        }
        
    } elseif ($metric === 'performance') {
        if ($period === 'monthly') {
            // Monthly performance trends (based on marks entry date)
            $query = "SELECT 
                DATE_FORMAT(m.created_at, '%Y-%m') as period,
                ROUND(AVG(m.grade_point), 2) as average_gpa,
                COUNT(DISTINCT m.student_id) as student_count,
                COUNT(*) as marks_count
            FROM marks m
            WHERE m.session_id = :session_id
            GROUP BY DATE_FORMAT(m.created_at, '%Y-%m')
            ORDER BY period";
        } else {
            // Semester performance trends
            $query = "SELECT 
                m.semester as period,
                ROUND(AVG(m.grade_point), 2) as average_gpa,
                COUNT(DISTINCT m.student_id) as student_count,
                COUNT(*) as marks_count
            FROM marks m
            WHERE m.session_id = :session_id
            GROUP BY m.semester
            ORDER BY m.semester";
        }
        
        $stmt = $db->prepare($query);
        $stmt->execute([':session_id' => $session_id]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate percentage changes
        for ($i = 0; $i < count($results); $i++) {
            $current = $results[$i];
            $trendItem = [
                'period' => $current['period'],
                'value' => floatval($current['average_gpa']),
                'student_count' => intval($current['student_count']),
                'marks_count' => intval($current['marks_count'])
            ];
            
            if ($i > 0) {
                $previous = $results[$i - 1];
                $previousValue = floatval($previous['average_gpa']);
                $currentValue = floatval($current['average_gpa']);
                
                if ($previousValue > 0) {
                    $percentageChange = (($currentValue - $previousValue) / $previousValue) * 100;
                    $trendItem['percentage_change'] = round($percentageChange, 2);
                    $trendItem['trend'] = $percentageChange > 0 ? 'up' : ($percentageChange < 0 ? 'down' : 'stable');
                }
            }
            
            $trendData[] = $trendItem;
        }
        
    } elseif ($metric === 'payments') {
        if ($period === 'monthly') {
            // Monthly payment trends
            $query = "SELECT 
                DATE_FORMAT(p.payment_date, '%Y-%m') as period,
                SUM(p.total_amount) as total_amount,
                SUM(p.late_fine) as total_late_fines,
                COUNT(*) as payment_count
            FROM payments p
            JOIN fees f ON p.fee_id = f.id
            WHERE p.status = 'completed'
            AND f.session_id = :session_id
            GROUP BY DATE_FORMAT(p.payment_date, '%Y-%m')
            ORDER BY period";
        } else {
            // Semester payment trends
            $query = "SELECT 
                f.semester as period,
                SUM(p.total_amount) as total_amount,
                SUM(p.late_fine) as total_late_fines,
                COUNT(*) as payment_count
            FROM payments p
            JOIN fees f ON p.fee_id = f.id
            WHERE p.status = 'completed'
            AND f.session_id = :session_id
            AND f.semester IS NOT NULL
            GROUP BY f.semester
            ORDER BY f.semester";
        }
        
        $stmt = $db->prepare($query);
        $stmt->execute([':session_id' => $session_id]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Calculate percentage changes
        for ($i = 0; $i < count($results); $i++) {
            $current = $results[$i];
            $trendItem = [
                'period' => $current['period'],
                'value' => round(floatval($current['total_amount']), 2),
                'late_fines' => round(floatval($current['total_late_fines']), 2),
                'payment_count' => intval($current['payment_count'])
            ];
            
            if ($i > 0) {
                $previous = $results[$i - 1];
                $previousValue = floatval($previous['total_amount']);
                $currentValue = floatval($current['total_amount']);
                
                if ($previousValue > 0) {
                    $percentageChange = (($currentValue - $previousValue) / $previousValue) * 100;
                    $trendItem['percentage_change'] = round($percentageChange, 2);
                    $trendItem['trend'] = $percentageChange > 0 ? 'up' : ($percentageChange < 0 ? 'down' : 'stable');
                }
            }
            
            $trendData[] = $trendItem;
        }
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'metric' => $metric,
            'period' => $period,
            'trends' => $trendData
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in trends report: " . $e->getMessage());
    http_response_code(500);
    // Don't leak exception message in production
    echo json_encode(['success' => false, 'error' => 'database_error', 'message' => 'An error occurred while generating the report']);
}
?>
