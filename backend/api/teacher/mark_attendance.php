<?php
/**
 * Mark Attendance API
 * Allows teachers to mark attendance for multiple students
 * Method: POST
 * Auth: Required (teacher role)
 * Body: { subject_id, attendance_date, attendance: [{student_id, status, remarks?}] }
 */

// Include required files
require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';
require_once '../../includes/validation.php';

// Verify authentication
$user = verifyAuth();
if (!$user) {
    sendError('Unauthorized - Invalid or missing token', 'unauthorized', 401);
}

// Check role
if ($user['role'] !== 'teacher') {
    sendError('Forbidden - This endpoint is only accessible to teachers', 'forbidden', 403);
}

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    sendError('Invalid JSON data', 'invalid_json', 400);
}

try {
    // Validate required fields
    $required = ['subject_id', 'attendance_date', 'attendance'];
    $missing = validateRequired($required, $data);
    
    if (!empty($missing)) {
        sendError('Missing required fields: ' . implode(', ', $missing), 'validation_error', 400, ['missing_fields' => $missing]);
    }
    
    // Validate data types and format
    $subjectId = (int) $data['subject_id'];
    $attendanceDate = trim($data['attendance_date']);
    $attendanceRecords = $data['attendance'];
    
    // Validate date format
    if (!validateDate($attendanceDate)) {
        sendError('Invalid date format. Use YYYY-MM-DD', 'invalid_date', 400);
    }
    
    // Check if date is not in the future
    if (strtotime($attendanceDate) > time()) {
        sendError('Cannot mark attendance for future dates', 'future_date', 400);
    }
    
    // Validate attendance array
    if (!is_array($attendanceRecords) || empty($attendanceRecords)) {
        sendError('Attendance records must be a non-empty array', 'invalid_attendance', 400);
    }
    
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get active session
    $session = getActiveSession($db);
    if (!$session) {
        sendError('No active academic session found', 'no_active_session', 404);
    }
    $sessionId = $session['id'];
    
    // Verify subject exists
    $subjectCheck = $db->prepare("SELECT id FROM subjects WHERE id = :id");
    $subjectCheck->bindParam(':id', $subjectId, PDO::PARAM_INT);
    $subjectCheck->execute();
    
    if ($subjectCheck->rowCount() === 0) {
        sendError('Subject not found', 'subject_not_found', 404);
    }
    
    // Prepare counters
    $successCount = 0;
    $updatedCount = 0;
    $errorCount = 0;
    $statusCounts = [
        'present' => 0,
        'absent' => 0,
        'late' => 0,
        'excused' => 0
    ];
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        foreach ($attendanceRecords as $record) {
            // Validate record structure
            if (!isset($record['student_id']) || !isset($record['status'])) {
                $errorCount++;
                continue;
            }
            
            $studentId = (int) $record['student_id'];
            $status = strtolower(trim($record['status']));
            $remarks = isset($record['remarks']) ? trim($record['remarks']) : null;
            
            // Validate status
            $validStatuses = ['present', 'absent', 'late', 'excused'];
            if (!in_array($status, $validStatuses)) {
                $errorCount++;
                continue;
            }
            
            // Verify student exists
            $studentCheck = $db->prepare("SELECT id FROM students WHERE id = :id");
            $studentCheck->bindParam(':id', $studentId, PDO::PARAM_INT);
            $studentCheck->execute();
            
            if ($studentCheck->rowCount() === 0) {
                $errorCount++;
                continue;
            }
            
            // Use ON DUPLICATE KEY UPDATE to handle race conditions and simplify logic
            $query = "INSERT INTO attendance 
                     (student_id, subject_id, session_id, attendance_date, status, remarks, marked_by, marked_at)
                     VALUES 
                     (:student_id, :subject_id, :session_id, :attendance_date, :status, :remarks, :marked_by, NOW())
                     ON DUPLICATE KEY UPDATE
                     status = VALUES(status),
                     remarks = VALUES(remarks),
                     marked_by = VALUES(marked_by),
                     marked_at = NOW()";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
            $stmt->bindParam(':subject_id', $subjectId, PDO::PARAM_INT);
            $stmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
            $stmt->bindParam(':attendance_date', $attendanceDate, PDO::PARAM_STR);
            $stmt->bindParam(':status', $status, PDO::PARAM_STR);
            $stmt->bindParam(':remarks', $remarks, PDO::PARAM_STR);
            $stmt->bindParam(':marked_by', $user['user_id'], PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                // Check if it was an insert or update
                if ($stmt->rowCount() == 1) {
                    $successCount++;
                } else {
                    $updatedCount++;
                }
                $statusCounts[$status]++;
            }
        }
        
        // Commit transaction
        $db->commit();
        
        // Prepare response
        $response = [
            'subject_id' => $subjectId,
            'attendance_date' => $attendanceDate,
            'total_records' => count($attendanceRecords),
            'created' => $successCount,
            'updated' => $updatedCount,
            'errors' => $errorCount,
            'status_breakdown' => $statusCounts
        ];
        
        sendSuccess($response, 201);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $db->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    logError('Database error in mark_attendance.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id'],
        'subject_id' => $subjectId ?? null,
        'date' => $attendanceDate ?? null
    ]);
    sendError('An error occurred while marking attendance', 'database_error', 500);
} catch (Exception $e) {
    logError('Error in mark_attendance.php: ' . $e->getMessage(), [
        'user_id' => $user['user_id']
    ]);
    sendError('An unexpected error occurred', 'server_error', 500);
}
