-- Migration: Create Notices Table
-- Date: 2024-11-21
-- Description: Add notices table for announcements and notifications

USE studentportal;

-- Create notices table
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('general', 'academic', 'exam', 'event', 'holiday', 'sports') NOT NULL DEFAULT 'general',
    target_audience ENUM('all', 'students', 'teachers', 'staff') NOT NULL DEFAULT 'all',
    department VARCHAR(100) NULL,
    semester INT NULL CHECK (semester BETWEEN 1 AND 6),
    attachment_url VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expiry_date DATE NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_type (type),
    INDEX idx_target_audience (target_audience),
    INDEX idx_department (department),
    INDEX idx_semester (semester),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Success message
SELECT 'Notices table created successfully!' AS message;
