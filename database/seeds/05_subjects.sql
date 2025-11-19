-- Create Sample Subjects
-- Subjects for BCA (Bachelor of Computer Applications) program

-- Semester 1 Subjects
INSERT INTO subjects (subject_code, subject_name, credit_hours, department, semester, description, is_active) VALUES
('BCA101', 'Programming Fundamentals', 4, 'BCA', 1, 'Introduction to programming concepts using C', 1),
('BCA102', 'Digital Electronics', 3, 'BCA', 1, 'Fundamentals of digital logic and circuits', 1),
('BCA103', 'Mathematics I', 4, 'BCA', 1, 'Calculus and Linear Algebra', 1),
('BCA104', 'English Communication', 3, 'BCA', 1, 'Business communication and technical writing', 1),
('BCA105', 'Computer Fundamentals', 3, 'BCA', 1, 'Basic computer organization and architecture', 1);

-- Semester 2 Subjects
INSERT INTO subjects (subject_code, subject_name, credit_hours, department, semester, description, is_active) VALUES
('BCA201', 'Data Structures', 4, 'BCA', 2, 'Arrays, linked lists, stacks, queues, trees', 1),
('BCA202', 'Database Management Systems', 4, 'BCA', 2, 'Relational databases, SQL, normalization', 1),
('BCA203', 'Mathematics II', 3, 'BCA', 2, 'Discrete mathematics and probability', 1),
('BCA204', 'Operating Systems', 3, 'BCA', 2, 'Process management, memory management, file systems', 1),
('BCA205', 'Web Technologies', 3, 'BCA', 2, 'HTML, CSS, JavaScript, basic web development', 1);

-- Semester 3 Subjects
INSERT INTO subjects (subject_code, subject_name, credit_hours, department, semester, description, is_active) VALUES
('BCA301', 'Object Oriented Programming', 4, 'BCA', 3, 'OOP concepts using Java', 1),
('BCA302', 'Computer Networks', 4, 'BCA', 3, 'Networking fundamentals, protocols, TCP/IP', 1),
('BCA303', 'Software Engineering', 3, 'BCA', 3, 'SDLC, requirements analysis, design patterns', 1),
('BCA304', 'Statistical Methods', 3, 'BCA', 3, 'Statistical analysis and data interpretation', 1),
('BCA305', 'System Analysis and Design', 3, 'BCA', 3, 'System development methodologies', 1);

-- Semester 4 Subjects
INSERT INTO subjects (subject_code, subject_name, credit_hours, department, semester, description, is_active) VALUES
('BCA401', 'Python Programming', 4, 'BCA', 4, 'Python fundamentals and applications', 1),
('BCA402', 'Theory of Computation', 3, 'BCA', 4, 'Automata, formal languages, computability', 1),
('BCA403', 'Data Analytics', 4, 'BCA', 4, 'Data analysis, visualization, machine learning basics', 1),
('BCA404', 'Computer Graphics', 3, 'BCA', 4, 'Graphics algorithms, transformations, rendering', 1),
('BCA405', 'Mobile Application Development', 3, 'BCA', 4, 'Android app development fundamentals', 1);

-- Semester 5 Subjects
INSERT INTO subjects (subject_code, subject_name, credit_hours, department, semester, description, is_active) VALUES
('BCA501', 'Advanced Java', 4, 'BCA', 5, 'Java EE, servlets, JSP, frameworks', 1),
('BCA502', 'Artificial Intelligence', 4, 'BCA', 5, 'AI fundamentals, search algorithms, expert systems', 1),
('BCA503', 'Cloud Computing', 3, 'BCA', 5, 'Cloud architectures, AWS, Azure basics', 1),
('BCA504', 'Information Security', 3, 'BCA', 5, 'Cryptography, network security, ethical hacking', 1),
('BCA505', 'Elective I: Big Data', 3, 'BCA', 5, 'Hadoop, Spark, distributed computing', 1);

-- Semester 6 Subjects
INSERT INTO subjects (subject_code, subject_name, credit_hours, department, semester, description, is_active) VALUES
('BCA601', 'Project Work', 6, 'BCA', 6, 'Final year project and thesis', 1),
('BCA602', 'Machine Learning', 4, 'BCA', 6, 'Supervised and unsupervised learning algorithms', 1),
('BCA603', 'Internet of Things', 3, 'BCA', 6, 'IoT fundamentals, sensors, Arduino programming', 1),
('BCA604', 'Blockchain Technology', 3, 'BCA', 6, 'Distributed ledgers, cryptocurrencies, smart contracts', 1),
('BCA605', 'Elective II: DevOps', 3, 'BCA', 6, 'CI/CD, Docker, Kubernetes, automation', 1);

-- Confirm creation
SELECT subject_code, subject_name, credit_hours, semester, department
FROM subjects
ORDER BY semester, subject_code;
