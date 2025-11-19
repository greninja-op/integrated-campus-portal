-- Create Sample Attendance Records
-- Get necessary IDs
SET @session_id = (SELECT id FROM sessions WHERE is_active = 1 LIMIT 1);
SET @teacher_id = (SELECT id FROM users WHERE role = 'teacher' LIMIT 1);

-- Helper function to create attendance for a date range
-- We'll create attendance for the past 30 days for semester 5 students (BCA501)

SET @student1_id = (SELECT id FROM students WHERE student_id = 'STU2024001');
SET @student2_id = (SELECT id FROM students WHERE student_id = 'STU2024002');
SET @subject_bca501 = (SELECT id FROM subjects WHERE subject_code = 'BCA501');
SET @subject_bca502 = (SELECT id FROM subjects WHERE subject_code = 'BCA502');
SET @subject_bca503 = (SELECT id FROM subjects WHERE subject_code = 'BCA503');

-- Student 1 Attendance for BCA501 (Advanced Java) - 30 classes
INSERT INTO attendance (student_id, subject_id, session_id, attendance_date, status, marked_by) VALUES
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 28 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 26 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 24 DAY), 'absent', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 22 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 18 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 16 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 14 DAY), 'absent', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present', @teacher_id);

-- Student 1 Attendance for BCA502 (AI) - 15 classes
INSERT INTO attendance (student_id, subject_id, session_id, attendance_date, status, marked_by) VALUES
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 29 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 27 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 25 DAY), 'absent', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 23 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 19 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 17 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 13 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 11 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'absent', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'present', @teacher_id),
(@student1_id, @subject_bca502, @session_id, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'present', @teacher_id);

-- Student 2 Attendance for BCA501 - 15 classes (excellent attendance)
INSERT INTO attendance (student_id, subject_id, session_id, attendance_date, status, marked_by) VALUES
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 28 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 26 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 24 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 22 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 18 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 16 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 14 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'present', @teacher_id),
(@student2_id, @subject_bca501, @session_id, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'present', @teacher_id);

-- Semester 3 students attendance
SET @student3_id = (SELECT id FROM students WHERE student_id = 'STU2024003');
SET @student4_id = (SELECT id FROM students WHERE student_id = 'STU2024004');
SET @subject_bca301 = (SELECT id FROM subjects WHERE subject_code = 'BCA301');

-- Student 3 Attendance for BCA301
INSERT INTO attendance (student_id, subject_id, session_id, attendance_date, status, marked_by) VALUES
(@student3_id, @subject_bca301, @session_id, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'present', @teacher_id),
(@student3_id, @subject_bca301, @session_id, DATE_SUB(CURDATE(), INTERVAL 27 DAY), 'absent', @teacher_id),
(@student3_id, @subject_bca301, @session_id, DATE_SUB(CURDATE(), INTERVAL 24 DAY), 'present', @teacher_id),
(@student3_id, @subject_bca301, @session_id, DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'present', @teacher_id),
(@student3_id, @subject_bca301, @session_id, DATE_SUB(CURDATE(), INTERVAL 18 DAY), 'present', @teacher_id),
(@student3_id, @subject_bca301, @session_id, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'absent', @teacher_id),
(@student3_id, @subject_bca301, @session_id, DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'present', @teacher_id),
(@student3_id, @subject_bca301, @session_id, DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'present', @teacher_id),
(@student3_id, @subject_bca301, @session_id, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'present', @teacher_id),
(@student3_id, @subject_bca301, @session_id, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'present', @teacher_id);

-- Confirm creation and show statistics
SELECT s.student_id, s.first_name, s.last_name,
       sub.subject_code, sub.subject_name,
       COUNT(*) as total_classes,
       SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
       SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
       ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as percentage
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN subjects sub ON a.subject_id = sub.id
GROUP BY s.id, sub.id
ORDER BY s.student_id, sub.subject_code;
