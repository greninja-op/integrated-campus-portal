-- Create Super Admin Account
-- Password: admin123 (hashed with bcrypt)
-- IMPORTANT: Change this password in production!

INSERT INTO users (username, password, email, role, status) VALUES
('admin', '$2y$10$du.0smOc08Tu6Bld/2V3A.6iytE/Jcg4KqWt3fk9GHy7gjbSAu5LK', 'admin@studentportal.edu', 'admin', 'active');

-- Get the user_id for the admin user
SET @admin_user_id = LAST_INSERT_ID();

-- Insert admin details
INSERT INTO admins (user_id, admin_id, first_name, last_name, phone, designation) VALUES
(@admin_user_id, 'ADM2024001', 'System', 'Administrator', '1234567890', 'Super Admin');

-- Confirm creation
SELECT u.id, u.username, u.email, u.role, a.admin_id, a.first_name, a.last_name
FROM users u
JOIN admins a ON u.id = a.user_id
WHERE u.role = 'admin';
