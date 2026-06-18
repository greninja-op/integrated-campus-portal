/**
 * ICP (Integrated Campus Portal) - MongoDB Schema
 * --------------------------------------------------
 * Converted from the original MySQL schema (database/schema.sql) plus all
 * migrations under database/migrations/. Relational tables become collections,
 * ENUMs become JSON-schema "enum" constraints, and foreign keys become
 * ObjectId references (stored as <table>_id fields).
 *
 * Run with:  mongosh "<connection-string>/studentportal" schema.js
 * or:        mongosh studentportal --file schema.js
 *
 * This script is idempotent: it drops existing collections before recreating
 * them, mirroring the "DROP TABLE IF EXISTS" behaviour of schema.sql.
 */

// Use the studentportal database (matches the original MySQL db name)
db = db.getSiblingDB('studentportal');

print('Creating ICP MongoDB schema in database: studentportal');

// Collections to (re)create, in dependency order
const collections = [
  'users', 'sessions', 'students', 'teachers', 'admins', 'subjects',
  'semesters', 'teacher_subjects', 'marks', 'exam_marks', 'attendance',
  'fees', 'payments', 'study_materials', 'notices', 'fee_notifications',
  'assignments', 'assignment_submissions'
];

// Clean install - drop existing collections
collections.forEach((name) => {
  if (db.getCollectionNames().includes(name)) {
    db[name].drop();
    print('  dropped collection: ' + name);
  }
});

// Helper to create a collection with a validator (validationAction: 'warn'
// keeps inserts flexible while still documenting the expected shape).
function createValidated(name, required, properties) {
  db.createCollection(name, {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: required,
        properties: properties
      }
    },
    validationLevel: 'moderate',
    validationAction: 'warn'
  });
  print('  created collection: ' + name);
}

const ts = { bsonType: ['date', 'null'] };

/* 1. users -------------------------------------------------------------- */
createValidated('users',
  ['username', 'password', 'email', 'role'],
  {
    username: { bsonType: 'string' },
    password: { bsonType: 'string' },
    email: { bsonType: 'string' },
    role: { enum: ['student', 'teacher', 'admin'] },
    status: { enum: ['active', 'inactive', 'suspended'] },
    created_at: ts,
    updated_at: ts,
    last_login: ts
  });

/* 2. sessions (academic years) ----------------------------------------- */
createValidated('sessions',
  ['session_name', 'start_year', 'end_year', 'start_date', 'end_date'],
  {
    session_name: { bsonType: 'string' },
    start_year: { bsonType: 'int' },
    end_year: { bsonType: 'int' },
    start_date: { bsonType: 'date' },
    end_date: { bsonType: 'date' },
    is_active: { bsonType: 'bool' },
    created_at: ts,
    updated_at: ts
  });

