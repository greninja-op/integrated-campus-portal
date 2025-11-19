<?php
/**
 * Get Student Attendance History API
 * Fetches attendance history for a student
 * Method: GET
 * Auth: Required (student, teacher, admin)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized', 'unauthorized', 401);
}

$studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;

// If student is requesting, they can only see their own
if ($user['role'] === 'student') {
    // Get student's internal ID
    $database = new Database();
    $db = $database->getConnection();
    $stmt = $db->prepare("SELECT id FROM students WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        sendError('Student profile not found', 'not_found', 404);
    }
    $studentId = $student['id'];
} elseif (!$studentId) {
    sendError('Student ID is required', 'missing_param', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get active session
    $session = getActiveSession($db);
    $sessionId = $session ? $session['id'] : null;
    
    $query = "SELECT a.attendance_date, a.status, s.subject_name, s.subject_code 
              FROM attendance a
              JOIN subjects s ON a.subject_id = s.id
              WHERE a.student_id = :student_id";
              
    if ($sessionId) {
        $query .= " AND a.session_id = :session_id";
    }
    
    $query .= " ORDER BY a.attendance_date DESC, s.subject_name ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':student_id', $studentId);
    if ($sessionId) {
        $stmt->bindParam(':session_id', $sessionId);
    }
    
    $stmt->execute();
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Calculate stats
    $stats = [
        'total' => 0,
        'present' => 0,
        'absent' => 0,
        'late' => 0,
        'excused' => 0,
        'percentage' => 0
    ];
    
    foreach ($history as $record) {
        $stats['total']++;
        $stats[$record['status']]++;
    }
    
    if ($stats['total'] > 0) {
        $stats['percentage'] = round(($stats['present'] / $stats['total']) * 100, 2);
    }
    
    sendSuccess(['history' => $history, 'stats' => $stats]);
    
} catch (PDOException $e) {
    logError('Database error: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
}
