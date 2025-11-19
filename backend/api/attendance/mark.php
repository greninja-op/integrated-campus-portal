<?php
/**
 * Mark Attendance API
 * Marks attendance for multiple students
 * Method: POST
 * Auth: Required (teacher or admin)
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';
require_once '../../includes/validation.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized', 'unauthorized', 401);
}

// Check role
if (!in_array($user['role'], ['teacher', 'admin'])) {
    sendError('Forbidden', 'forbidden', 403);
}

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    sendError('Invalid JSON data', 'invalid_json', 400);
}

// Validate required fields
$required = ['subject_id', 'date', 'attendance'];
$missing = validateRequired($required, $data);

if (!empty($missing)) {
    sendError('Missing required fields: ' . implode(', ', $missing), 'validation_error', 400);
}

$subjectId = (int)$data['subject_id'];
$date = trim($data['date']);
$attendanceData = $data['attendance']; // Array of student_id => status

if (!validateDate($date)) {
    sendError('Invalid date format', 'invalid_date', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get active session
    $session = getActiveSession($db);
    if (!$session) {
        sendError('No active academic session found', 'no_active_session', 404);
    }
    $sessionId = $session['id'];
    
    // Start transaction
    $db->beginTransaction();
    
    $query = "INSERT INTO attendance (student_id, subject_id, session_id, attendance_date, status, marked_by) 
              VALUES (:student_id, :subject_id, :session_id, :attendance_date, :status, :marked_by)
              ON DUPLICATE KEY UPDATE status = :status_update, marked_by = :marked_by_update, marked_at = CURRENT_TIMESTAMP";
    
    $stmt = $db->prepare($query);
    
    $markedCount = 0;
    
    foreach ($attendanceData as $studentId => $status) {
        // Validate status
        $validStatuses = ['present', 'absent', 'late', 'excused'];
        if (!in_array($status, $validStatuses)) {
            continue; // Skip invalid status
        }
        
        // Get internal student ID from student_id string (e.g., STU001) or int ID
        // Assuming frontend sends the internal ID (primary key) or we need to lookup
        // Let's assume frontend sends the internal ID for now, or we lookup if it's a string
        
        // If studentId is string like 'STU...', lookup ID
        if (!is_numeric($studentId)) {
            $stuStmt = $db->prepare("SELECT id FROM students WHERE student_id = ?");
            $stuStmt->execute([$studentId]);
            $stuRow = $stuStmt->fetch(PDO::FETCH_ASSOC);
            if ($stuRow) {
                $dbStudentId = $stuRow['id'];
            } else {
                continue; // Student not found
            }
        } else {
            $dbStudentId = $studentId;
        }
        
        $stmt->bindParam(':student_id', $dbStudentId);
        $stmt->bindParam(':subject_id', $subjectId);
        $stmt->bindParam(':session_id', $sessionId);
        $stmt->bindParam(':attendance_date', $date);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':marked_by', $user['user_id']);
        $stmt->bindParam(':status_update', $status);
        $stmt->bindParam(':marked_by_update', $user['user_id']);
        
        if ($stmt->execute()) {
            $markedCount++;
        }
    }
    
    $db->commit();
    
    sendSuccess(['message' => "Attendance marked for $markedCount students", 'count' => $markedCount]);
    
} catch (PDOException $e) {
    $db->rollBack();
    logError('Database error: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
} catch (Exception $e) {
    $db->rollBack();
    logError('Error: ' . $e->getMessage());
    sendError('Server error', 'server_error', 500);
}