/* 3. students ----------------------------------------------------------- */
createValidated('students',
  ['user_id', 'student_id', 'first_name', 'last_name', 'gender', 'session_id', 'semester'],
  {
    user_id: { bsonType: 'objectId' },
    student_id: { bsonType: 'string' },
    first_name: { bsonType: 'string' },
    last_name: { bsonType: 'string' },
    date_of_birth: { bsonType: ['date', 'null'] },
    gender: { enum: ['male', 'female', 'other'] },
    blood_group: { bsonType: ['string', 'null'] },
    phone: { bsonType: ['string', 'null'] },
    address: { bsonType: ['string', 'null'] },
    enrollment_date: { bsonType: ['date', 'null'] },
    session_id: { bsonType: 'objectId' },
    semester: { bsonType: 'int', minimum: 1, maximum: 6 },
    semester_start_date: { bsonType: ['date', 'null'] },
    last_semester_update: { bsonType: ['date', 'null'] },
    department: { bsonType: ['string', 'null'] },
    program: { bsonType: ['string', 'null'] },
    batch_year: { bsonType: ['int', 'null'] },
    // legacy single-guardian fields (kept for backward compatibility)
    guardian_name: { bsonType: ['string', 'null'] },
    guardian_phone: { bsonType: ['string', 'null'] },
    guardian_email: { bsonType: ['string', 'null'] },
    // guardian1 / guardian2 (06_add_second_parent_fields)
    guardian1_name: { bsonType: ['string', 'null'] },
    guardian1_phone: { bsonType: ['string', 'null'] },
    guardian1_email: { bsonType: ['string', 'null'] },
    guardian1_relationship: { bsonType: ['string', 'null'] },
    guardian2_name: { bsonType: ['string', 'null'] },
    guardian2_phone: { bsonType: ['string', 'null'] },
    guardian2_email: { bsonType: ['string', 'null'] },
    guardian2_relationship: { bsonType: ['string', 'null'] },
    // parent1 / parent2 (05_add_parent_fields)
    parent1_name: { bsonType: ['string', 'null'] },
    parent1_phone: { bsonType: ['string', 'null'] },
    parent1_relationship: { bsonType: ['string', 'null'] },
    parent2_name: { bsonType: ['string', 'null'] },
    parent2_phone: { bsonType: ['string', 'null'] },
    parent2_relationship: { bsonType: ['string', 'null'] },
    profile_image: { bsonType: ['string', 'null'] },
    profile_picture: { bsonType: ['string', 'null'] },
    created_at: ts,
    updated_at: ts
  });

/* 4. teachers ----------------------------------------------------------- */
createValidated('teachers',
  ['user_id', 'teacher_id', 'first_name', 'last_name', 'gender'],
  {
    user_id: { bsonType: 'objectId' },
    teacher_id: { bsonType: 'string' },
    first_name: { bsonType: 'string' },
    last_name: { bsonType: 'string' },
    date_of_birth: { bsonType: ['date', 'null'] },
    gender: { enum: ['male', 'female', 'other'] },
    phone: { bsonType: ['string', 'null'] },
    address: { bsonType: ['string', 'null'] },
    joining_date: { bsonType: ['date', 'null'] },
    department: { bsonType: ['string', 'null'] },
    designation: { bsonType: ['string', 'null'] },
    qualification: { bsonType: ['string', 'null'] },
    specialization: { bsonType: ['string', 'null'] },
    experience_years: { bsonType: ['int', 'null'] },
    profile_image: { bsonType: ['string', 'null'] },
    created_at: ts,
    updated_at: ts
  });

/* 5. admins ------------------------------------------------------------- */
createValidated('admins',
  ['user_id', 'admin_id', 'first_name', 'last_name'],
  {
    user_id: { bsonType: 'objectId' },
    admin_id: { bsonType: 'string' },
    first_name: { bsonType: 'string' },
    last_name: { bsonType: 'string' },
    phone: { bsonType: ['string', 'null'] },
    designation: { bsonType: ['string', 'null'] },
    permissions: { bsonType: ['object', 'array', 'null'] },
    created_at: ts,
    updated_at: ts
  });

/* 6. subjects ----------------------------------------------------------- */
createValidated('subjects',
  ['subject_code', 'subject_name', 'credit_hours', 'semester'],
  {
    subject_code: { bsonType: 'string' },
    subject_name: { bsonType: 'string' },
    credit_hours: { bsonType: 'int' },
    department: { bsonType: ['string', 'null'] },
    semester: { bsonType: 'int', minimum: 1, maximum: 6 },
    description: { bsonType: ['string', 'null'] },
    is_active: { bsonType: 'bool' },
    created_at: ts,
    updated_at: ts
  });

/* 7. semesters ---------------------------------------------------------- */
createValidated('semesters',
  ['semester_number', 'semester_name', 'start_date', 'end_date', 'session_id'],
  {
    semester_number: { bsonType: 'int' },
    semester_name: { bsonType: 'string' },
    start_date: { bsonType: 'date' },
    end_date: { bsonType: 'date' },
    session_id: { bsonType: 'objectId' },
    is_active: { bsonType: 'bool' },
    created_at: ts,
    updated_at: ts
  });

