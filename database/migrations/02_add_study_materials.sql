CREATE TABLE IF NOT EXISTS study_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    department VARCHAR(50) NOT NULL,
    semester INT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    material_type ENUM('notes', 'question_papers') NOT NULL,
    unit VARCHAR(10) NULL,  -- For notes (e.g., 'Unit 1')
    year VARCHAR(4) NULL,   -- For question papers (e.g., '2023')
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_department (department),
    INDEX idx_semester (semester),
    INDEX idx_material_type (material_type),
    INDEX idx_unit (unit),
    INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
