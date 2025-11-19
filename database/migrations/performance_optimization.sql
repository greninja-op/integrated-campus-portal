-- Performance Optimization Migration
-- Adds composite indexes for frequently used query patterns
-- Run this after initial schema setup

USE studentportal;

-- Add composite indexes for common query patterns

-- Students: Often queried by department + semester together
ALTER TABLE students 
ADD INDEX idx_dept_semester (department, semester);

-- Students: Often queried by session + semester
ALTER TABLE students 
ADD INDEX idx_session_semester (session_id, semester);

-- Marks: Often queried by student + semester
ALTER TABLE marks 
ADD INDEX idx_student_semester (student_id, semester);

-- Marks: Often queried by student + session
ALTER TABLE marks 
ADD INDEX idx_student_session (student_id, session_id);

-- Marks: Often queried by subject + semester for reports
ALTER TABLE marks 
ADD INDEX idx_subject_semester (subject_id, semester);

-- Attendance: Often queried by student + date range
ALTER TABLE attendance 
ADD INDEX idx_student_date (student_id, attendance_date);

-- Attendance: Often queried by subject + date range
ALTER TABLE attendance 
ADD INDEX idx_subject_date (subject_id, attendance_date);

-- Fees: Often queried by semester + department
ALTER TABLE fees 
ADD INDEX idx_semester_dept (semester, department);

-- Fees: Often queried by session + due_date
ALTER TABLE fees 
ADD INDEX idx_session_due (session_id, due_date);

-- Payments: Often queried by student + payment_date
ALTER TABLE payments 
ADD INDEX idx_student_payment_date (student_id, payment_date);

-- Payments: Often queried by payment_date + status for reports
ALTER TABLE payments 
ADD INDEX idx_date_status (payment_date, status);

-- Success message
SELECT 'Performance optimization indexes added successfully!' AS message;
SELECT 'Run ANALYZE TABLE on all tables to update statistics.' AS recommendation;

-- Analyze tables to update statistics for query optimizer
ANALYZE TABLE users;
ANALYZE TABLE students;
ANALYZE TABLE teachers;
ANALYZE TABLE admins;
ANALYZE TABLE subjects;
ANALYZE TABLE sessions;
ANALYZE TABLE semesters;
ANALYZE TABLE marks;
ANALYZE TABLE attendance;
ANALYZE TABLE fees;
ANALYZE TABLE payments;

SELECT 'Table statistics updated!' AS message;
