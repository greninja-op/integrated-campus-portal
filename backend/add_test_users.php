<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

$studentPassword = password_hash('87654321', PASSWORD_DEFAULT);
$teacherPassword = password_hash('87654321', PASSWORD_DEFAULT);

// Update or create student user
$stmt = $db->prepare("SELECT id FROM users WHERE username = 'student'");
$stmt->execute();
$existingStudent = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existingStudent) {
    $stmt = $db->prepare("UPDATE users SET password = ? WHERE username = 'student'");
    $stmt->execute([$studentPassword]);
    echo "✓ Student password updated: username='student', password='87654321'\n";
} else {
    $stmt = $db->prepare("INSERT INTO users (username, password, role, email, status) VALUES ('student', ?, 'student', 'student@test.com', 'active')");
    $stmt->execute([$studentPassword]);
    $studentUserId = $db->lastInsertId();
    
    $stmt = $db->prepare("SELECT id FROM sessions WHERE is_active = 1 LIMIT 1");
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $sessionId = $session ? $session['id'] : 1;
    
    $stmt = $db->prepare("INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, department, semester, session_id, enrollment_date) VALUES (?, 'STU001', 'Test', 'Student', '2000-01-01', 'male', 'BCA', 1, ?, NOW())");
    $stmt->execute([$studentUserId, $sessionId]);
    echo "✓ Student user created: username='student', password='87654321'\n";
}

// Update or create teacher user
$stmt = $db->prepare("SELECT id FROM users WHERE username = 'teacher'");
$stmt->execute();
$existingTeacher = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existingTeacher) {
    $stmt = $db->prepare("UPDATE users SET password = ? WHERE username = 'teacher'");
    $stmt->execute([$teacherPassword]);
    echo "✓ Teacher password updated: username='teacher', password='87654321'\n";
} else {
    $stmt = $db->prepare("INSERT INTO users (username, password, role, email, status) VALUES ('teacher', ?, 'teacher', 'teacher@test.com', 'active')");
    $stmt->execute([$teacherPassword]);
    $teacherUserId = $db->lastInsertId();
    
    $stmt = $db->prepare("INSERT INTO teachers (user_id, teacher_id, first_name, last_name, date_of_birth, gender, department, designation, joining_date) VALUES (?, 'TCH001', 'Test', 'Teacher', '1990-01-01', 'male', 'BCA', 'Assistant Professor', NOW())");
    $stmt->execute([$teacherUserId]);
    echo "✓ Teacher user created: username='teacher', password='87654321'\n";
}

echo "\nTest users ready!\n";
?>
