-- Populate database with test users
-- Password for all users: password123
-- Hash: $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- Create active session
INSERT INTO sessions (session_name, start_year, end_year, start_date, end_date, is_active) 
VALUES ('2023-2024', 2023, 2024, '2023-08-01', '2024-05-31', 1);

SET @session_id = LAST_INSERT_ID();

-- Create Admin User
INSERT INTO users (username, email, password, role, status) 
VALUES ('Admin User', 'admin@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active');

SET @admin_user_id = LAST_INSERT_ID();

INSERT INTO admins (user_id, admin_id, first_name, last_name, designation)
VALUES (@admin_user_id, 'ADM001', 'Admin', 'User', 'System Administrator');

-- BCA Department
-- Teachers
INSERT INTO users (username, email, password, role, status) VALUES 
('BCA Teacher 1', 'teacher1.bca@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BCA Teacher 2', 'teacher2.bca@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BCA Teacher 3', 'teacher3.bca@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BCA Teacher 4', 'teacher4.bca@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BCA Teacher 5', 'teacher5.bca@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active');

INSERT INTO teachers (user_id, teacher_id, first_name, last_name, date_of_birth, gender, joining_date, department, designation, qualification) VALUES
((SELECT id FROM users WHERE email = 'teacher1.bca@college.com'), 'EMPBCA001', 'BCA Teacher', '1', '1980-01-01', 'male', '2020-01-01', 'BCA', 'Assistant Professor', 'PhD'),
((SELECT id FROM users WHERE email = 'teacher2.bca@college.com'), 'EMPBCA002', 'BCA Teacher', '2', '1980-01-01', 'female', '2020-01-01', 'BCA', 'Assistant Professor', 'PhD'),
((SELECT id FROM users WHERE email = 'teacher3.bca@college.com'), 'EMPBCA003', 'BCA Teacher', '3', '1980-01-01', 'male', '2020-01-01', 'BCA', 'Associate Professor', 'PhD'),
((SELECT id FROM users WHERE email = 'teacher4.bca@college.com'), 'EMPBCA004', 'BCA Teacher', '4', '1980-01-01', 'female', '2020-01-01', 'BCA', 'Assistant Professor', 'M.Tech'),
((SELECT id FROM users WHERE email = 'teacher5.bca@college.com'), 'EMPBCA005', 'BCA Teacher', '5', '1980-01-01', 'male', '2020-01-01', 'BCA', 'Professor', 'PhD');

-- Students
INSERT INTO users (username, email, password, role, status) VALUES 
('BCA Student 1', 'student1.bca@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BCA Student 2', 'student2.bca@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BCA Student 3', 'student3.bca@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BCA Student 4', 'student4.bca@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BCA Student 5', 'student5.bca@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active');

INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, enrollment_date, department, semester, session_id, batch_year) VALUES
((SELECT id FROM users WHERE email = 'student1.bca@college.com'), 'STUBCA001', 'BCA Student', '1', '2000-01-01', 'male', '2023-08-01', 'BCA', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student2.bca@college.com'), 'STUBCA002', 'BCA Student', '2', '2000-01-01', 'female', '2023-08-01', 'BCA', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student3.bca@college.com'), 'STUBCA003', 'BCA Student', '3', '2000-01-01', 'male', '2023-08-01', 'BCA', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student4.bca@college.com'), 'STUBCA004', 'BCA Student', '4', '2000-01-01', 'female', '2023-08-01', 'BCA', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student5.bca@college.com'), 'STUBCA005', 'BCA Student', '5', '2000-01-01', 'male', '2023-08-01', 'BCA', 1, @session_id, 2023);

-- BBA Department
-- Teachers
INSERT INTO users (username, email, password, role, status) VALUES 
('BBA Teacher 1', 'teacher1.bba@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BBA Teacher 2', 'teacher2.bba@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BBA Teacher 3', 'teacher3.bba@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BBA Teacher 4', 'teacher4.bba@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BBA Teacher 5', 'teacher5.bba@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active');

INSERT INTO teachers (user_id, teacher_id, first_name, last_name, date_of_birth, gender, joining_date, department, designation, qualification) VALUES
((SELECT id FROM users WHERE email = 'teacher1.bba@college.com'), 'EMPBBA001', 'BBA Teacher', '1', '1980-01-01', 'male', '2020-01-01', 'BBA', 'Assistant Professor', 'PhD'),
((SELECT id FROM users WHERE email = 'teacher2.bba@college.com'), 'EMPBBA002', 'BBA Teacher', '2', '1980-01-01', 'female', '2020-01-01', 'BBA', 'Assistant Professor', 'MBA'),
((SELECT id FROM users WHERE email = 'teacher3.bba@college.com'), 'EMPBBA003', 'BBA Teacher', '3', '1980-01-01', 'male', '2020-01-01', 'BBA', 'Associate Professor', 'PhD'),
((SELECT id FROM users WHERE email = 'teacher4.bba@college.com'), 'EMPBBA004', 'BBA Teacher', '4', '1980-01-01', 'female', '2020-01-01', 'BBA', 'Assistant Professor', 'MBA'),
((SELECT id FROM users WHERE email = 'teacher5.bba@college.com'), 'EMPBBA005', 'BBA Teacher', '5', '1980-01-01', 'male', '2020-01-01', 'BBA', 'Professor', 'PhD');

