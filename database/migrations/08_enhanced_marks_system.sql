-- Enhanced Marks System Migration
-- Supports Class Tests, Internal Exams, and Semester Exams

-- Create exam_marks table for class tests and internal exams
CREATE TABLE IF NOT EXISTS exam_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    semester INT NOT NULL,
    exam_type ENUM('class_test', 'internal_1', 'internal_2') NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL DEFAULT 40,
    exam_date DATE,
    entered_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (entered_by) REFERENCES teachers(id) ON DELETE SET NULL,
    INDEX idx_student_subject (student_id, subject_id),
    INDEX idx_exam_type (exam_type),
    INDEX idx_semester (semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Modify marks table for semester exams (check if columns exist first)
SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'studentportal' AND TABLE_NAME = 'marks' AND COLUMN_NAME = 'esa_marks');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE marks ADD COLUMN esa_marks DECIMAL(5,2) COMMENT "External Semester Assessment (out of 80)"', 'SELECT "Column esa_marks already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'studentportal' AND TABLE_NAME = 'marks' AND COLUMN_NAME = 'isa_marks');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE marks ADD COLUMN isa_marks DECIMAL(5,2) COMMENT "Internal Semester Assessment (out of 20)"', 'SELECT "Column isa_marks already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'studentportal' AND TABLE_NAME = 'marks' AND COLUMN_NAME = 'credit_points');
SET @sqlstmt := IF(@exist = 0, 'ALTER TABLE marks ADD COLUMN credit_points DECIMAL(5,2) COMMENT "Credit Points (Credit × GP)"', 'SELECT "Column credit_points already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
