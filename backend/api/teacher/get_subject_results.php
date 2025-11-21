<?php
/**
 * Get Subject Results API
 * Fetches marks for all students in a specific subject/semester
 * Method: GET
 * Auth: Required (teacher)
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

if ($user['role'] !== 'teacher' && $user['role'] !== 'admin') {
    sendError('Forbidden', 'forbidden', 403);
}

$subjectCode = isset($_GET['subject_code']) ? trim($_GET['subject_code']) : null;
$semester = isset($_GET['semester']) ? (int)$_GET['semester'] : null;
$department = isset($_GET['department']) ? trim($_GET['department']) : null;

if (!$subjectCode || !$semester || !$department) {
    sendError('Subject code, Semester, and Department are required', 'missing_params', 400);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // 1. Get Subject ID
    $stmt = $db->prepare("SELECT id FROM subjects WHERE subject_code = :code");
    $stmt->execute([':code' => $subjectCode]);
    $subject = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$subject) {
        sendError('Subject not found', 'not_found', 404);
    }
    $subjectId = $subject['id'];

    // 2. Get Students and Marks
    // We join students with marks. LEFT JOIN ensures we see all students even if no marks yet.
    $query = "SELECT
                s.id,
                s.student_id as roll_number,
                CONCAT(s.first_name, ' ', s.last_name) as full_name,
                m.internal_marks,
                m.external_marks,
                m.total_marks,
                m.letter_grade,
                m.remarks
              FROM students s
              LEFT JOIN marks m ON s.id = m.student_id AND m.subject_id = :subject_id
              WHERE s.department = :dept AND s.semester = :sem
              ORDER BY s.student_id ASC";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':subject_id' => $subjectId,
        ':dept' => $department,
        ':sem' => $semester
    ]);

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format numbers
    foreach ($results as &$row) {
        $row['internal_marks'] = $row['internal_marks'] !== null ? (float)$row['internal_marks'] : null;
        $row['external_marks'] = $row['external_marks'] !== null ? (float)$row['external_marks'] : null;
        $row['total_marks'] = $row['total_marks'] !== null ? (float)$row['total_marks'] : null;
    }

    sendSuccess(['results' => $results]);

} catch (PDOException $e) {
    logError('Database error: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
}
