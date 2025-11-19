-- Create Sample Teachers
-- Password for all: teacher123 (hashed with bcrypt)

-- Teacher 1: Computer Science Department
INSERT INTO users (username, password, email, role, status) VALUES
('prof.sharma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'sharma@studentportal.edu', 'teacher', 'active');

SET @teacher1_user_id = LAST_INSERT_ID();

INSERT INTO teachers (user_id, teacher_id, first_name, last_name, date_of_birth, gender, phone, address, joining_date, department, designation, qualification, specialization, experience_years) VALUES
(@teacher1_user_id, 'TCH2024001', 'Rajesh', 'Sharma', '1985-03-15', 'male', '9876543210', '123 University Street, City', '2015-07-01', 'BCA', 'Associate Professor', 'M.Tech Computer Science', 'Computer Networks, Database Management', 9);

-- Teacher 2: Mathematics Department
INSERT INTO users (username, password, email, role, status) VALUES
('prof.patel', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patel@studentportal.edu', 'teacher', 'active');

SET @teacher2_user_id = LAST_INSERT_ID();

INSERT INTO teachers (user_id, teacher_id, first_name, last_name, date_of_birth, gender, phone, address, joining_date, department, designation, qualification, specialization, experience_years) VALUES
(@teacher2_user_id, 'TCH2024002', 'Priya', 'Patel', '1988-07-22', 'female', '9876543211', '456 College Road, City', '2016-08-01', 'BCA', 'Assistant Professor', 'M.Sc Mathematics', 'Applied Mathematics, Statistics', 8);

-- Teacher 3: Programming Languages
INSERT INTO users (username, password, email, role, status) VALUES
('prof.kumar', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'kumar@studentportal.edu', 'teacher', 'active');

SET @teacher3_user_id = LAST_INSERT_ID();

INSERT INTO teachers (user_id, teacher_id, first_name, last_name, date_of_birth, gender, phone, address, joining_date, department, designation, qualification, specialization, experience_years) VALUES
(@teacher3_user_id, 'TCH2024003', 'Amit', 'Kumar', '1990-11-10', 'male', '9876543212', '789 Education Lane, City', '2018-01-15', 'BCA', 'Assistant Professor', 'M.C.A', 'Java, Python, Web Development', 6);

-- Confirm creation
SELECT u.id, u.username, u.email, t.teacher_id, t.first_name, t.last_name, t.department, t.designation
FROM users u
JOIN teachers t ON u.id = t.user_id
WHERE u.role = 'teacher'
ORDER BY t.teacher_id;
