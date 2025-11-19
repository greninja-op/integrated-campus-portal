-- Create assignments table
CREATE TABLE IF NOT EXISTS `assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `due_date` date NOT NULL,
  `max_marks` int(11) DEFAULT 100,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS `assignment_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `status` enum('not_submitted','submitted','graded') DEFAULT 'not_submitted',
  `file_path` varchar(500) DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `marks` int(11) DEFAULT NULL,
  `feedback` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_submission` (`assignment_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `assignment_submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add sample assignments
INSERT INTO `assignments` (`teacher_id`, `subject_id`, `title`, `description`, `due_date`, `max_marks`) VALUES
(2, 1, 'Data Structures Assignment 1', 'Implement a Binary Search Tree with insert, delete, and search operations', '2024-12-20', 100),
(2, 1, 'Algorithm Analysis', 'Analyze time complexity of sorting algorithms and provide detailed report', '2024-12-25', 50),
(3, 2, 'Database Design Project', 'Design a complete database schema for an e-commerce application', '2024-12-22', 100);

-- Add sample submissions
INSERT INTO `assignment_submissions` (`assignment_id`, `student_id`, `status`, `submitted_at`, `marks`) VALUES
(1, 1, 'submitted', '2024-11-15 10:30:00', 85),
(1, 2, 'submitted', '2024-11-16 14:20:00', 92),
(1, 3, 'not_submitted', NULL, NULL),
(2, 1, 'submitted', '2024-11-18 09:15:00', 45),
(2, 2, 'not_submitted', NULL, NULL),
(3, 1, 'submitted', '2024-11-17 16:45:00', 88);