-- Students
INSERT INTO users (username, email, password, role, status) VALUES 
('BBA Student 1', 'student1.bba@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BBA Student 2', 'student2.bba@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BBA Student 3', 'student3.bba@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BBA Student 4', 'student4.bba@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BBA Student 5', 'student5.bba@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active');

INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, enrollment_date, department, semester, session_id, batch_year) VALUES
((SELECT id FROM users WHERE email = 'student1.bba@college.com'), 'STUBBA001', 'BBA Student', '1', '2000-01-01', 'male', '2023-08-01', 'BBA', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student2.bba@college.com'), 'STUBBA002', 'BBA Student', '2', '2000-01-01', 'female', '2023-08-01', 'BBA', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student3.bba@college.com'), 'STUBBA003', 'BBA Student', '3', '2000-01-01', 'male', '2023-08-01', 'BBA', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student4.bba@college.com'), 'STUBBA004', 'BBA Student', '4', '2000-01-01', 'female', '2023-08-01', 'BBA', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student5.bba@college.com'), 'STUBBA005', 'BBA Student', '5', '2000-01-01', 'male', '2023-08-01', 'BBA', 1, @session_id, 2023);

-- B.Com Department
-- Teachers
INSERT INTO users (username, email, password, role, status) VALUES 
('BCom Teacher 1', 'teacher1.bcom@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BCom Teacher 2', 'teacher2.bcom@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BCom Teacher 3', 'teacher3.bcom@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BCom Teacher 4', 'teacher4.bcom@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active'),
('BCom Teacher 5', 'teacher5.bcom@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'active');

INSERT INTO teachers (user_id, teacher_id, first_name, last_name, date_of_birth, gender, joining_date, department, designation, qualification) VALUES
((SELECT id FROM users WHERE email = 'teacher1.bcom@college.com'), 'EMPBCOM001', 'BCom Teacher', '1', '1980-01-01', 'male', '2020-01-01', 'B.Com', 'Assistant Professor', 'PhD'),
((SELECT id FROM users WHERE email = 'teacher2.bcom@college.com'), 'EMPBCOM002', 'BCom Teacher', '2', '1980-01-01', 'female', '2020-01-01', 'B.Com', 'Assistant Professor', 'M.Com'),
((SELECT id FROM users WHERE email = 'teacher3.bcom@college.com'), 'EMPBCOM003', 'BCom Teacher', '3', '1980-01-01', 'male', '2020-01-01', 'B.Com', 'Associate Professor', 'PhD'),
((SELECT id FROM users WHERE email = 'teacher4.bcom@college.com'), 'EMPBCOM004', 'BCom Teacher', '4', '1980-01-01', 'female', '2020-01-01', 'B.Com', 'Assistant Professor', 'M.Com'),
((SELECT id FROM users WHERE email = 'teacher5.bcom@college.com'), 'EMPBCOM005', 'BCom Teacher', '5', '1980-01-01', 'male', '2020-01-01', 'B.Com', 'Professor', 'PhD');

-- Students
INSERT INTO users (username, email, password, role, status) VALUES 
('BCom Student 1', 'student1.bcom@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BCom Student 2', 'student2.bcom@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BCom Student 3', 'student3.bcom@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BCom Student 4', 'student4.bcom@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active'),
('BCom Student 5', 'student5.bcom@college.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'active');

INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, enrollment_date, department, semester, session_id, batch_year) VALUES
((SELECT id FROM users WHERE email = 'student1.bcom@college.com'), 'STUBCOM001', 'BCom Student', '1', '2000-01-01', 'male', '2023-08-01', 'B.Com', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student2.bcom@college.com'), 'STUBCOM002', 'BCom Student', '2', '2000-01-01', 'female', '2023-08-01', 'B.Com', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student3.bcom@college.com'), 'STUBCOM003', 'BCom Student', '3', '2000-01-01', 'male', '2023-08-01', 'B.Com', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student4.bcom@college.com'), 'STUBCOM004', 'BCom Student', '4', '2000-01-01', 'female', '2023-08-01', 'B.Com', 1, @session_id, 2023),
((SELECT id FROM users WHERE email = 'student5.bcom@college.com'), 'STUBCOM005', 'BCom Student', '5', '2000-01-01', 'male', '2023-08-01', 'B.Com', 1, @session_id, 2023);