/* 8. teacher_subjects --------------------------------------------------- */
createValidated('teacher_subjects',
  ['teacher_id', 'subject_id'],
  {
    teacher_id: { bsonType: 'objectId' },
    subject_id: { bsonType: 'objectId' },
    is_active: { bsonType: 'bool' },
    assigned_date: { bsonType: ['date', 'null'] },
    created_at: ts,
    updated_at: ts
  });

/* 9. marks (semester exams + enhanced ESA/ISA) -------------------------- */
createValidated('marks',
  ['student_id', 'subject_id', 'session_id', 'semester'],
  {
    student_id: { bsonType: 'objectId' },
    subject_id: { bsonType: 'objectId' },
    session_id: { bsonType: 'objectId' },
    semester: { bsonType: 'int' },
    internal_marks: { bsonType: ['double', 'int', 'null'] },
    external_marks: { bsonType: ['double', 'int', 'null'] },
    total_marks: { bsonType: ['double', 'int', 'null'] },
    grade_point: { bsonType: ['double', 'int', 'null'] },
    letter_grade: { bsonType: ['string', 'null'] },
    remarks: { bsonType: ['string', 'null'] },
    esa_marks: { bsonType: ['double', 'int', 'null'] },   // External Semester Assessment (out of 80)
    isa_marks: { bsonType: ['double', 'int', 'null'] },   // Internal Semester Assessment (out of 20)
    credit_points: { bsonType: ['double', 'int', 'null'] }, // Credit Points (Credit x GP)
    entered_by: { bsonType: ['objectId', 'null'] },
    entered_at: ts,
    updated_at: ts
  });

/* 10. exam_marks (class tests + internals) ------------------------------ */
createValidated('exam_marks',
  ['student_id', 'subject_id', 'semester', 'exam_type', 'marks_obtained', 'max_marks'],
  {
    student_id: { bsonType: 'objectId' },
    subject_id: { bsonType: 'objectId' },
    semester: { bsonType: 'int' },
    exam_type: { enum: ['class_test', 'internal_1', 'internal_2'] },
    marks_obtained: { bsonType: ['double', 'int'] },
    max_marks: { bsonType: ['double', 'int'] },
    exam_date: { bsonType: ['date', 'null'] },
    entered_by: { bsonType: ['objectId', 'null'] },
    created_at: ts,
    updated_at: ts
  });

/* 11. attendance -------------------------------------------------------- */
createValidated('attendance',
  ['student_id', 'subject_id', 'session_id', 'attendance_date', 'status', 'marked_by'],
  {
    student_id: { bsonType: 'objectId' },
    subject_id: { bsonType: 'objectId' },
    session_id: { bsonType: 'objectId' },
    attendance_date: { bsonType: 'date' },
    status: { enum: ['present', 'absent', 'late', 'excused'] },
    remarks: { bsonType: ['string', 'null'] },
    marked_by: { bsonType: 'objectId' },
    marked_at: ts
  });

/* 12. fees -------------------------------------------------------------- */
createValidated('fees',
  ['fee_type', 'fee_name', 'amount', 'session_id', 'due_date'],
  {
    fee_type: { bsonType: 'string' },
    fee_name: { bsonType: 'string' },
    amount: { bsonType: ['double', 'int'] },
    semester: { bsonType: ['int', 'null'] },
    department: { bsonType: ['string', 'null'] },
    program: { bsonType: ['string', 'null'] },
    session_id: { bsonType: 'objectId' },
    due_date: { bsonType: 'date' },
    late_fine_per_day: { bsonType: ['double', 'int'] },
    max_late_fine: { bsonType: ['double', 'int'] },
    description: { bsonType: ['string', 'null'] },
    is_active: { bsonType: 'bool' },
    created_at: ts,
    updated_at: ts
  });

