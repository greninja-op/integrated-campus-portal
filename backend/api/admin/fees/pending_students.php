<?php
/**
 * List Pending Fee Students API
 * Returns list of students who have pending fees
 * Method: GET
 * Auth: Required (admin role)
 */

require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';

$user = verifyAuth();
if (!$user || $user['role'] !== 'admin') {
    sendError('Unauthorized', 'unauthorized', 403);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get active session
    $session = getActiveSession($db);
    if (!$session) {
        sendError('No active session found', 'no_session', 404);
    }
    $sessionId = $session['id'];
    
    // Get filters
    $department = isset($_GET['department']) && $_GET['department'] !== 'all' ? $_GET['department'] : null;
    $feeType = isset($_GET['fee_type']) && $_GET['fee_type'] !== 'all' ? $_GET['fee_type'] : null;
    
    // 1. Get all applicable fees for the current session
    $feesQuery = "SELECT * FROM fees WHERE session_id = :session_id AND is_active = 1";
    $feesParams = [':session_id' => $sessionId];
    
    if ($department) {
        $feesQuery .= " AND (department IS NULL OR department = :department)";
        $feesParams[':department'] = $department;
    }
    
    if ($feeType) {
        $feesQuery .= " AND fee_type = :fee_type";
        $feesParams[':fee_type'] = $feeType;
    }
    
    $feesStmt = $db->prepare($feesQuery);
    $feesStmt->execute($feesParams);
    $fees = $feesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $pendingStudents = [];
    
    // 2. For each fee, find students who match the criteria (dept/sem) and haven't paid
    foreach ($fees as $fee) {
        // Build student query based on fee criteria
        $studentQuery = "SELECT s.id, s.student_id, s.first_name, s.last_name, s.department, s.semester, s.batch_year, u.email 
                         FROM students s 
                         JOIN users u ON s.user_id = u.id 
                         WHERE s.session_id = :session_id";
        
        $studentParams = [':session_id' => $sessionId];
        
        if ($fee['department']) {
            $studentQuery .= " AND s.department = :department";
            $studentParams[':department'] = $fee['department'];
        }
        
        if ($fee['semester']) {
            $studentQuery .= " AND s.semester = :semester";
            $studentParams[':semester'] = $fee['semester'];
        }
        
        // Check payment status
        // We want students who do NOT have a 'completed' payment for this fee
        $studentQuery .= " AND NOT EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.student_id = s.id 
                            AND p.fee_id = :fee_id 
                            AND p.status = 'completed'
                           )";
        $studentParams[':fee_id'] = $fee['id'];
        
        $stmt = $db->prepare($studentQuery);
        $stmt->execute($studentParams);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($students as $student) {
            // Calculate fine if applicable
            $fine = 0;
            $dueDate = new DateTime($fee['due_date']);
            $today = new DateTime();
            
            if ($today > $dueDate) {
                $daysLate = $today->diff($dueDate)->days;
                if ($fee['late_fine_per_day'] > 0) {
                    $fine = min($daysLate * $fee['late_fine_per_day'], $fee['max_late_fine'] > 0 ? $fee['max_late_fine'] : PHP_FLOAT_MAX);
                }
            }
            
            $pendingStudents[] = [
                'id' => $student['id'], // Student DB ID
                'rollNo' => $student['student_id'],
                'name' => $student['first_name'] . ' ' . $student['last_name'],
                'department' => $student['department'],
                'semester' => $student['semester'],
                'year' => ceil($student['semester'] / 2), // Approx year
                'feeType' => $fee['fee_name'],
                'amount' => (float)$fee['amount'],
                'dueDate' => $fee['due_date'],
                'fineAmount' => $fine,
                'superFineAmount' => (float)$fee['max_late_fine'],
                'feeId' => $fee['id']
            ];
        }
    }
    
    sendSuccess(['students' => $pendingStudents]);
    
} catch (Exception $e) {
    logError($e->getMessage());
    sendError('Server error', 'server_error', 500);
}
