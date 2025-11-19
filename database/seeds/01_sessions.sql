-- Create Academic Sessions
-- This script creates sample academic sessions

-- Create current and past sessions
INSERT INTO sessions (session_name, start_year, end_year, start_date, end_date, is_active) VALUES
('2024-2025', 2024, 2025, '2024-07-01', '2025-06-30', 1),
('2023-2024', 2023, 2024, '2023-07-01', '2024-06-30', 0),
('2022-2023', 2022, 2023, '2022-07-01', '2023-06-30', 0);

-- Get the IDs of created sessions for reference
-- Note: When importing, you can use LAST_INSERT_ID() or query these values
SELECT * FROM sessions ORDER BY start_year DESC;
