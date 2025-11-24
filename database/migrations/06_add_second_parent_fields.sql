-- Migration: Add second parent/guardian fields to students table
-- Date: November 22, 2025

USE studentportal;

-- Add second parent fields and relationship fields
ALTER TABLE students
ADD COLUMN guardian1_name VARCHAR(100) AFTER guardian_email,
ADD COLUMN guardian1_phone VARCHAR(15) AFTER guardian1_name,
ADD COLUMN guardian1_email VARCHAR(100) AFTER guardian1_phone,
ADD COLUMN guardian1_relationship VARCHAR(50) AFTER guardian1_email,
ADD COLUMN guardian2_name VARCHAR(100) AFTER guardian1_relationship,
ADD COLUMN guardian2_phone VARCHAR(15) AFTER guardian2_name,
ADD COLUMN guardian2_email VARCHAR(100) AFTER guardian2_phone,
ADD COLUMN guardian2_relationship VARCHAR(50) AFTER guardian2_email;

-- Copy existing guardian data to guardian1 fields
UPDATE students 
SET guardian1_name = guardian_name,
    guardian1_phone = guardian_phone,
    guardian1_email = guardian_email
WHERE guardian_name IS NOT NULL;

-- Note: Old guardian fields (guardian_name, guardian_phone, guardian_email) are kept for backward compatibility
-- but new forms should use guardian1 and guardian2 fields
