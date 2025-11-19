-- Create Fee Structures
-- Get active session ID
SET @session_id = (SELECT id FROM sessions WHERE is_active = 1 LIMIT 1);

-- Semester 1 Fees (Odd semester - higher fees)
INSERT INTO fees (fee_type, fee_name, amount, semester, department, program, session_id, due_date, late_fine_per_day, max_late_fine, description, is_active) VALUES
('tuition', 'Semester 1 Tuition Fee', 18000.00, 1, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-08-15', 50.00, 1000.00, 'Regular tuition fee for semester 1', 1),
('exam', 'Semester 1 Examination Fee', 2000.00, 1, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-09-30', 25.00, 500.00, 'End semester examination fee', 1),
('library', 'Library Fee (Annual)', 500.00, 1, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-08-30', 10.00, 100.00, 'Annual library membership and deposit', 1),
('laboratory', 'Computer Lab Fee', 1500.00, 1, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-08-30', 15.00, 200.00, 'Computer lab usage and maintenance', 1);

-- Semester 2 Fees (Even semester - lower fees)
INSERT INTO fees (fee_type, fee_name, amount, semester, department, program, session_id, due_date, late_fine_per_day, max_late_fine, description, is_active) VALUES
('tuition', 'Semester 2 Tuition Fee', 15000.00, 2, 'BCA', 'Bachelor of Computer Applications', @session_id, '2025-01-15', 50.00, 1000.00, 'Regular tuition fee for semester 2', 1),
('exam', 'Semester 2 Examination Fee', 2000.00, 2, 'BCA', 'Bachelor of Computer Applications', @session_id, '2025-04-30', 25.00, 500.00, 'End semester examination fee', 1),
('laboratory', 'Computer Lab Fee', 1500.00, 2, 'BCA', 'Bachelor of Computer Applications', @session_id, '2025-01-30', 15.00, 200.00, 'Computer lab usage and maintenance', 1);

-- Semester 3 Fees (Odd semester - higher fees)
INSERT INTO fees (fee_type, fee_name, amount, semester, department, program, session_id, due_date, late_fine_per_day, max_late_fine, description, is_active) VALUES
('tuition', 'Semester 3 Tuition Fee', 18000.00, 3, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-08-15', 50.00, 1000.00, 'Regular tuition fee for semester 3', 1),
('exam', 'Semester 3 Examination Fee', 2000.00, 3, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-11-30', 25.00, 500.00, 'End semester examination fee', 1),
('laboratory', 'Computer Lab Fee', 1500.00, 3, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-08-30', 15.00, 200.00, 'Computer lab usage and maintenance', 1);

-- Semester 4 Fees (Even semester - lower fees)
INSERT INTO fees (fee_type, fee_name, amount, semester, department, program, session_id, due_date, late_fine_per_day, max_late_fine, description, is_active) VALUES
('tuition', 'Semester 4 Tuition Fee', 15000.00, 4, 'BCA', 'Bachelor of Computer Applications', @session_id, '2025-01-15', 50.00, 1000.00, 'Regular tuition fee for semester 4', 1),
('exam', 'Semester 4 Examination Fee', 2000.00, 4, 'BCA', 'Bachelor of Computer Applications', @session_id, '2025-04-30', 25.00, 500.00, 'End semester examination fee', 1),
('laboratory', 'Computer Lab Fee', 1500.00, 4, 'BCA', 'Bachelor of Computer Applications', @session_id, '2025-01-30', 15.00, 200.00, 'Computer lab usage and maintenance', 1);

-- Semester 5 Fees (Odd semester - higher fees)
INSERT INTO fees (fee_type, fee_name, amount, semester, department, program, session_id, due_date, late_fine_per_day, max_late_fine, description, is_active) VALUES
('tuition', 'Semester 5 Tuition Fee', 18000.00, 5, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-08-15', 50.00, 1000.00, 'Regular tuition fee for semester 5', 1),
('exam', 'Semester 5 Examination Fee', 2000.00, 5, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-11-30', 25.00, 500.00, 'End semester examination fee', 1),
('laboratory', 'Computer Lab Fee', 1500.00, 5, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-08-30', 15.00, 200.00, 'Computer lab usage and maintenance', 1),
('project', 'Minor Project Fee', 3000.00, 5, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-09-15', 30.00, 500.00, 'Minor project work and guidance', 1);

-- Semester 6 Fees (Even semester - lower fees + project)
INSERT INTO fees (fee_type, fee_name, amount, semester, department, program, session_id, due_date, late_fine_per_day, max_late_fine, description, is_active) VALUES
('tuition', 'Semester 6 Tuition Fee', 15000.00, 6, 'BCA', 'Bachelor of Computer Applications', @session_id, '2025-01-15', 50.00, 1000.00, 'Regular tuition fee for semester 6', 1),
('exam', 'Semester 6 Examination Fee', 2000.00, 6, 'BCA', 'Bachelor of Computer Applications', @session_id, '2025-04-30', 25.00, 500.00, 'End semester examination fee', 1),
('laboratory', 'Computer Lab Fee', 1500.00, 6, 'BCA', 'Bachelor of Computer Applications', @session_id, '2025-01-30', 15.00, 200.00, 'Computer lab usage and maintenance', 1),
('project', 'Major Project Fee', 5000.00, 6, 'BCA', 'Bachelor of Computer Applications', @session_id, '2025-02-15', 50.00, 1000.00, 'Major project work, thesis, and defense', 1);

-- Common fees (applicable to all semesters)
INSERT INTO fees (fee_type, fee_name, amount, semester, department, program, session_id, due_date, late_fine_per_day, max_late_fine, description, is_active) VALUES
('sports', 'Sports and Cultural Fee (Annual)', 1000.00, NULL, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-08-31', 10.00, 150.00, 'Annual sports, gym, and cultural activities fee', 1),
('infrastructure', 'Infrastructure Development Fee (Annual)', 2000.00, NULL, 'BCA', 'Bachelor of Computer Applications', @session_id, '2024-08-31', 20.00, 300.00, 'Annual infrastructure and facility development', 1);

-- Confirm creation
SELECT fee_type, fee_name, amount, semester, due_date, late_fine_per_day, max_late_fine
FROM fees
WHERE session_id = @session_id
ORDER BY semester, fee_type;
