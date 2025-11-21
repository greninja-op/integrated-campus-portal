<?php
/**
 * Get GPA Trend API
 * Returns GPA for each semester the student has completed
 */

require_once '../../config/database.php';
require_once '../../includes/cors.php';
require_once '../../includes/auth.php';
require_once '../../includes/functions.php';
require_once '../../includes/grade_calculator.php';

// Verify authentication
$user = verifyAuth();
if (!$user || $user['role'] !== 'student') {
    sendError('Unauthorized', 'unauthorized', 403);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $studentId = getStudentIdFromUserId($user['user_id'], $db);

    // Fetch all marks grouped by semester
    $query = "SELECT m.semester, m.grade_point, s.credit_hours
              FROM marks m
              JOIN subjects s ON m.subject_id = s.id
              WHERE m.student_id = :student_id
              ORDER BY m.semester ASC";

    $stmt = $db->prepare($query);
    $stmt->execute([':student_id' => $studentId]);
    $allMarks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Calculate GPA per semester
    $semesterData = [];
    foreach ($allMarks as $mark) {
        $sem = $mark['semester'];
        if (!isset($semesterData[$sem])) {
            $semesterData[$sem] = ['total_points' => 0, 'total_credits' => 0];
        }

        $credit = (int)$mark['credit_hours'];
        $gp = (float)$mark['grade_point'];

        $semesterData[$sem]['total_points'] += ($gp * $credit);
        $semesterData[$sem]['total_credits'] += $credit;
    }

    $trend = [];
    foreach ($semesterData as $sem => $data) {
        $gpa = $data['total_credits'] > 0 ? round($data['total_points'] / $data['total_credits'], 2) : 0;
        $trend[] = [
            'semester' => 'Sem ' . $sem,
            'gpa' => $gpa
        ];
    }

    // Ensure we return something even if empty
    if (empty($trend)) {
        $trend = []; // Or mock data? No, better to show empty state.
    }

    sendSuccess(['trend' => $trend]);

} catch (Exception $e) {
    sendError($e->getMessage(), 'server_error', 500);
}
