<?php
// backend/scripts/add_default_users.php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Common password hash for '123'
    $password = password_hash('123', PASSWORD_DEFAULT);

    echo "Processing default users...\n";

    // 1. ADMIN
    $username = 'admin';
    $email = 'admin@college.com';
    
    // Check if exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    
    if (!$stmt->fetch()) {
        $db->beginTransaction();
        // Create User
        $stmt = $db->prepare("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'admin', 'active')");
        $stmt->execute([$username, $email, $password]);
        $userId = $db->lastInsertId();
        
        // Create Admin Profile
        $stmt = $db->prepare("INSERT INTO admins (user_id, admin_id, first_name, last_name, phone) VALUES (?, 'ADM001', 'Super', 'Admin', '9999999999')");
        $stmt->execute([$userId]);
        
        $db->commit();
        echo "[OK] Admin user created.\n";
    } else {
        // Update password if exists
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE username = ?");
        $stmt->execute([$password, $username]);
        echo "[SKIP] Admin user exists (password updated).\n";
    }

    // 2. TEACHER
    $username = 'teacher';
    $email = 'teacher@college.com';
    
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    
    if (!$stmt->fetch()) {
        $db->beginTransaction();
        $stmt = $db->prepare("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'teacher', 'active')");
        $stmt->execute([$username, $email, $password]);
        $userId = $db->lastInsertId();
        
        // Teacher Profile
        $stmt = $db->prepare("INSERT INTO teachers (user_id, teacher_id, first_name, last_name, department, designation, date_of_birth, joining_date, gender) 
                             VALUES (?, 'TCH001', 'Default', 'Teacher', 'BCA', 'Lecturer', '1990-01-01', '2023-01-01', 'male')");
        $stmt->execute([$userId]);
        
        // Assign a subject (use first BCA sem 1 subject)
        $stmt = $db->query("SELECT id FROM subjects WHERE department='BCA' LIMIT 1");
        if ($subj = $stmt->fetch()) {
            $stmt = $db->prepare("INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ((SELECT id FROM teachers WHERE user_id = ?), ?)");
            $stmt->execute([$userId, $subj['id']]);
        }

        $db->commit();
        echo "[OK] Teacher user created.\n";
    } else {
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE username = ?");
        $stmt->execute([$password, $username]);
        echo "[SKIP] Teacher user exists (password updated).\n";
    }

    // 3. STUDENT
    $username = 'student';
    $email = 'student@college.com';
    
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    
    if (!$stmt->fetch()) {
        $db->beginTransaction();
        $stmt = $db->prepare("INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'student', 'active')");
        $stmt->execute([$username, $email, $password]);
        $userId = $db->lastInsertId();
        
        // Get Session
        $session = getActiveSession($db);
        $sessionId = $session ? $session['id'] : 1;

        // Student Profile
        $stmt = $db->prepare("INSERT INTO students (user_id, student_id, first_name, last_name, department, semester, session_id, date_of_birth, enrollment_date, gender) 
                             VALUES (?, 'STU001', 'Default', 'Student', 'BCA', 1, ?, '2000-01-01', '2023-01-01', 'male')");
        $stmt->execute([$userId, $sessionId]);
        
        $db->commit();
        echo "[OK] Student user created.\n";
    } else {
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE username = ?");
        $stmt->execute([$password, $username]);
        echo "[SKIP] Student user exists (password updated).\n";
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo "[ERROR] " . $e->getMessage() . "\n";
}
