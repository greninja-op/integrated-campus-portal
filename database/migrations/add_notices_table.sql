-- Add Notices Table to Database
-- This table stores system-wide notices for students, teachers, and admins

CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role ENUM('student', 'teacher', 'all') NOT NULL DEFAULT 'all',
    expiry_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_target_role (target_role),
    INDEX idx_is_active (is_active),
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample notices
INSERT INTO notices (title, content, target_role, expiry_date, created_by) VALUES
('Welcome to Academic Year 2024-2025', 'Welcome to the new academic year! We wish you all the best for your studies.', 'all', '2025-08-31', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Semester 5 Exam Schedule Released', 'The examination schedule for Semester 5 has been released. Please check your student portal for details.', 'student', '2024-12-31', (SELECT id FROM users WHERE role = 'admin' LIMIT 1)),
('Faculty Meeting - November 20', 'All faculty members are requested to attend the monthly meeting on November 20, 2024 at 10:00 AM.', 'teacher', '2024-11-20', (SELECT id FROM users WHERE role = 'admin' LIMIT 1));

-- Verify creation
SELECT * FROM notices ORDER BY created_at DESC;
