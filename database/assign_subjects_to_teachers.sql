-- Assign BCA subjects to BCA teachers (teachers 1-5, 16, 17)
-- Teacher 1: Sem 1 & 2 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 1, id FROM subjects WHERE department = 'BCA' AND semester IN (1, 2);

-- Teacher 2: Sem 3 & 4 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 2, id FROM subjects WHERE department = 'BCA' AND semester IN (3, 4);

-- Teacher 3: Sem 5 & 6 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 3, id FROM subjects WHERE department = 'BCA' AND semester IN (5, 6);

-- Teacher 4: Sem 1, 3, 5 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 4, id FROM subjects WHERE department = 'BCA' AND semester IN (1, 3, 5);

-- Teacher 5: Sem 2, 4, 6 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 5, id FROM subjects WHERE department = 'BCA' AND semester IN (2, 4, 6);

-- Teacher 16 (Test Teacher): All BCA subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 16, id FROM subjects WHERE department = 'BCA';

-- Teacher 17 (test teacher): All BCA subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 17, id FROM subjects WHERE department = 'BCA';

-- Assign BBA subjects to BBA teachers (teachers 6-10)
-- Teacher 6: Sem 1 & 2 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 6, id FROM subjects WHERE department = 'BBA' AND semester IN (1, 2);

-- Teacher 7: Sem 3 & 4 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 7, id FROM subjects WHERE department = 'BBA' AND semester IN (3, 4);

-- Teacher 8: Sem 5 & 6 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 8, id FROM subjects WHERE department = 'BBA' AND semester IN (5, 6);

-- Teacher 9: Sem 1, 3, 5 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 9, id FROM subjects WHERE department = 'BBA' AND semester IN (1, 3, 5);

-- Teacher 10: Sem 2, 4, 6 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 10, id FROM subjects WHERE department = 'BBA' AND semester IN (2, 4, 6);

-- Assign BCOM subjects to BCOM teachers (teachers 11-15)
-- Teacher 11: Sem 1 & 2 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 11, id FROM subjects WHERE department = 'BCOM' AND semester IN (1, 2);

-- Teacher 12: Sem 3 & 4 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 12, id FROM subjects WHERE department = 'BCOM' AND semester IN (3, 4);

-- Teacher 13: Sem 5 & 6 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 13, id FROM subjects WHERE department = 'BCOM' AND semester IN (5, 6);

-- Teacher 14: Sem 1, 3, 5 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 14, id FROM subjects WHERE department = 'BCOM' AND semester IN (1, 3, 5);

-- Teacher 15: Sem 2, 4, 6 subjects
INSERT INTO teacher_subjects (teacher_id, subject_id) 
SELECT 15, id FROM subjects WHERE department = 'BCOM' AND semester IN (2, 4, 6);
