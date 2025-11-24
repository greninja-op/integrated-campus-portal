-- Migration: Add parent/guardian fields to students table
-- Date: 2024-11-22
-- Description: Replace single guardian fields with two parent/guardian entries with relationship

USE studentportal;

-- Add new parent fields
ALTER TABLE students
ADD COLUMN parent1_name VARCHAR(100) AFTER guardian_email,
ADD COLUMN parent1_phone VARCHAR(15) AFTER parent1_name,
ADD COLUMN parent1_relationship VARCHAR(50) AFTER parent1_phone,
ADD COLUMN parent2_name VARCHAR(100) AFTER parent1_relationship,
ADD COLUMN parent2_phone VARCHAR(15) AFTER parent2_name,
ADD COLUMN parent2_relationship VARCHAR(50) AFTER parent2_phone;

-- Migrate existing guardian data to parent1 fields
UPDATE students 
SET 
    parent1_name = guardian_name,
    parent1_phone = guardian_phone,
    parent1_relationship = 'Guardian'
WHERE guardian_name IS NOT NULL;

-- Drop old guardian columns (optional - uncomment if you want to remove them)
-- ALTER TABLE students
-- DROP COLUMN guardian_name,
-- DROP COLUMN guardian_phone,
-- DROP COLUMN guardian_email;

SELECT 'Parent/Guardian fields added successfully!' AS message;
