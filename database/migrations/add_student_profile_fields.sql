-- Add additional fields to students table for Virtual ID Card
ALTER TABLE `students` 
ADD COLUMN `guardian_name` varchar(255) DEFAULT NULL AFTER `address`,
ADD COLUMN `guardian_phone` varchar(20) DEFAULT NULL AFTER `guardian_name`,
ADD COLUMN `blood_group` varchar(10) DEFAULT NULL AFTER `guardian_phone`,
ADD COLUMN `profile_picture` varchar(500) DEFAULT NULL AFTER `blood_group`;

-- Update some sample data for testing
UPDATE `students` SET 
  `guardian_name` = 'Mr. Rajesh Verma',
  `guardian_phone` = '+91-9876543210',
  `blood_group` = 'O+',
  `address` = '123 Main Street, Mumbai, Maharashtra - 400001'
WHERE `student_id` = 'student001';

UPDATE `students` SET 
  `guardian_name` = 'Mrs. Priya Singh',
  `guardian_phone` = '+91-9876543211',
  `blood_group` = 'A+',
  `address` = '456 Park Avenue, Delhi, NCR - 110001'
WHERE `student_id` = 'STU2024001';

UPDATE `students` SET 
  `guardian_name` = 'Mr. Amit Patel',
  `guardian_phone` = '+91-9876543212',
  `blood_group` = 'B+',
  `address` = '789 Lake View, Bangalore, Karnataka - 560001'
WHERE `student_id` = 'STU2024002';
