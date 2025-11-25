<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

$password = password_hash('87654321', PASSWORD_DEFAULT);

// Get active session
$stmt = $db->prepare("SELECT id FROM sessions WHERE is_active = 1 LIMIT 1");
$stmt->execute();
$session = $stmt->fetch(PDO::FETCH_ASSOC);
$sessionId = $session ? $session['id'] : 1;

for ($i = 1; $i <= 6; $i++) {
    $username = "student$i";
    $studentId = "BCA" . str_pad($i, 3, '0', STR_PAD_LEFT);
    $firstName = "Student";
    $lastName = "$i";
    $semester = $i;
    
    // Check if user exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        // Update password
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE username = ?");
        $stmt->execute([$password, $username]);
        echo "✓ Updated: $username (Semester $semester)\n";
    } else {
        // Create user
        $stmt = $db->prepare("INSERT INTO users (username, password, role, email, status) VALUES (?, ?, 'student', ?, 'active')");
        $stmt->execute([$username, $password, "$username@test.com"]);
        $userId = $db->lastInsertId();
        
        // Create student profile
        $stmt = $db->prepare("INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, department, semester, session_id, enrollment_date) VALUES (?, ?, ?, ?, '2000-01-01', 'male', 'BCA', ?, ?, NOW())");
        $stmt->execute([$userId, $studentId, $firstName, $lastName, $semester, $sessionId]);
        
        echo "✓ Created: $username (BCA - Semester $semester)\n";
    }
}

echo "\n6 BCA students ready!\n";
echo "Username: student1-6, Password: 87654321\n";
?>
