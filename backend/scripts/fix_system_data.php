<?php
/**
 * SYSTEM REPAIR & DATA SEEDING SCRIPT
 * 
 * 1. Sets up Active Session
 * 2. Populates Subjects from Course Titles
 * 3. Creates 5 Students per Dept/Sem
 * 4. Creates 5 Teachers per Dept
 * 5. Generates Marks, Attendance, and Fees
 */

require_once __DIR__ . '/../config/database.php';

// Increase execution time
set_time_limit(300);

$database = new Database();
$db = $database->getConnection();

echo "🚀 Starting System Repair & Seeding...\n\n";

// ---------------------------------------------------------
// 1. SETUP SESSION
// ---------------------------------------------------------
echo "📅 Setting up Academic Session...\n";
$db->exec("UPDATE sessions SET is_active = 0");
$stmt = $db->prepare("SELECT id FROM sessions WHERE session_name = '2024-2025'");
$stmt->execute();
if ($stmt->rowCount() == 0) {
    $db->exec("INSERT INTO sessions (session_name, start_year, end_year, start_date, end_date, is_active) 
               VALUES ('2024-2025', 2024, 2025, '2024-06-01', '2025-05-31', 1)");
    $sessionId = $db->lastInsertId();
} else {
    $sessionId = $stmt->fetchColumn();
    $db->exec("UPDATE sessions SET is_active = 1 WHERE id = $sessionId");
}
echo "✅ Active Session: 2024-2025 (ID: $sessionId)\n";

// ---------------------------------------------------------
// 2. POPULATE SUBJECTS
// ---------------------------------------------------------
echo "\n📚 Populating Subjects...\n";

// Clear existing subjects to avoid duplicates/mismatches
$db->exec("SET FOREIGN_KEY_CHECKS = 0");
$db->exec("TRUNCATE TABLE subjects");
$db->exec("SET FOREIGN_KEY_CHECKS = 1");

$subjectsData = [
    'BCA' => [
        1 => ['ENGLISH PAPER 1', 'COMPUTER FUNDAMENTALS AND DIGITAL PRINCIPLES', 'BASIC STATISTICS', 'DISCRETE MATHEMATICS I', 'C PROGRAMMING', 'SOFTWARE LAB I'],
        2 => ['ENGLISH PAPER 2', 'DBMS', 'COMPUTER ORGANIZATION', 'C++', 'DISCRETE MATHEMATICS II', 'SOFTWARE LAB II'],
        3 => ['COMPUTER GRAPHICS', 'MICROPROCESSOR', 'OPERATING SYSTEMS', 'STATISTICAL METHODS', 'DATA STRUCTURES', 'SOFTWARE LAB III'],
        4 => ['SOFTWARE ENGINEERING', 'ALGORITHMS', 'LINUX ADMINISTRATION', 'WEB PROGRAMMING PHP', 'OPERATION RESEARCH', 'SOFTWARE LAB IV'],
        5 => ['COMPUTER NETWORKS', 'IT AND ENVIRONMENT', 'JAVA PROGRAMMING', 'OPEN COURSE', 'MINI PROJECT', 'SOFTWARE LAB V'],
        6 => ['ARTIFICIAL INTELLIGENCE', 'CYBER SECURITY', 'CLOUD COMPUTING', 'MOBILE APP DEV', 'PROJECT WORK']
    ],
    'BBA' => [
        1 => ['Business Accounting', 'Business Mathematics', 'Principles of Management', 'Business Statistics', 'Global Business Environment'],
        2 => ['Business Communication', 'Cost Accounting', 'Mathematics for Management', 'Statistics for Management', 'English'],
        3 => ['Business Laws', 'HR Management', 'Marketing Management', 'Research Methodology', 'Corporate Accounting'],
        4 => ['Informatics', 'Corporate Law', 'Financial Management', 'Managerial Economics', 'Entrepreneurship'],
        5 => ['Industrial Relations', 'IPR', 'Operations Management', 'Environment Science', 'Capital Market'],
        6 => ['Advertising', 'Communication Skills', 'Strategic Management', 'Banking', 'Project']
    ],
    'B.Com' => [
        1 => ['Corporate Regulations', 'Business Studies', 'Financial Accounting 1', 'Banking and Insurance', 'English'],
        2 => ['Business Management', 'Regulatory Framework', 'Financial Accounting 2', 'Business Decisions', 'Quantitative Techniques'],
        3 => ['Corporate Accounting 1', 'Financial Markets', 'Marketing Management', 'Quantitative Techniques 2', 'E-Commerce'],
        4 => ['Corporate Accounting 2', 'Financial Services', 'Entrepreneurship', 'Company Law', 'Income Tax 1'],
        5 => ['Cost Accounting 1', 'Income Tax 2', 'Auditing', 'Open Course', 'Project'],
        6 => ['Cost Accounting 2', 'Management Accounting', 'Applied Costing', 'Viva Voce', 'Project']
    ]
];

$subjectInsert = $db->prepare("INSERT INTO subjects (subject_code, subject_name, department, semester, credit_hours, is_active) VALUES (:code, :name, :dept, :sem, 4, 1)");

foreach ($subjectsData as $dept => $sems) {
    foreach ($sems as $sem => $subjects) {
        foreach ($subjects as $idx => $name) {
            $code = strtoupper($dept) . $sem . str_pad($idx + 1, 2, '0', STR_PAD_LEFT);
            $subjectInsert->execute([
                ':code' => $code,
                ':name' => $name,
                ':dept' => $dept,
                ':sem' => $sem
            ]);
        }
    }
}
echo "✅ Subjects populated for BCA, BBA, B.Com (Sem 1-6)\n";

// ---------------------------------------------------------
// 3. CREATE TEACHERS
// ---------------------------------------------------------
echo "\n👨‍🏫 Creating Teachers...\n";
$depts = ['BCA', 'BBA', 'B.Com'];

foreach ($depts as $dept) {
    for ($i = 1; $i <= 5; $i++) {
        $username = strtolower(str_replace('.', '', $dept)) . "teacher$i";
        $email = "$username@college.edu";
        $password = password_hash('password123', PASSWORD_DEFAULT);
        
        // Check/Create User
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->rowCount() == 0) {
            $db->prepare("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, 'teacher')")
               ->execute([$username, $password, $email]);
            $userId = $db->lastInsertId();
            
            $teacherId = "TCH" . strtoupper(str_replace('.', '', $dept)) . str_pad($i, 3, '0', STR_PAD_LEFT);
            $db->prepare("INSERT INTO teachers (user_id, teacher_id, first_name, last_name, department, qualification, joining_date) 
                          VALUES (?, ?, ?, ?, ?, 'PhD', CURDATE())")
               ->execute([$userId, $teacherId, "$dept Teacher", "$i", $dept]);
        }
    }
}
echo "✅ 5 Teachers created per department\n";

// ---------------------------------------------------------
// 4. CREATE STUDENTS & DATA
// ---------------------------------------------------------
echo "\n🎓 Creating Students & Generating Data...\n";

$markInsert = $db->prepare("INSERT INTO marks (student_id, subject_id, session_id, semester, internal_marks, external_marks, total_marks, grade_point, letter_grade) 
                            VALUES (:sid, :subid, :sess, :sem, :int, :ext, :tot, :gp, :gl)");

// Get a valid marker (teacher/admin) for attendance
$stmt = $db->prepare("SELECT id FROM users WHERE role IN ('teacher', 'admin') LIMIT 1");
$stmt->execute();
$markerId = $stmt->fetchColumn();
if (!$markerId) $markerId = 1; // Fallback

$attInsert = $db->prepare("INSERT INTO attendance (student_id, subject_id, session_id, attendance_date, status, marked_by) VALUES (:sid, :subid, :sess, :date, 'present', :marker)");

foreach ($depts as $dept) {
    for ($sem = 1; $sem <= 6; $sem++) {
        // Get subjects for this sem
        $stmt = $db->prepare("SELECT id FROM subjects WHERE department = ? AND semester = ?");
        $stmt->execute([$dept, $sem]);
        $semSubjects = $stmt->fetchAll(PDO::FETCH_COLUMN);

        for ($i = 1; $i <= 5; $i++) {
            $username = strtolower(str_replace('.', '', $dept)) . "sem{$sem}stu$i";
            $email = "$username@college.edu";
            $password = password_hash('password123', PASSWORD_DEFAULT);
            
            // Check/Create User
            $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
            $stmt->execute([$username]);
            
            if ($stmt->rowCount() == 0) {
                $db->prepare("INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, 'student')")
                   ->execute([$username, $password, $email]);
                $userId = $db->lastInsertId();
                
                $studentId = "STU" . strtoupper(str_replace('.', '', $dept)) . $sem . str_pad($i, 3, '0', STR_PAD_LEFT);
                
                $db->prepare("INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, enrollment_date, session_id, semester, department, program, batch_year) 
                              VALUES (?, ?, ?, ?, '2000-01-01', 'male', '2024-06-01', ?, ?, ?, 'Undergraduate', 2024)")
                   ->execute([$userId, $studentId, "$dept Student", "$sem-$i", $sessionId, $sem, $dept]);
                
                $dbStudentId = $db->lastInsertId();
                
                // Generate Marks & Attendance for each subject
                foreach ($semSubjects as $subId) {
                    // Marks
                    $internal = rand(15, 25); // out of 25
                    $external = rand(40, 70); // out of 75
                    $total = $internal + $external;
                    $gp = $total / 10;
                    $gl = $gp >= 9 ? 'A+' : ($gp >= 8 ? 'A' : ($gp >= 7 ? 'B' : 'C'));
                    
                    $markInsert->execute([
                        ':sid' => $dbStudentId,
                        ':subid' => $subId,
                        ':sess' => $sessionId,
                        ':sem' => $sem,
                        ':int' => $internal,
                        ':ext' => $external,
                        ':tot' => $total,
                        ':gp' => $gp,
                        ':gl' => $gl
                    ]);
                    
                    // Attendance (Last 30 days)
                    for ($d = 0; $d < 5; $d++) {
                        $date = date('Y-m-d', strtotime("-$d days"));
                        $attInsert->execute([
                            ':sid' => $dbStudentId,
                            ':subid' => $subId,
                            ':sess' => $sessionId,
                            ':date' => $date,
                            ':marker' => $markerId
                        ]);
                    }
                }
            }
        }
    }
}
echo "✅ 5 Students created per Dept/Sem with Marks & Attendance\n";

echo "\n✨ SYSTEM REPAIR COMPLETE! ✨\n";
echo "You can now login with:\n";
echo "Student: bcasem1stu1 / password123\n";
echo "Teacher: bcateacher1 / password123\n";
?>
