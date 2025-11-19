-- Migration: Add category and priority fields to notices table
-- Date: 2025-11-19
-- Purpose: Fix frontend-backend schema mismatch

-- Add category and priority columns
ALTER TABLE notices 
ADD COLUMN category ENUM('general', 'academic', 'event', 'exam', 'holiday', 'sports') 
    DEFAULT 'general' AFTER content,
ADD COLUMN priority ENUM('low', 'normal', 'high', 'urgent') 
    DEFAULT 'normal' AFTER category;

-- Update existing records to have default values
UPDATE notices 
SET category = 'general', priority = 'normal' 
WHERE category IS NULL OR priority IS NULL;

-- Add index for better query performance
ALTER TABLE notices
ADD INDEX idx_category (category),
ADD INDEX idx_priority (priority);

-- Verify the changes
SHOW COLUMNS FROM notices;

-- Sample update for existing notices (optional - customize as needed)
UPDATE notices SET category = 'academic', priority = 'normal' WHERE title LIKE '%Exam%' OR title LIKE '%Academic%';
UPDATE notices SET category = 'exam', priority = 'high' WHERE title LIKE '%Exam Schedule%';
UPDATE notices SET category = 'event', priority = 'normal' WHERE title LIKE '%Meeting%' OR title LIKE '%Event%';
UPDATE notices SET category = 'holiday', priority = 'low' WHERE title LIKE '%Holiday%';

-- Display updated notices
SELECT id, title, category, priority, target_role, created_at FROM notices ORDER BY created_at DESC;
