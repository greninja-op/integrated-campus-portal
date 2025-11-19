-- Create Sample Marks for Students
-- Get necessary IDs
SET @session_id = (SELECT id FROM sessions WHERE is_active = 1 LIMIT 1);
SET @teacher_id = (SELECT id FROM users WHERE role = 'teacher' LIMIT 1);

-- Marks for Student 1 (STU2024001) - Semester 5
SET @student1_id = (SELECT id FROM students WHERE student_id = 'STU2024001');

INSERT INTO marks (student_id, subject_id, session_id, semester, internal_marks, external_marks, total_marks, grade_point, letter_grade, entered_by) VALUES
(@student1_id, (SELECT id FROM subjects WHERE subject_code = 'BCA501'), @session_id, 5, 25.00, 65.00, 90.00, 4.00, 'A+', @teacher_id),
(@student1_id, (SELECT id FROM subjects WHERE subject_code = 'BCA502'), @session_id, 5, 23.00, 62.00, 85.00, 3.75, 'A', @teacher_id),
(@student1_id, (SELECT id FROM subjects WHERE subject_code = 'BCA503'), @session_id, 5, 22.00, 60.00, 82.00, 3.50, 'A-', @teacher_id),
(@student1_id, (SELECT id FROM subjects WHERE subject_code = 'BCA504'), @session_id, 5, 24.00, 63.00, 87.00, 3.75, 'A', @teacher_id),
(@student1_id, (SELECT id FROM subjects WHERE subject_code = 'BCA505'), @session_id, 5, 20.00, 58.00, 78.00, 3.25, 'B+', @teacher_id);

-- Marks for Student 2 (STU2024002) - Semester 5
SET @student2_id = (SELECT id FROM students WHERE student_id = 'STU2024002');

INSERT INTO marks (student_id, subject_id, session_id, semester, internal_marks, external_marks, total_marks, grade_point, letter_grade, entered_by) VALUES
(@student2_id, (SELECT id FROM subjects WHERE subject_code = 'BCA501'), @session_id, 5, 22.00, 60.00, 82.00, 3.50, 'A-', @teacher_id),
(@student2_id, (SELECT id FROM subjects WHERE subject_code = 'BCA502'), @session_id, 5, 24.00, 64.00, 88.00, 3.75, 'A', @teacher_id),
(@student2_id, (SELECT id FROM subjects WHERE subject_code = 'BCA503'), @session_id, 5, 25.00, 68.00, 93.00, 4.00, 'A+', @teacher_id),
(@student2_id, (SELECT id FROM subjects WHERE subject_code = 'BCA504'), @session_id, 5, 21.00, 57.00, 78.00, 3.25, 'B+', @teacher_id),
(@student2_id, (SELECT id FROM subjects WHERE subject_code = 'BCA505'), @session_id, 5, 23.00, 61.00, 84.00, 3.50, 'A-', @teacher_id);

-- Marks for Student 3 (STU2024003) - Semester 3
SET @student3_id = (SELECT id FROM students WHERE student_id = 'STU2024003');

INSERT INTO marks (student_id, subject_id, session_id, semester, internal_marks, external_marks, total_marks, grade_point, letter_grade, entered_by) VALUES
(@student3_id, (SELECT id FROM subjects WHERE subject_code = 'BCA301'), @session_id, 3, 20.00, 55.00, 75.00, 3.25, 'B+', @teacher_id),
(@student3_id, (SELECT id FROM subjects WHERE subject_code = 'BCA302'), @session_id, 3, 22.00, 60.00, 82.00, 3.50, 'A-', @teacher_id),
(@student3_id, (SELECT id FROM subjects WHERE subject_code = 'BCA303'), @session_id, 3, 19.00, 54.00, 73.00, 3.00, 'B', @teacher_id),
(@student3_id, (SELECT id FROM subjects WHERE subject_code = 'BCA304'), @session_id, 3, 21.00, 58.00, 79.00, 3.25, 'B+', @teacher_id),
(@student3_id, (SELECT id FROM subjects WHERE subject_code = 'BCA305'), @session_id, 3, 23.00, 62.00, 85.00, 3.75, 'A', @teacher_id);

-- Marks for Student 4 (STU2024004) - Semester 3
SET @student4_id = (SELECT id FROM students WHERE student_id = 'STU2024004');

INSERT INTO marks (student_id, subject_id, session_id, semester, internal_marks, external_marks, total_marks, grade_point, letter_grade, entered_by) VALUES
(@student4_id, (SELECT id FROM subjects WHERE subject_code = 'BCA301'), @session_id, 3, 24.00, 66.00, 90.00, 4.00, 'A+', @teacher_id),
(@student4_id, (SELECT id FROM subjects WHERE subject_code = 'BCA302'), @session_id, 3, 23.00, 64.00, 87.00, 3.75, 'A', @teacher_id),
(@student4_id, (SELECT id FROM subjects WHERE subject_code = 'BCA303'), @session_id, 3, 22.00, 61.00, 83.00, 3.50, 'A-', @teacher_id),
(@student4_id, (SELECT id FROM subjects WHERE subject_code = 'BCA304'), @session_id, 3, 25.00, 67.00, 92.00, 4.00, 'A+', @teacher_id),
(@student4_id, (SELECT id FROM subjects WHERE subject_code = 'BCA305'), @session_id, 3, 21.00, 59.00, 80.00, 3.50, 'A-', @teacher_id);

-- Confirm creation
SELECT s.student_id, s.first_name, s.last_name, s.semester, 
       COUNT(m.id) as total_subjects, 
       ROUND(AVG(m.total_marks), 2) as avg_marks,
       ROUND(AVG(m.grade_point), 2) as gpa
FROM students s
JOIN marks m ON s.id = m.student_id
GROUP BY s.id
ORDER BY s.student_id;
