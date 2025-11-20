-- Populate all subjects for BCA, BBA, and B.Com programs
-- Based on course curriculum documents

-- BCA Subjects
INSERT INTO subjects (subject_code, subject_name, credit_hours, department, semester, is_active) VALUES
-- Semester 1
('BCA101', 'English Paper 1', 4, 'BCA', 1, TRUE),
('BCA102', 'Computer Fundamentals and Digital Principles', 4, 'BCA', 1, TRUE),
('BCA103', 'Basic Statistics and Introductory Probability Theory', 4, 'BCA', 1, TRUE),
('BCA104', 'Mathematics Discrete Mathematics I', 4, 'BCA', 1, TRUE),
('BCA105', 'Methodology of Programming and C Language', 4, 'BCA', 1, TRUE),
('BCA106', 'Software Lab I', 2, 'BCA', 1, TRUE),

-- Semester 2
('BCA201', 'English Paper 2', 4, 'BCA', 2, TRUE),
('BCA202', 'Database Management Systems', 4, 'BCA', 2, TRUE),
('BCA203', 'Computer Organization and Architecture', 4, 'BCA', 2, TRUE),
('BCA204', 'Object Oriented Programming Using C++', 4, 'BCA', 2, TRUE),
('BCA205', 'Mathematics Discrete Mathematics II', 4, 'BCA', 2, TRUE),
('BCA206', 'Software Lab II', 2, 'BCA', 2, TRUE),

-- Semester 3
('BCA301', 'Computer Graphics', 4, 'BCA', 3, TRUE),
('BCA302', 'Microprocessor and PC Hardware', 4, 'BCA', 3, TRUE),
('BCA303', 'Operating Systems', 4, 'BCA', 3, TRUE),
('BCA304', 'Advanced Statistical Methods', 4, 'BCA', 3, TRUE),
('BCA305', 'Data Structure Using C++', 4, 'BCA', 3, TRUE),
('BCA306', 'Software Lab III', 2, 'BCA', 3, TRUE),

-- Semester 4
('BCA401', 'System Analysis and Software Engineering', 4, 'BCA', 4, TRUE),
('BCA402', 'Design and Analysis of Algorithms', 4, 'BCA', 4, TRUE),
('BCA403', 'Linux Administration', 4, 'BCA', 4, TRUE),
('BCA404', 'Web Programming Using PHP', 4, 'BCA', 4, TRUE),
('BCA405', 'Operation Research', 4, 'BCA', 4, TRUE),
('BCA406', 'Software Lab IV', 2, 'BCA', 4, TRUE),

-- Semester 5
('BCA501', 'Computer Networks', 4, 'BCA', 5, TRUE),
('BCA502', 'IT and Environment', 4, 'BCA', 5, TRUE),
('BCA503', 'Java Programming Using Linux', 4, 'BCA', 5, TRUE),
('BCA504', 'Open Course', 4, 'BCA', 5, TRUE),
('BCA505', 'Mini Project', 4, 'BCA', 5, TRUE),
('BCA506', 'Software Lab V', 2, 'BCA', 5, TRUE),

-- Semester 6
('BCA601', 'Cloud Computing', 4, 'BCA', 6, TRUE),
('BCA602', 'Data Mining', 4, 'BCA', 6, TRUE),
('BCA603', 'Mobile Application Development Android', 4, 'BCA', 6, TRUE),
('BCA604', 'Main Project', 6, 'BCA', 6, TRUE),
('BCA605', 'Course Viva', 2, 'BCA', 6, TRUE),
('BCA606', 'Software Lab VI', 2, 'BCA', 6, TRUE);

-- BBA Subjects
INSERT INTO subjects (subject_code, subject_name, credit_hours, department, semester, is_active) VALUES
-- Semester 1
('BBA101', 'Business Accounting', 4, 'BBA', 1, TRUE),
('BBA102', 'Fundamentals of Business Mathematics', 4, 'BBA', 1, TRUE),
('BBA103', 'Principles and Methodology of Management', 4, 'BBA', 1, TRUE),
('BBA104', 'Fundamentals of Business Statistics', 4, 'BBA', 1, TRUE),
('BBA105', 'Global Business Environment', 4, 'BBA', 1, TRUE),

-- Semester 2
('BBA201', 'Business Communication', 4, 'BBA', 2, TRUE),
('BBA202', 'Cost and Management Accounting', 4, 'BBA', 2, TRUE),
('BBA203', 'Mathematics for Management', 4, 'BBA', 2, TRUE),
('BBA204', 'Statistics for Management', 4, 'BBA', 2, TRUE),
('BBA205', 'English - Issues That Matter', 4, 'BBA', 2, TRUE),

-- Semester 3
('BBA301', 'Business Laws', 4, 'BBA', 3, TRUE),
('BBA302', 'Human Resource Management', 4, 'BBA', 3, TRUE),
('BBA303', 'Marketing Management', 4, 'BBA', 3, TRUE),
('BBA304', 'Research Methodology', 4, 'BBA', 3, TRUE),
('BBA305', 'Corporate Accounting', 4, 'BBA', 3, TRUE),

