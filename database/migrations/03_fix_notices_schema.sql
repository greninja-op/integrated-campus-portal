-- Add category and priority columns to notices table
ALTER TABLE notices
ADD COLUMN category ENUM('general', 'academic', 'event', 'exam', 'holiday', 'sports') DEFAULT 'general' AFTER content,
ADD COLUMN priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal' AFTER category;

-- Update existing notices with random/default values for testing
UPDATE notices SET category = 'academic', priority = 'high' WHERE title LIKE '%Exam%';
UPDATE notices SET category = 'holiday', priority = 'normal' WHERE title LIKE '%Holiday%';
UPDATE notices SET category = 'event', priority = 'low' WHERE title LIKE '%Event%';

-- Add indexes for better performance
CREATE INDEX idx_category ON notices(category);
CREATE INDEX idx_priority ON notices(priority);