/* 13. payments ---------------------------------------------------------- */
createValidated('payments',
  ['student_id', 'fee_id', 'amount_paid', 'total_amount', 'payment_date', 'payment_method', 'receipt_number'],
  {
    student_id: { bsonType: 'objectId' },
    fee_id: { bsonType: 'objectId' },
    amount_paid: { bsonType: ['double', 'int'] },
    late_fine: { bsonType: ['double', 'int'] },
    total_amount: { bsonType: ['double', 'int'] },
    payment_date: { bsonType: 'date' },
    payment_method: { enum: ['cash', 'card', 'online', 'cheque', 'other'] },
    transaction_id: { bsonType: ['string', 'null'] },
    receipt_number: { bsonType: 'string' },
    status: { enum: ['pending', 'completed', 'failed', 'refunded'] },
    remarks: { bsonType: ['string', 'null'] },
    processed_by: { bsonType: ['objectId', 'null'] },
    created_at: ts,
    updated_at: ts
  });

/* 14. study_materials --------------------------------------------------- */
createValidated('study_materials',
  ['department', 'semester', 'subject', 'material_type', 'file_name', 'file_path', 'file_url', 'file_size', 'uploaded_by'],
  {
    department: { bsonType: 'string' },
    semester: { bsonType: 'int' },
    subject: { bsonType: 'string' },
    material_type: { enum: ['notes', 'question_papers'] },
    unit: { bsonType: ['string', 'null'] },
    year: { bsonType: ['string', 'null'] },
    exam_type: { enum: ['internal_1', 'internal_2', 'semester', null] },
    description: { bsonType: ['string', 'null'] },
    file_name: { bsonType: 'string' },
    file_path: { bsonType: 'string' },
    file_url: { bsonType: 'string' },
    file_size: { bsonType: 'int' },
    uploaded_by: { bsonType: 'objectId' },
    uploaded_at: ts
  });

/* 15. notices ----------------------------------------------------------- */
createValidated('notices',
  ['title', 'content', 'created_by'],
  {
    title: { bsonType: 'string' },
    content: { bsonType: 'string' },
    category: { enum: ['general', 'academic', 'event', 'exam', 'holiday', 'sports'] },
    priority: { enum: ['low', 'normal', 'high', 'urgent'] },
    type: { enum: ['general', 'academic', 'exam', 'event', 'holiday', 'sports'] },
    target_audience: { enum: ['all', 'students', 'teachers', 'staff'] },
    department: { bsonType: ['string', 'null'] },
    semester: { bsonType: ['int', 'null'] },
    attachment_url: { bsonType: ['string', 'null'] },
    is_active: { bsonType: 'bool' },
    expiry_date: { bsonType: ['date', 'null'] },
    created_by: { bsonType: 'objectId' },
    created_at: ts,
    updated_at: ts
  });

/* 16. fee_notifications ------------------------------------------------- */
createValidated('fee_notifications',
  ['fee_id', 'title', 'message', 'sent_by'],
  {
    fee_id: { bsonType: 'objectId' },
    title: { bsonType: 'string' },
    message: { bsonType: 'string' },
    target_department: { bsonType: ['string', 'null'] },
    target_semester: { bsonType: ['int', 'null'] },
    target_program: { bsonType: ['string', 'null'] },
    sent_count: { bsonType: 'int' },
    sent_by: { bsonType: 'objectId' },
    sent_at: ts
  });

/* 17. assignments ------------------------------------------------------- */
createValidated('assignments',
  ['teacher_id', 'subject_id', 'department', 'semester', 'title', 'due_date'],
  {
    teacher_id: { bsonType: 'objectId' },
    subject_id: { bsonType: 'objectId' },
    department: { bsonType: 'string' },
    semester: { bsonType: 'int' },
    title: { bsonType: 'string' },
    description: { bsonType: ['string', 'null'] },
    file_path: { bsonType: ['string', 'null'] },
    file_name: { bsonType: ['string', 'null'] },
    due_date: { bsonType: 'date' },
    is_active: { bsonType: 'bool' },
    created_at: ts,
    updated_at: ts
  });