-- Semester 4
('BBA401', 'Basic Informatics for Management', 4, 'BBA', 4, TRUE),
('BBA402', 'Corporate Law', 4, 'BBA', 4, TRUE),
('BBA403', 'Financial Management', 4, 'BBA', 4, TRUE),
('BBA404', 'Managerial Economics', 4, 'BBA', 4, TRUE),
('BBA405', 'Entrepreneurship', 4, 'BBA', 4, TRUE),
('BBA406', 'English - Evolution of the Philosophy of Science', 4, 'BBA', 4, TRUE),

-- Semester 5
('BBA501', 'Industrial Relations', 4, 'BBA', 5, TRUE),
('BBA502', 'Intellectual Property Rights and Industrial Laws', 4, 'BBA', 5, TRUE),
('BBA503', 'Operations Management', 4, 'BBA', 5, TRUE),
('BBA504', 'Environment Science and Human Rights', 4, 'BBA', 5, TRUE),
('BBA505', 'Capital Market and Investment Management', 4, 'BBA', 5, TRUE),
('BBA506', 'Organisational Behaviour', 4, 'BBA', 5, TRUE),

-- Semester 6
('BBA601', 'Advertising and Salesmanship', 4, 'BBA', 6, TRUE),
('BBA602', 'Communication Skills and Personality Development', 4, 'BBA', 6, TRUE),
('BBA603', 'Investment and Insurance Management', 4, 'BBA', 6, TRUE),
('BBA604', 'Strategic Management', 4, 'BBA', 6, TRUE),
('BBA605', 'Banking and Insurance Management', 4, 'BBA', 6, TRUE),
('BBA606', 'Income Tax Theory, Law, and Practice', 4, 'BBA', 6, TRUE),
('BBA607', 'Production Management', 4, 'BBA', 6, TRUE);

-- B.Com Subjects
INSERT INTO subjects (subject_code, subject_name, credit_hours, department, semester, is_active) VALUES
-- Semester 1
('BCOM101', 'Corporate Regulations and Administration', 4, 'B.Com', 1, TRUE),
('BCOM102', 'Dimensions and Methodology of Business Studies', 4, 'B.Com', 1, TRUE),
('BCOM103', 'Financial Accounting 1', 4, 'B.Com', 1, TRUE),
('BCOM104', 'Banking and Insurance', 4, 'B.Com', 1, TRUE),
('BCOM105', 'English - Communication Skills', 4, 'B.Com', 1, TRUE),

-- Semester 2
('BCOM201', 'Business Management', 4, 'B.Com', 2, TRUE),
('BCOM202', 'Business Regulatory Framework', 4, 'B.Com', 2, TRUE),
('BCOM203', 'Financial Accounting 2', 4, 'B.Com', 2, TRUE),
('BCOM204', 'Principles of Business Decisions', 4, 'B.Com', 2, TRUE),
('BCOM205', 'Quantitative Techniques for Business Research', 4, 'B.Com', 2, TRUE),
('BCOM206', 'English - Issues That Matter', 4, 'B.Com', 2, TRUE),

-- Semester 3
('BCOM301', 'Corporate Accounting 1', 4, 'B.Com', 3, TRUE),
('BCOM302', 'Financial Markets and Operations', 4, 'B.Com', 3, TRUE),
('BCOM303', 'Marketing Management', 4, 'B.Com', 3, TRUE),
('BCOM304', 'Quantitative Techniques for Business 1', 4, 'B.Com', 3, TRUE),
('BCOM305', 'Goods and Services Tax', 4, 'B.Com', 3, TRUE),
('BCOM306', 'English - Literature and Identity', 4, 'B.Com', 3, TRUE),

-- Semester 4
('BCOM401', 'Corporate Accounting 2', 4, 'B.Com', 4, TRUE),
('BCOM402', 'Entrepreneurship Development and Project Management', 4, 'B.Com', 4, TRUE),
('BCOM403', 'Financial Services', 4, 'B.Com', 4, TRUE),
('BCOM404', 'Quantitative Techniques for Business 2', 4, 'B.Com', 4, TRUE),
('BCOM405', 'Information Technology for Office', 4, 'B.Com', 4, TRUE),
('BCOM406', 'English - Illuminations', 4, 'B.Com', 4, TRUE),

-- Semester 5
('BCOM501', 'Cost Accounting 1', 4, 'B.Com', 5, TRUE),
('BCOM502', 'Brand Management', 4, 'B.Com', 5, TRUE),
('BCOM503', 'Computer Fundamentals, Internet, and MS Office', 4, 'B.Com', 5, TRUE),
('BCOM504', 'E-Commerce', 4, 'B.Com', 5, TRUE),
('BCOM505', 'Environment Management and Human Rights', 4, 'B.Com', 5, TRUE),
('BCOM506', 'Programming in C Theory', 4, 'B.Com', 5, TRUE),

-- Semester 6
('BCOM601', 'Cost Accounting 2', 4, 'B.Com', 6, TRUE),
('BCOM602', 'Management Accounting', 4, 'B.Com', 6, TRUE),
('BCOM603', 'Advertisement and Sales Management', 4, 'B.Com', 6, TRUE),
('BCOM604', 'Auditing and Assurance', 4, 'B.Com', 6, TRUE),
('BCOM605', 'Income Tax 2', 4, 'B.Com', 6, TRUE),
('BCOM606', 'International Marketing', 4, 'B.Com', 6, TRUE);
