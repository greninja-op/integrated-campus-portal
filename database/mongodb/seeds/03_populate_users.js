/**
 * Seed: Test users (admin + 15 teachers + 15 students across 3 departments)
 * Converted from database/seeds/populate_users.sql
 *
 * Password for ALL users: password123
 * (bcrypt hash carried over verbatim from the original SQL seed)
 *
 * Run AFTER schema.js and 01_sessions.js.
 */

db = db.getSiblingDB('studentportal');

const now = new Date();
const PW = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // password123

// Ensure the 2023-2024 session exists and grab its _id (replaces @session_id)
db.sessions.updateOne(
  { session_name: '2023-2024' },
  {
    $set: {
      session_name: '2023-2024',
      start_year: 2023,
      end_year: 2024,
      start_date: new Date('2023-08-01'),
      end_date: new Date('2024-05-31'),
      is_active: true,
      updated_at: now
    },
    $setOnInsert: { created_at: now }
  },
  { upsert: true }
);
const sessionId = db.sessions.findOne({ session_name: '2023-2024' })._id;

// Helper: create (or update) a user and return its _id
function upsertUser(username, email, role) {
  db.users.updateOne(
    { email: email },
    {
      $set: { username: username, email: email, password: PW, role: role, status: 'active', updated_at: now },
      $setOnInsert: { created_at: now }
    },
    { upsert: true }
  );
  return db.users.findOne({ email: email })._id;
}

/* ---- Admin User -------------------------------------------------------- */
const adminUserId = upsertUser('Admin User', 'admin@college.com', 'admin');
db.admins.updateOne(
  { admin_id: 'ADM001' },
  {
    $set: {
      user_id: adminUserId, admin_id: 'ADM001',
      first_name: 'Admin', last_name: 'User',
      designation: 'System Administrator', updated_at: now
    },
    $setOnInsert: { created_at: now }
  },
  { upsert: true }
);

/* ---- Department definitions ------------------------------------------- */
// idDept = code used in teacher_id/student_id ; dept = stored department value
const departments = [
  { key: 'bca',  idDept: 'BCA',  dept: 'BCA' },
  { key: 'bba',  idDept: 'BBA',  dept: 'BBA' },
  { key: 'bcom', idDept: 'BCOM', dept: 'B.Com' }
];

// Per-department teacher designation/qualification (matches populate_users.sql)
const teacherProfiles = {
  bca:  [['Assistant Professor', 'PhD'], ['Assistant Professor', 'PhD'], ['Associate Professor', 'PhD'], ['Assistant Professor', 'M.Tech'], ['Professor', 'PhD']],
  bba:  [['Assistant Professor', 'PhD'], ['Assistant Professor', 'MBA'], ['Associate Professor', 'PhD'], ['Assistant Professor', 'MBA'], ['Professor', 'PhD']],
  bcom: [['Assistant Professor', 'PhD'], ['Assistant Professor', 'M.Com'], ['Associate Professor', 'PhD'], ['Assistant Professor', 'M.Com'], ['Professor', 'PhD']]
};

const deptLabel = { bca: 'BCA', bba: 'BBA', bcom: 'BCom' };

departments.forEach((d) => {
  for (let n = 1; n <= 5; n++) {
    /* Teachers */
    const tEmail = 'teacher' + n + '.' + d.key + '@college.com';
    const tUserId = upsertUser(deptLabel[d.key] + ' Teacher ' + n, tEmail, 'teacher');
    const profile = teacherProfiles[d.key][n - 1];
    const teacherId = 'EMP' + d.idDept + String(n).padStart(3, '0');
    db.teachers.updateOne(
      { teacher_id: teacherId },
      {
        $set: {
          user_id: tUserId, teacher_id: teacherId,
          first_name: deptLabel[d.key] + ' Teacher', last_name: String(n),
          date_of_birth: new Date('1980-01-01'),
          gender: (n % 2 === 0) ? 'female' : 'male',
          joining_date: new Date('2020-01-01'),
          department: d.dept, designation: profile[0], qualification: profile[1],
          updated_at: now
        },
        $setOnInsert: { created_at: now }
      },
      { upsert: true }
    );

    /* Students */
    const sEmail = 'student' + n + '.' + d.key + '@college.com';
    const sUserId = upsertUser(deptLabel[d.key] + ' Student ' + n, sEmail, 'student');
    const studentId = 'STU' + d.idDept + String(n).padStart(3, '0');
    db.students.updateOne(
      { student_id: studentId },
      {
        $set: {
          user_id: sUserId, student_id: studentId,
          first_name: deptLabel[d.key] + ' Student', last_name: String(n),
          date_of_birth: new Date('2000-01-01'),
          gender: (n % 2 === 0) ? 'female' : 'male',
          enrollment_date: new Date('2023-08-01'),
          department: d.dept, semester: 1, session_id: sessionId, batch_year: 2023,
          updated_at: now
        },
        $setOnInsert: { created_at: now }
      },
      { upsert: true }
    );
  }
});

print('Seeded users: ' + db.users.countDocuments() +
      ', teachers: ' + db.teachers.countDocuments() +
      ', students: ' + db.students.countDocuments());
