-- Create Sample Payment Records
-- Get necessary IDs
SET @session_id = (SELECT id FROM sessions WHERE is_active = 1 LIMIT 1);
SET @admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- Student 1 (STU2024001) - Semester 5 - All fees paid
SET @student1_id = (SELECT id FROM students WHERE student_id = 'STU2024001');

-- Pay tuition fee (on time, no late fine)
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student1_id, 
 (SELECT id FROM fees WHERE fee_name = 'Semester 5 Tuition Fee' AND session_id = @session_id),
 18000.00, 0.00, 18000.00, '2024-08-10', 'online', 'TXN2024081000123', 'RCP20240810001', 'completed', @admin_id);

-- Pay exam fee (on time)
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student1_id, 
 (SELECT id FROM fees WHERE fee_name = 'Semester 5 Examination Fee' AND session_id = @session_id),
 2000.00, 0.00, 2000.00, '2024-11-25', 'card', 'TXN2024112500456', 'RCP20241125001', 'completed', @admin_id);

-- Pay lab fee (on time)
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student1_id, 
 (SELECT id FROM fees WHERE fee_name = 'Computer Lab Fee' AND semester = 5 AND session_id = @session_id),
 1500.00, 0.00, 1500.00, '2024-08-28', 'online', 'TXN2024082800789', 'RCP20240828001', 'completed', @admin_id);

-- Pay project fee (on time)
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student1_id, 
 (SELECT id FROM fees WHERE fee_name = 'Minor Project Fee' AND session_id = @session_id),
 3000.00, 0.00, 3000.00, '2024-09-12', 'card', 'TXN2024091200234', 'RCP20240912001', 'completed', @admin_id);

-- Student 2 (STU2024002) - Semester 5 - Paid tuition late
SET @student2_id = (SELECT id FROM students WHERE student_id = 'STU2024002');

-- Pay tuition fee (10 days late, 500 rupees late fine)
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student2_id, 
 (SELECT id FROM fees WHERE fee_name = 'Semester 5 Tuition Fee' AND session_id = @session_id),
 18000.00, 500.00, 18500.00, '2024-08-25', 'cash', NULL, 'RCP20240825001', 'completed', @admin_id);

-- Pay lab fee (on time)
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student2_id, 
 (SELECT id FROM fees WHERE fee_name = 'Computer Lab Fee' AND semester = 5 AND session_id = @session_id),
 1500.00, 0.00, 1500.00, '2024-08-29', 'online', 'TXN2024082900567', 'RCP20240829001', 'completed', @admin_id);

-- Student 3 (STU2024003) - Semester 3 - All fees paid
SET @student3_id = (SELECT id FROM students WHERE student_id = 'STU2024003');

-- Pay tuition fee (on time)
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student3_id, 
 (SELECT id FROM fees WHERE fee_name = 'Semester 3 Tuition Fee' AND session_id = @session_id),
 18000.00, 0.00, 18000.00, '2024-08-12', 'online', 'TXN2024081200890', 'RCP20240812001', 'completed', @admin_id);

-- Pay exam fee (on time)
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student3_id, 
 (SELECT id FROM fees WHERE fee_name = 'Semester 3 Examination Fee' AND session_id = @session_id),
 2000.00, 0.00, 2000.00, '2024-11-20', 'card', 'TXN2024112000345', 'RCP20241120001', 'completed', @admin_id);

-- Pay lab fee (on time)
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student3_id, 
 (SELECT id FROM fees WHERE fee_name = 'Computer Lab Fee' AND semester = 3 AND session_id = @session_id),
 1500.00, 0.00, 1500.00, '2024-08-27', 'online', 'TXN2024082700678', 'RCP20240827001', 'completed', @admin_id);

-- Student 4 (STU2024004) - Semester 3 - Paid tuition, pending other fees
SET @student4_id = (SELECT id FROM students WHERE student_id = 'STU2024004');

-- Pay tuition fee (on time)
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student4_id, 
 (SELECT id FROM fees WHERE fee_name = 'Semester 3 Tuition Fee' AND session_id = @session_id),
 18000.00, 0.00, 18000.00, '2024-08-14', 'card', 'TXN2024081400234', 'RCP20240814001', 'completed', @admin_id);

-- Student 5 (STU2024005) - Semester 1 - Paid all first semester fees
SET @student5_id = (SELECT id FROM students WHERE student_id = 'STU2024005');

-- Pay tuition fee
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student5_id, 
 (SELECT id FROM fees WHERE fee_name = 'Semester 1 Tuition Fee' AND session_id = @session_id),
 18000.00, 0.00, 18000.00, '2024-08-08', 'online', 'TXN2024080800567', 'RCP20240808001', 'completed', @admin_id);

-- Pay library fee
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student5_id, 
 (SELECT id FROM fees WHERE fee_name = 'Library Fee (Annual)' AND session_id = @session_id),
 500.00, 0.00, 500.00, '2024-08-25', 'cash', NULL, 'RCP20240825002', 'completed', @admin_id);

-- Pay lab fee
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student5_id, 
 (SELECT id FROM fees WHERE fee_name = 'Computer Lab Fee' AND semester = 1 AND session_id = @session_id),
 1500.00, 0.00, 1500.00, '2024-08-26', 'online', 'TXN2024082600890', 'RCP20240826001', 'completed', @admin_id);

-- Pay sports fee
INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method, transaction_id, receipt_number, status, processed_by) VALUES
(@student5_id, 
 (SELECT id FROM fees WHERE fee_name = 'Sports and Cultural Fee (Annual)' AND session_id = @session_id),
 1000.00, 0.00, 1000.00, '2024-08-27', 'card', 'TXN2024082700234', 'RCP20240827002', 'completed', @admin_id);

-- Confirm creation and show payment summary
SELECT s.student_id, s.first_name, s.last_name, s.semester,
       COUNT(p.id) as total_payments,
       SUM(p.amount_paid) as total_fees_paid,
       SUM(p.late_fine) as total_late_fines,
       SUM(p.total_amount) as total_amount_paid
FROM students s
LEFT JOIN payments p ON s.id = p.student_id
GROUP BY s.id
ORDER BY s.student_id;

-- Show pending fees by student
SELECT s.student_id, s.first_name, s.last_name, s.semester,
       f.fee_name, f.amount, f.due_date,
       CASE WHEN p.id IS NULL THEN 'PENDING' ELSE 'PAID' END as payment_status
FROM students s
CROSS JOIN fees f
LEFT JOIN payments p ON s.id = p.student_id AND f.id = p.fee_id
WHERE f.session_id = @session_id
  AND (f.semester IS NULL OR f.semester = s.semester)
ORDER BY s.student_id, f.semester, f.fee_type;
