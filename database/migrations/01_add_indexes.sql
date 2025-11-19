-- Migration: Add Missing Indexes
-- Description: Adds composite indexes to attendance and marks tables for performance optimization.

-- Attendance Table: Optimize lookups by student, subject, and date
CREATE INDEX idx_attendance_composite ON attendance(student_id, subject_id, attendance_date);

-- Marks Table: Optimize lookups by student, subject, semester, and session
CREATE INDEX idx_marks_composite ON marks(student_id, subject_id, semester, session_id);

-- Students Table: Optimize search by department and semester
CREATE INDEX idx_students_dept_sem ON students(department, semester);
