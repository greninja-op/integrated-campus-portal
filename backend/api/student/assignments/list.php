<?php
/**
 * List Assignments for Student
 * Fetches assignments for subjects the student is enrolled in (based on semester/department)
 */

require_once __DIR__ . '/../../../includes/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../includes/auth.php';
require_once __DIR__ . '/../../../includes/functions.php';

$user = verifyAuth();
if (!$user || $user['role'] !== 'student') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $studentId = getStudentIdFromUserId($user['user_id'], $db);

    // Get student details (department, semester)
    $stmt = $db->prepare("SELECT department, semester FROM students WHERE id = ?");
    $stmt->execute([$studentId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        sendError('Student profile not found', 'not_found', 404);
    }

    // Fetch assignments for subjects in this department/semester
    // Also join with submissions to see status
    $query = "SELECT
                a.id, a.title, a.description, a.due_date, a.max_marks, a.created_at,
                s.subject_name, s.subject_code,
                sub.status as submission_status, sub.marks, sub.submitted_at, sub.feedback
              FROM assignments a
              JOIN subjects s ON a.subject_id = s.id
              LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = :student_id
              WHERE s.department = :dept AND s.semester = :sem
              ORDER BY a.due_date ASC";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':student_id' => $studentId,
        ':dept' => $student['department'],
        ':sem' => $student['semester']
    ]);

    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendSuccess(['assignments' => $assignments]);

} catch (Exception $e) {
    logError("Error listing assignments: " . $e->getMessage());
    sendError('Server error', 'server_error', 500);
}
