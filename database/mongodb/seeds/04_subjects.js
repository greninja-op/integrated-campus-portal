/**
 * Seed: Subjects (BCA, BBA, B.Com - full curriculum)
 * Converted from database/seeds/11_all_subjects.sql (the authoritative,
 * final curriculum that supersedes 05_subjects.sql and 10_bba_bcom_subjects.sql).
 *
 * Run AFTER schema.js. Upserts by subject_code so it is safe to re-run.
 */

db = db.getSiblingDB('studentportal');
const now = new Date();

// [subject_code, subject_name, credit_hours, department, semester]
const subjects = [
  // ---- BCA ----
  ['BCA101', 'English Paper 1', 4, 'BCA', 1],
  ['BCA102', 'Computer Fundamentals and Digital Principles', 4, 'BCA', 1],
  ['BCA103', 'Basic Statistics and Introductory Probability Theory', 4, 'BCA', 1],
  ['BCA104', 'Mathematics Discrete Mathematics I', 4, 'BCA', 1],
  ['BCA105', 'Methodology of Programming and C Language', 4, 'BCA', 1],
  ['BCA106', 'Software Lab I', 2, 'BCA', 1],
  ['BCA201', 'English Paper 2', 4, 'BCA', 2],
  ['BCA202', 'Database Management Systems', 4, 'BCA', 2],
  ['BCA203', 'Computer Organization and Architecture', 4, 'BCA', 2],
  ['BCA204', 'Object Oriented Programming Using C++', 4, 'BCA', 2],
  ['BCA205', 'Mathematics Discrete Mathematics II', 4, 'BCA', 2],
  ['BCA206', 'Software Lab II', 2, 'BCA', 2],
  ['BCA301', 'Computer Graphics', 4, 'BCA', 3],
  ['BCA302', 'Microprocessor and PC Hardware', 4, 'BCA', 3],
  ['BCA303', 'Operating Systems', 4, 'BCA', 3],
  ['BCA304', 'Advanced Statistical Methods', 4, 'BCA', 3],
  ['BCA305', 'Data Structure Using C++', 4, 'BCA', 3],
  ['BCA306', 'Software Lab III', 2, 'BCA', 3],
  ['BCA401', 'System Analysis and Software Engineering', 4, 'BCA', 4],
  ['BCA402', 'Design and Analysis of Algorithms', 4, 'BCA', 4],
  ['BCA403', 'Linux Administration', 4, 'BCA', 4],
  ['BCA404', 'Web Programming Using PHP', 4, 'BCA', 4],
  ['BCA405', 'Operation Research', 4, 'BCA', 4],
  ['BCA406', 'Software Lab IV', 2, 'BCA', 4],
  ['BCA501', 'Computer Networks', 4, 'BCA', 5],
  ['BCA502', 'IT and Environment', 4, 'BCA', 5],
  ['BCA503', 'Java Programming Using Linux', 4, 'BCA', 5],
  ['BCA504', 'Open Course', 4, 'BCA', 5],
  ['BCA505', 'Mini Project', 4, 'BCA', 5],
  ['BCA506', 'Software Lab V', 2, 'BCA', 5],
  ['BCA601', 'Cloud Computing', 4, 'BCA', 6],
  ['BCA602', 'Data Mining', 4, 'BCA', 6],
  ['BCA603', 'Mobile Application Development Android', 4, 'BCA', 6],
  ['BCA604', 'Main Project', 6, 'BCA', 6],
  ['BCA605', 'Course Viva', 2, 'BCA', 6],
  ['BCA606', 'Software Lab VI', 2, 'BCA', 6],

  // ---- BBA ----
  ['BBA101', 'Business Accounting', 4, 'BBA', 1],
  ['BBA102', 'Fundamentals of Business Mathematics', 4, 'BBA', 1],
  ['BBA103', 'Principles and Methodology of Management', 4, 'BBA', 1],
  ['BBA104', 'Fundamentals of Business Statistics', 4, 'BBA', 1],
  ['BBA105', 'Global Business Environment', 4, 'BBA', 1],
  ['BBA201', 'Business Communication', 4, 'BBA', 2],
  ['BBA202', 'Cost and Management Accounting', 4, 'BBA', 2],
  ['BBA203', 'Mathematics for Management', 4, 'BBA', 2],
  ['BBA204', 'Statistics for Management', 4, 'BBA', 2],
  ['BBA205', 'English - Issues That Matter', 4, 'BBA', 2],
  ['BBA301', 'Business Laws', 4, 'BBA', 3],
  ['BBA302', 'Human Resource Management', 4, 'BBA', 3],
  ['BBA303', 'Marketing Management', 4, 'BBA', 3],
  ['BBA304', 'Research Methodology', 4, 'BBA', 3],
  ['BBA305', 'Corporate Accounting', 4, 'BBA', 3],
  ['BBA401', 'Basic Informatics for Management', 4, 'BBA', 4],
  ['BBA402', 'Corporate Law', 4, 'BBA', 4],
  ['BBA403', 'Financial Management', 4, 'BBA', 4],
  ['BBA404', 'Managerial Economics', 4, 'BBA', 4],
  ['BBA405', 'Entrepreneurship', 4, 'BBA', 4],
  ['BBA406', 'English - Evolution of the Philosophy of Science', 4, 'BBA', 4],
  ['BBA501', 'Industrial Relations', 4, 'BBA', 5],
  ['BBA502', 'Intellectual Property Rights and Industrial Laws', 4, 'BBA', 5],
  ['BBA503', 'Operations Management', 4, 'BBA', 5],
  ['BBA504', 'Environment Science and Human Rights', 4, 'BBA', 5],
  ['BBA505', 'Capital Market and Investment Management', 4, 'BBA', 5],
  ['BBA506', 'Organisational Behaviour', 4, 'BBA', 5],
  ['BBA601', 'Advertising and Salesmanship', 4, 'BBA', 6],
  ['BBA602', 'Communication Skills and Personality Development', 4, 'BBA', 6],
  ['BBA603', 'Investment and Insurance Management', 4, 'BBA', 6],
  ['BBA604', 'Strategic Management', 4, 'BBA', 6],
  ['BBA605', 'Banking and Insurance Management', 4, 'BBA', 6],
  ['BBA606', 'Income Tax Theory, Law, and Practice', 4, 'BBA', 6],
  ['BBA607', 'Production Management', 4, 'BBA', 6],

  // ---- B.Com ----
  ['BCOM101', 'Corporate Regulations and Administration', 4, 'B.Com', 1],
  ['BCOM102', 'Dimensions and Methodology of Business Studies', 4, 'B.Com', 1],
  ['BCOM103', 'Financial Accounting 1', 4, 'B.Com', 1],
  ['BCOM104', 'Banking and Insurance', 4, 'B.Com', 1],
  ['BCOM105', 'English - Communication Skills', 4, 'B.Com', 1],
  ['BCOM201', 'Business Management', 4, 'B.Com', 2],
  ['BCOM202', 'Business Regulatory Framework', 4, 'B.Com', 2],
  ['BCOM203', 'Financial Accounting 2', 4, 'B.Com', 2],
  ['BCOM204', 'Principles of Business Decisions', 4, 'B.Com', 2],
  ['BCOM205', 'Quantitative Techniques for Business Research', 4, 'B.Com', 2],
  ['BCOM206', 'English - Issues That Matter', 4, 'B.Com', 2],
  ['BCOM301', 'Corporate Accounting 1', 4, 'B.Com', 3],
  ['BCOM302', 'Financial Markets and Operations', 4, 'B.Com', 3],
  ['BCOM303', 'Marketing Management', 4, 'B.Com', 3],
  ['BCOM304', 'Quantitative Techniques for Business 1', 4, 'B.Com', 3],
  ['BCOM305', 'Goods and Services Tax', 4, 'B.Com', 3],
  ['BCOM306', 'English - Literature and Identity', 4, 'B.Com', 3],
  ['BCOM401', 'Corporate Accounting 2', 4, 'B.Com', 4],
  ['BCOM402', 'Entrepreneurship Development and Project Management', 4, 'B.Com', 4],
  ['BCOM403', 'Financial Services', 4, 'B.Com', 4],
  ['BCOM404', 'Quantitative Techniques for Business 2', 4, 'B.Com', 4],
  ['BCOM405', 'Information Technology for Office', 4, 'B.Com', 4],
  ['BCOM406', 'English - Illuminations', 4, 'B.Com', 4],
  ['BCOM501', 'Cost Accounting 1', 4, 'B.Com', 5],
  ['BCOM502', 'Brand Management', 4, 'B.Com', 5],
  ['BCOM503', 'Computer Fundamentals, Internet, and MS Office', 4, 'B.Com', 5],
  ['BCOM504', 'E-Commerce', 4, 'B.Com', 5],
  ['BCOM505', 'Environment Management and Human Rights', 4, 'B.Com', 5],
  ['BCOM506', 'Programming in C Theory', 4, 'B.Com', 5],
  ['BCOM601', 'Cost Accounting 2', 4, 'B.Com', 6],
  ['BCOM602', 'Management Accounting', 4, 'B.Com', 6],
  ['BCOM603', 'Advertisement and Sales Management', 4, 'B.Com', 6],
  ['BCOM604', 'Auditing and Assurance', 4, 'B.Com', 6],
  ['BCOM605', 'Income Tax 2', 4, 'B.Com', 6],
  ['BCOM606', 'International Marketing', 4, 'B.Com', 6]
];

subjects.forEach((s) => {
  db.subjects.updateOne(
    { subject_code: s[0] },
    {
      $set: {
        subject_code: s[0], subject_name: s[1], credit_hours: s[2],
        department: s[3], semester: s[4], is_active: true, updated_at: now
      },
      $setOnInsert: { created_at: now }
    },
    { upsert: true }
  );
});

print('Seeded ' + db.subjects.countDocuments() + ' subjects.');
