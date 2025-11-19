-- Create Sample Students
-- Password for all: student123 (hashed with bcrypt)
-- Get active session ID first
SET @session_id = (SELECT id FROM sessions WHERE is_active = 1 LIMIT 1);

-- Student 1: Semester 5, BCA
INSERT INTO users (username, password, email, role, status) VALUES
('student001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student001@studentportal.edu', 'student', 'active');

SET @student1_user_id = LAST_INSERT_ID();

INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, phone, address, enrollment_date, session_id, semester, department, program, batch_year, guardian_name, guardian_phone, guardian_email) VALUES
(@student1_user_id, 'STU2024001', 'Rahul', 'Verma', '2004-05-15', 'male', '8765432100', '101 Student Hostel, Campus', '2022-07-01', @session_id, 5, 'BCA', 'Bachelor of Computer Applications', 2022, 'Suresh Verma', '9988776655', 'suresh.verma@email.com');

-- Student 2: Semester 5, BCA
INSERT INTO users (username, password, email, role, status) VALUES
('student002', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student002@studentportal.edu', 'student', 'active');

SET @student2_user_id = LAST_INSERT_ID();

INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, phone, address, enrollment_date, session_id, semester, department, program, batch_year, guardian_name, guardian_phone, guardian_email) VALUES
(@student2_user_id, 'STU2024002', 'Priya', 'Singh', '2004-08-22', 'female', '8765432101', '102 Student Hostel, Campus', '2022-07-01', @session_id, 5, 'BCA', 'Bachelor of Computer Applications', 2022, 'Rajesh Singh', '9988776656', 'rajesh.singh@email.com');

-- Student 3: Semester 3, BCA
INSERT INTO users (username, password, email, role, status) VALUES
('student003', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student003@studentportal.edu', 'student', 'active');

SET @student3_user_id = LAST_INSERT_ID();

INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, phone, address, enrollment_date, session_id, semester, department, program, batch_year, guardian_name, guardian_phone, guardian_email) VALUES
(@student3_user_id, 'STU2024003', 'Amit', 'Patel', '2005-03-10', 'male', '8765432102', '201 Off-Campus Housing', '2023-07-01', @session_id, 3, 'BCA', 'Bachelor of Computer Applications', 2023, 'Mukesh Patel', '9988776657', 'mukesh.patel@email.com');

-- Student 4: Semester 3, BCA
INSERT INTO users (username, password, email, role, status) VALUES
('student004', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student004@studentportal.edu', 'student', 'active');

SET @student4_user_id = LAST_INSERT_ID();

INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, phone, address, enrollment_date, session_id, semester, department, program, batch_year, guardian_name, guardian_phone, guardian_email) VALUES
(@student4_user_id, 'STU2024004', 'Neha', 'Gupta', '2005-06-18', 'female', '8765432103', '103 Student Hostel, Campus', '2023-07-01', @session_id, 3, 'BCA', 'Bachelor of Computer Applications', 2023, 'Anil Gupta', '9988776658', 'anil.gupta@email.com');

-- Student 5: Semester 1, BCA
INSERT INTO users (username, password, email, role, status) VALUES
('student005', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student005@studentportal.edu', 'student', 'active');

SET @student5_user_id = LAST_INSERT_ID();

INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, phone, address, enrollment_date, session_id, semester, department, program, batch_year, guardian_name, guardian_phone, guardian_email) VALUES
(@student5_user_id, 'STU2024005', 'Vikram', 'Reddy', '2006-01-25', 'male', '8765432104', '104 Student Hostel, Campus', '2024-07-01', @session_id, 1, 'BCA', 'Bachelor of Computer Applications', 2024, 'Ramesh Reddy', '9988776659', 'ramesh.reddy@email.com');

-- Student 6: Semester 1, BCA
INSERT INTO users (username, password, email, role, status) VALUES
('student006', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student006@studentportal.edu', 'student', 'active');

SET @student6_user_id = LAST_INSERT_ID();

INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, phone, address, enrollment_date, session_id, semester, department, program, batch_year, guardian_name, guardian_phone, guardian_email) VALUES
(@student6_user_id, 'STU2024006', 'Anjali', 'Desai', '2006-04-12', 'female', '8765432105', '105 Student Hostel, Campus', '2024-07-01', @session_id, 1, 'BCA', 'Bachelor of Computer Applications', 2024, 'Vijay Desai', '9988776660', 'vijay.desai@email.com');

-- Confirm creation
SELECT u.id, u.username, u.email, s.student_id, s.first_name, s.last_name, s.semester, s.department
FROM users u
JOIN students s ON u.id = s.user_id
WHERE u.role = 'student'
ORDER BY s.student_id;
