<?php
/**
 * Get Fees API
 * Returns applicable fees for student with late fine calculations
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
    // IDOR Protection: Derive student_id from authenticated user_id
    $studentId = getStudentIdFromUserId($user['user_id'], $db);
    if (!$studentId) {
        // Admin override for viewing specific student fees
        if ($user['role'] === 'admin' && isset($_GET['student_id'])) {
            $studentId = (int) $_GET['student_id'];
            // Verify student exists
            $checkStmt = $db->prepare("SELECT id FROM students WHERE id = :id");
            $checkStmt->bindParam(':id', $studentId, PDO::PARAM_INT);
            $checkStmt->execute();
            if ($checkStmt->rowCount() === 0) {
                sendError('Student not found', 'not_found', 404);
            }
        } else if ($user['role'] === 'admin') {
             sendError('Student ID is required for admin', 'missing_param', 400);
        } else {
             sendError('Student record not found for this user', 'not_found', 404);
        }
    }
    
    // Get student details
    $studentQuery = "SELECT semester, department, program FROM students WHERE id = :student_id";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        sendError('Student details not found', 'not_found', 404);
    }
    
    // Get active session
    $session = getActiveSession($db);
    if (!$session) {
        sendError('No active academic session found', 'no_active_session', 404);
    }
    $sessionId = $session['id'];
    
    // Query fees applicable to this student
    $query = "SELECT 
                f.id,
                f.fee_type,
                f.fee_name,
                f.amount,
                f.due_date,
                f.late_fine_per_day,
                f.max_late_fine,
                f.description,
                f.semester,
                p.id as payment_id,
                p.status as payment_status,
                p.amount_paid,
                p.late_fine as paid_late_fine,
                p.payment_date,
                p.receipt_number,
                CASE 
                    WHEN CURDATE() > f.due_date AND p.id IS NULL
                    THEN LEAST(DATEDIFF(CURDATE(), f.due_date) * f.late_fine_per_day, f.max_late_fine)
                    ELSE 0 
                END as current_late_fine
              FROM fees f
              LEFT JOIN payments p ON f.id = p.fee_id AND p.student_id = :student_id
              WHERE f.session_id = :session_id
              AND f.is_active = 1
              AND (f.semester IS NULL OR f.semester = :semester)
              AND (f.department IS NULL OR f.department = :department)
              AND (f.program IS NULL OR f.program = :program)
              ORDER BY f.due_date, f.fee_type";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
    $stmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
    $stmt->bindParam(':semester', $student['semester'], PDO::PARAM_INT);
    $stmt->bindParam(':department', $student['department'], PDO::PARAM_STR);
    $stmt->bindParam(':program', $student['program'], PDO::PARAM_STR);
    $stmt->execute();
    
    $fees = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate summary statistics
    $totalPending = 0.0;
    $totalPaid = 0.0;
    $totalLateFines = 0.0;
    $pendingCount = 0;
    $paidCount = 0;
    
    foreach ($fees as &$fee) {
        // Convert to proper types
        $fee['amount'] = (float) $fee['amount'];
        $fee['late_fine_per_day'] = (float) $fee['late_fine_per_day'];
        $fee['max_late_fine'] = (float) $fee['max_late_fine'];
        $fee['current_late_fine'] = (float) $fee['current_late_fine'];
        $fee['semester'] = $fee['semester'] ? (int) $fee['semester'] : null;
        
        // Determine payment status
        if ($fee['payment_id']) {
            $fee['status'] = 'paid';
            $fee['amount_paid'] = (float) $fee['amount_paid'];
            $fee['paid_late_fine'] = (float) $fee['paid_late_fine'];
            $totalPaid += $fee['amount_paid'];
            $paidCount++;
        } else {
            $fee['status'] = 'pending';
            $totalPending += $fee['amount'] + $fee['current_late_fine'];
            $totalLateFines += $fee['current_late_fine'];
            $pendingCount++;
            
            // Remove payment fields if not paid
            unset($fee['payment_id']);
            unset($fee['payment_status']);
            unset($fee['amount_paid']);
            unset($fee['paid_late_fine']);
            unset($fee['payment_date']);
            unset($fee['receipt_number']);
        }
    }
    
    // Prepare response
    $response = [
        'fees' => $fees,
        'summary' => [
            'total_fees' => count($fees),
            'pending_count' => $pendingCount,
            'paid_count' => $paidCount,
            'total_pending' => round($totalPending, 2),
            'total_paid' => round($totalPaid, 2),
            'total_late_fines' => round($totalLateFines, 2)
        ]
    ];
    
    sendSuccess($response);
    
} catch (PDOException $e) {
    logError('Database error in get_fees.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An error occurred while fetching fees', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in get_fees.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
