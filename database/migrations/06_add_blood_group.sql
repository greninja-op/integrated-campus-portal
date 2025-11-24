-- Migration: Add blood group field to students table
-- Date: 2024-11-22
-- Description: Add blood_group column for medical records

USE studentportal;

-- Add blood group field
ALTER TABLE students
ADD COLUMN blood_group VARCHAR(10) AFTER gender;

SELECT 'Blood group field added successfully!' AS message;
