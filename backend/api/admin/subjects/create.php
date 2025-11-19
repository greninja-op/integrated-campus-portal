<?php
/**
 * Create Subject API - Admin creates new subject
 * Method: POST | Auth: admin
 */
require_once '../../../config/database.php';
require_once '../../../includes/cors.php';
require_once '../../../includes/auth.php';
require_once '../../../includes/functions.php';
require_once '../../../includes/validation.php';

$user = verifyAuth();
if (!$user || $user['role'] !== 'admin') sendError('Forbidden', 'forbidden', 403);

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) sendError('Invalid JSON', 'invalid_json', 400);

try {
    $required = ['subject_code', 'subject_name', 'credit_hours', 'semester'];
    $missing = validateRequired($required, $data);
    if (!empty($missing)) sendError('Missing: ' . implode(', ', $missing), 'validation_error', 400);
    
    $subjectCode = strtoupper(trim(htmlspecialchars(strip_tags($data['subject_code']))));
    $subjectName = trim(htmlspecialchars(strip_tags($data['subject_name'])));
    $creditHours = (int) $data['credit_hours'];
    $semester = (int) $data['semester'];
    $department = isset($data['department']) ? trim(htmlspecialchars(strip_tags($data['department']))) : null;
    $description = isset($data['description']) ? trim(htmlspecialchars(strip_tags($data['description']))) : null;
    
    if (!validateSemester($semester)) sendError('Invalid semester (1-6)', 'invalid_semester', 400);
    if ($creditHours < 1 || $creditHours > 6) sendError('Credit hours must be 1-6', 'invalid_credits', 400);
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Check duplicate
    $check = $db->prepare("SELECT id FROM subjects WHERE subject_code = :code");
    $check->bindParam(':code', $subjectCode);
    $check->execute();
    if ($check->rowCount() > 0) sendError('Subject code already exists', 'duplicate_code', 409);
    
    $query = "INSERT INTO subjects (subject_code, subject_name, credit_hours, department, semester, description, is_active)
              VALUES (:code, :name, :credits, :dept, :sem, :desc, 1)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':code', $subjectCode);
    $stmt->bindParam(':name', $subjectName);
    $stmt->bindParam(':credits', $creditHours, PDO::PARAM_INT);
    $stmt->bindParam(':dept', $department);
    $stmt->bindParam(':sem', $semester, PDO::PARAM_INT);
    $stmt->bindParam(':desc', $description);
    $stmt->execute();
    
    sendSuccess([
        'id' => (int) $db->lastInsertId(),
        'subject_code' => $subjectCode,
        'subject_name' => $subjectName,
        'credit_hours' => $creditHours,
        'semester' => $semester,
        'department' => $department
    ], 201);
} catch (PDOException $e) {
    logError('DB error create subject: ' . $e->getMessage());
    sendError('Database error', 'database_error', 500);
}
