-- Add notices table
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('general', 'academic', 'exam', 'event', 'holiday') DEFAULT 'general',
    target_audience ENUM('all', 'students', 'teachers', 'staff') DEFAULT 'all',
    department VARCHAR(100) DEFAULT NULL, -- NULL means all departments
    semester INT DEFAULT NULL, -- NULL means all semesters
    attachment_url VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    INDEX idx_type (type),
    INDEX idx_audience (target_audience),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add fee_notifications table
CREATE TABLE IF NOT EXISTS fee_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_department VARCHAR(100) DEFAULT NULL,
    target_semester INT DEFAULT NULL,
    target_program VARCHAR(100) DEFAULT NULL,
    sent_count INT DEFAULT 0,
    sent_by INT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fee_id) REFERENCES fees(id),
    FOREIGN KEY (sent_by) REFERENCES users(id),
    
    INDEX idx_fee (fee_id),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
