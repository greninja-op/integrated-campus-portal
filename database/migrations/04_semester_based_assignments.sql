-- Migration: Semester-based teacher-subject assignments
-- Teachers are assigned to subjects (which already have semester info)
-- Students see subjects and teachers based on their current semester

-- Drop old teacher_subjects if exists
DROP TABLE IF EXISTS teacher_subjects;

-- Create simplified teacher_subjects
-- No need for session_id or semester since subjects already have semester info
CREATE TABLE teacher_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    subject_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    
    -- A teacher can only be assigned to a subject once
    UNIQUE KEY unique_teacher_subject (teacher_id, subject_id),
    
    INDEX idx_teacher (teacher_id),
    INDEX idx_subject (subject_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add semester progression tracking to students
ALTER TABLE students 
ADD COLUMN semester_start_date DATE AFTER semester,
ADD COLUMN last_semester_update DATE AFTER semester_start_date,
ADD INDEX idx_semester_dates (semester_start_date, last_semester_update);

-- Create a stored procedure to auto-progress students
DELIMITER //

CREATE PROCEDURE progress_students_semester()
BEGIN
    -- Update students who have completed 6 months in current semester
    UPDATE students 
    SET 
        semester = semester + 1,
        last_semester_update = CURDATE()
    WHERE 
        semester < 6 
        AND semester_start_date IS NOT NULL
        AND DATEDIFF(CURDATE(), COALESCE(last_semester_update, semester_start_date)) >= 180
        AND status = 'active';
END //

DELIMITER ;

-- Create event to run semester progression daily (requires event scheduler)
-- To enable: SET GLOBAL event_scheduler = ON;
CREATE EVENT IF NOT EXISTS auto_progress_semesters
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL progress_students_semester();
