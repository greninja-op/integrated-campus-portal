<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$user = verifyAuth();
if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit();
}

if (!in_array($user['role'], ['teacher', 'staff'])) {
    echo json_encode(['success' => false, 'message' => 'Access denied. Teacher role required.']);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare("SELECT id FROM teachers WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$teacher) {
        echo json_encode(['success' => false, 'message' => 'Teacher not found']);
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true);
    
    $studentId = $data['student_id'] ?? null;
    $subjectId = $data['subject_id'] ?? null;
    $semester = $data['semester'] ?? null;
    $sessionId = $data['session_id'] ?? 1;
    $esaMarks = $data['esa_marks'] ?? null;
    $isaMarks = $data['isa_marks'] ?? null;

    if (!$studentId || !$subjectId || !$semester || $esaMarks === null || $isaMarks === null) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit();
    }

    // Get subject credit
    $stmt = $db->prepare("SELECT credit_hours FROM subjects WHERE id = ?");
    $stmt->execute([$subjectId]);
    $subject = $stmt->fetch(PDO::FETCH_ASSOC);
    $credit = $subject['credit_hours'] ?? 4;

    // Calculate totals
    $totalMarks = $esaMarks + $isaMarks;
    
    // Determine grade and GP
    $gradeData = calculateGrade($totalMarks);
    $letterGrade = $gradeData['grade'];
    $gradePoint = $gradeData['gp'];
    $creditPoints = $credit * $gradePoint;

    // Insert or update
    $stmt = $db->prepare("
        INSERT INTO marks (student_id, subject_id, session_id, semester, esa_marks, isa_marks, 
                          internal_marks, external_marks, total_marks, grade_point, letter_grade, 
                          credit_points, entered_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            esa_marks = VALUES(esa_marks),
            isa_marks = VALUES(isa_marks),
            internal_marks = VALUES(internal_marks),
            external_marks = VALUES(external_marks),
            total_marks = VALUES(total_marks),
            grade_point = VALUES(grade_point),
            letter_grade = VALUES(letter_grade),
            credit_points = VALUES(credit_points),
            updated_at = CURRENT_TIMESTAMP
    ");
    
    $stmt->execute([
        $studentId, $subjectId, $sessionId, $semester,
        $isaMarks, $esaMarks, $isaMarks, $esaMarks,
        $totalMarks, $gradePoint, $letterGrade, $creditPoints, $teacher['id']
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Semester marks entered successfully',
        'data' => [
            'total' => $totalMarks,
            'grade' => $letterGrade,
            'gp' => $gradePoint,
            'cp' => $creditPoints
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function calculateGrade($total) {
    if ($total >= 90) return ['grade' => 'A+', 'gp' => 9];
    if ($total >= 80) return ['grade' => 'A', 'gp' => 8];
    if ($total >= 70) return ['grade' => 'B+', 'gp' => 7];
    if ($total >= 60) return ['grade' => 'B', 'gp' => 6];
    if ($total >= 50) return ['grade' => 'C', 'gp' => 5];
    if ($total >= 40) return ['grade' => 'D', 'gp' => 4];
    return ['grade' => 'F', 'gp' => 0];
}
?>