/* 18. assignment_submissions ------------------------------------------- */
createValidated('assignment_submissions',
  ['assignment_id', 'student_id', 'file_path', 'file_name'],
  {
    assignment_id: { bsonType: 'objectId' },
    student_id: { bsonType: 'objectId' },
    file_path: { bsonType: 'string' },
    file_name: { bsonType: 'string' },
    submitted_at: ts,
    status: { enum: ['submitted', 'accepted', 'rejected'] },
    rejection_reason: { bsonType: ['string', 'null'] },
    reviewed_at: ts,
    reviewed_by: { bsonType: ['objectId', 'null'] }
  });

print('Creating indexes...');

// users
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ status: 1 });

// sessions
db.sessions.createIndex({ session_name: 1 }, { unique: true });
db.sessions.createIndex({ is_active: 1 });
db.sessions.createIndex({ start_year: 1, end_year: 1 });

// students
db.students.createIndex({ student_id: 1 }, { unique: true });
db.students.createIndex({ user_id: 1 }, { unique: true });
db.students.createIndex({ session_id: 1 });
db.students.createIndex({ semester: 1 });
db.students.createIndex({ department: 1 });

// teachers
db.teachers.createIndex({ teacher_id: 1 }, { unique: true });
db.teachers.createIndex({ user_id: 1 }, { unique: true });
db.teachers.createIndex({ department: 1 });

// admins
db.admins.createIndex({ admin_id: 1 }, { unique: true });
db.admins.createIndex({ user_id: 1 }, { unique: true });

// subjects
db.subjects.createIndex({ subject_code: 1 }, { unique: true });
db.subjects.createIndex({ semester: 1 });
db.subjects.createIndex({ department: 1 });

// semesters
db.semesters.createIndex({ semester_number: 1, session_id: 1 }, { unique: true });
db.semesters.createIndex({ is_active: 1 });

// teacher_subjects
db.teacher_subjects.createIndex({ teacher_id: 1, subject_id: 1 }, { unique: true });
db.teacher_subjects.createIndex({ is_active: 1 });

// marks
db.marks.createIndex({ student_id: 1, subject_id: 1, session_id: 1, semester: 1 }, { unique: true });
db.marks.createIndex({ subject_id: 1 });
db.marks.createIndex({ semester: 1 });

// exam_marks
db.exam_marks.createIndex({ student_id: 1, subject_id: 1 });
db.exam_marks.createIndex({ exam_type: 1 });
db.exam_marks.createIndex({ semester: 1 });

// attendance
db.attendance.createIndex({ student_id: 1, subject_id: 1, attendance_date: 1 }, { unique: true });
db.attendance.createIndex({ attendance_date: 1 });
db.attendance.createIndex({ status: 1 });

// fees
db.fees.createIndex({ fee_type: 1 });
db.fees.createIndex({ semester: 1 });
db.fees.createIndex({ session_id: 1 });
db.fees.createIndex({ due_date: 1 });

// payments
db.payments.createIndex({ receipt_number: 1 }, { unique: true });
db.payments.createIndex({ student_id: 1 });
db.payments.createIndex({ fee_id: 1 });
db.payments.createIndex({ payment_date: 1 });
db.payments.createIndex({ status: 1 });

// study_materials
db.study_materials.createIndex({ department: 1 });
db.study_materials.createIndex({ semester: 1 });
db.study_materials.createIndex({ material_type: 1 });

// notices
db.notices.createIndex({ category: 1 });
db.notices.createIndex({ priority: 1 });
db.notices.createIndex({ target_audience: 1 });
db.notices.createIndex({ department: 1 });
db.notices.createIndex({ is_active: 1 });
db.notices.createIndex({ created_at: -1 });

// fee_notifications
db.fee_notifications.createIndex({ fee_id: 1 });
db.fee_notifications.createIndex({ sent_at: -1 });

// assignments
db.assignments.createIndex({ department: 1, semester: 1 });
db.assignments.createIndex({ due_date: 1 });
db.assignments.createIndex({ teacher_id: 1 });

// assignment_submissions
db.assignment_submissions.createIndex({ assignment_id: 1, student_id: 1 }, { unique: true });
db.assignment_submissions.createIndex({ student_id: 1 });
db.assignment_submissions.createIndex({ status: 1 });

print('Schema + indexes created successfully!');
