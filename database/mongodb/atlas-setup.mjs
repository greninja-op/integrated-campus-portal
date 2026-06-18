/**
 * ICP MongoDB - Atlas setup & seed (Node.js + official mongodb driver)
 * --------------------------------------------------------------------
 * Use this when you don't have `mongosh` installed (e.g. to load the schema
 * and seed data into MongoDB Atlas). It mirrors schema.js + seeds/*.js.
 *
 * Reads the connection string from backend/.env:
 *   MONGODB_URI=mongodb+srv://...
 *   MONGODB_DB=studentportal
 *
 * Run:
 *   cd database/mongodb
 *   npm install
 *   npm run setup
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dns from 'node:dns';

// Some local/ISP DNS resolvers refuse the SRV lookups that mongodb+srv:// needs
// (error: "querySrv ECONNREFUSED"). Point Node's resolver at public DNS so the
// SRV/TXT records resolve. Harmless if the local resolver already works.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Minimal .env parser (reads backend/.env, falls back to process.env) ----
function loadEnv() {
  const env = { ...process.env };
  try {
    const envPath = resolve(__dirname, '../../backend/.env');
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in env)) env[key] = val;
    }
  } catch {
    // no .env file - rely on process.env
  }
  return env;
}

const env = loadEnv();
const URI = env.MONGODB_URI;
const DB_NAME = env.MONGODB_DB || 'studentportal';

if (!URI) {
  console.error('ERROR: MONGODB_URI not found. Set it in backend/.env or the environment.');
  process.exit(1);
}

const ts = { bsonType: ['date', 'null'] };

// --- Collection definitions: validators (mirrors schema.js) -----------------
const collections = {
  users: {
    required: ['username', 'password', 'email', 'role'],
    properties: {
      username: { bsonType: 'string' }, password: { bsonType: 'string' },
      email: { bsonType: 'string' }, role: { enum: ['student', 'teacher', 'admin'] },
      status: { enum: ['active', 'inactive', 'suspended'] },
      created_at: ts, updated_at: ts, last_login: ts
    },
    indexes: [
      [{ username: 1 }, { unique: true }],
      [{ email: 1 }, { unique: true }],
      [{ role: 1 }], [{ status: 1 }]
    ]
  },
  sessions: {
    required: ['session_name', 'start_year', 'end_year', 'start_date', 'end_date'],
    properties: {
      session_name: { bsonType: 'string' }, start_year: { bsonType: 'int' },
      end_year: { bsonType: 'int' }, start_date: { bsonType: 'date' },
      end_date: { bsonType: 'date' }, is_active: { bsonType: 'bool' },
      created_at: ts, updated_at: ts
    },
    indexes: [
      [{ session_name: 1 }, { unique: true }],
      [{ is_active: 1 }], [{ start_year: 1, end_year: 1 }]
    ]
  },
  students: {
    required: ['user_id', 'student_id', 'first_name', 'last_name', 'gender', 'session_id', 'semester'],
    properties: {
      user_id: { bsonType: 'objectId' }, student_id: { bsonType: 'string' },
      first_name: { bsonType: 'string' }, last_name: { bsonType: 'string' },
      gender: { enum: ['male', 'female', 'other'] },
      session_id: { bsonType: 'objectId' },
      semester: { bsonType: 'int', minimum: 1, maximum: 6 }
    },
    indexes: [
      [{ student_id: 1 }, { unique: true }],
      [{ user_id: 1 }, { unique: true }],
      [{ session_id: 1 }], [{ semester: 1 }], [{ department: 1 }]
    ]
  },
  teachers: {
    required: ['user_id', 'teacher_id', 'first_name', 'last_name', 'gender'],
    properties: {
      user_id: { bsonType: 'objectId' }, teacher_id: { bsonType: 'string' },
      first_name: { bsonType: 'string' }, last_name: { bsonType: 'string' },
      gender: { enum: ['male', 'female', 'other'] }
    },
    indexes: [
      [{ teacher_id: 1 }, { unique: true }],
      [{ user_id: 1 }, { unique: true }],
      [{ department: 1 }]
    ]
  },
  admins: {
    required: ['user_id', 'admin_id', 'first_name', 'last_name'],
    properties: {
      user_id: { bsonType: 'objectId' }, admin_id: { bsonType: 'string' },
      first_name: { bsonType: 'string' }, last_name: { bsonType: 'string' }
    },
    indexes: [
      [{ admin_id: 1 }, { unique: true }],
      [{ user_id: 1 }, { unique: true }]
    ]
  },
  subjects: {
    required: ['subject_code', 'subject_name', 'credit_hours', 'semester'],
    properties: {
      subject_code: { bsonType: 'string' }, subject_name: { bsonType: 'string' },
      credit_hours: { bsonType: 'int' },
      semester: { bsonType: 'int', minimum: 1, maximum: 6 },
      is_active: { bsonType: 'bool' }
    },
    indexes: [
      [{ subject_code: 1 }, { unique: true }],
      [{ semester: 1 }], [{ department: 1 }]
    ]
  },
  semesters: {
    required: ['semester_number', 'semester_name', 'start_date', 'end_date', 'session_id'],
    properties: {
      semester_number: { bsonType: 'int' }, semester_name: { bsonType: 'string' },
      start_date: { bsonType: 'date' }, end_date: { bsonType: 'date' },
      session_id: { bsonType: 'objectId' }, is_active: { bsonType: 'bool' }
    },
    indexes: [
      [{ semester_number: 1, session_id: 1 }, { unique: true }],
      [{ is_active: 1 }]
    ]
  },
  teacher_subjects: {
    required: ['teacher_id', 'subject_id'],
    properties: {
      teacher_id: { bsonType: 'objectId' }, subject_id: { bsonType: 'objectId' },
      is_active: { bsonType: 'bool' }, assigned_date: { bsonType: ['date', 'null'] }
    },
    indexes: [
      [{ teacher_id: 1, subject_id: 1 }, { unique: true }],
      [{ is_active: 1 }]
    ]
  },
  marks: {
    required: ['student_id', 'subject_id', 'session_id', 'semester'],
    properties: {
      student_id: { bsonType: 'objectId' }, subject_id: { bsonType: 'objectId' },
      session_id: { bsonType: 'objectId' }, semester: { bsonType: 'int' }
    },
    indexes: [
      [{ student_id: 1, subject_id: 1, session_id: 1, semester: 1 }, { unique: true }],
      [{ subject_id: 1 }], [{ semester: 1 }]
    ]
  },
  exam_marks: {
    required: ['student_id', 'subject_id', 'semester', 'exam_type', 'marks_obtained', 'max_marks'],
    properties: {
      student_id: { bsonType: 'objectId' }, subject_id: { bsonType: 'objectId' },
      semester: { bsonType: 'int' },
      exam_type: { enum: ['class_test', 'internal_1', 'internal_2'] },
      marks_obtained: { bsonType: ['double', 'int'] }, max_marks: { bsonType: ['double', 'int'] }
    },
    indexes: [
      [{ student_id: 1, subject_id: 1 }], [{ exam_type: 1 }], [{ semester: 1 }]
    ]
  },
  attendance: {
    required: ['student_id', 'subject_id', 'session_id', 'attendance_date', 'status', 'marked_by'],
    properties: {
      student_id: { bsonType: 'objectId' }, subject_id: { bsonType: 'objectId' },
      session_id: { bsonType: 'objectId' }, attendance_date: { bsonType: 'date' },
      status: { enum: ['present', 'absent', 'late', 'excused'] },
      marked_by: { bsonType: 'objectId' }
    },
    indexes: [
      [{ student_id: 1, subject_id: 1, attendance_date: 1 }, { unique: true }],
      [{ attendance_date: 1 }], [{ status: 1 }]
    ]
  },
  fees: {
    required: ['fee_type', 'fee_name', 'amount', 'session_id', 'due_date'],
    properties: {
      fee_type: { bsonType: 'string' }, fee_name: { bsonType: 'string' },
      amount: { bsonType: ['double', 'int'] }, session_id: { bsonType: 'objectId' },
      due_date: { bsonType: 'date' }, is_active: { bsonType: 'bool' }
    },
    indexes: [
      [{ fee_type: 1 }], [{ semester: 1 }], [{ session_id: 1 }], [{ due_date: 1 }]
    ]
  },
  payments: {
    required: ['student_id', 'fee_id', 'amount_paid', 'total_amount', 'payment_date', 'payment_method', 'receipt_number'],
    properties: {
      student_id: { bsonType: 'objectId' }, fee_id: { bsonType: 'objectId' },
      amount_paid: { bsonType: ['double', 'int'] }, total_amount: { bsonType: ['double', 'int'] },
      payment_date: { bsonType: 'date' },
      payment_method: { enum: ['cash', 'card', 'online', 'cheque', 'other'] },
      receipt_number: { bsonType: 'string' },
      status: { enum: ['pending', 'completed', 'failed', 'refunded'] }
    },
    indexes: [
      [{ receipt_number: 1 }, { unique: true }],
      [{ student_id: 1 }], [{ fee_id: 1 }], [{ payment_date: 1 }], [{ status: 1 }]
    ]
  },
  study_materials: {
    required: ['department', 'semester', 'subject', 'material_type', 'file_name', 'file_path', 'file_url', 'file_size', 'uploaded_by'],
    properties: {
      department: { bsonType: 'string' }, semester: { bsonType: 'int' },
      subject: { bsonType: 'string' },
      material_type: { enum: ['notes', 'question_papers'] },
      exam_type: { enum: ['internal_1', 'internal_2', 'semester', null] },
      file_name: { bsonType: 'string' }, file_path: { bsonType: 'string' },
      file_url: { bsonType: 'string' }, file_size: { bsonType: 'int' },
      uploaded_by: { bsonType: 'objectId' }
    },
    indexes: [
      [{ department: 1 }], [{ semester: 1 }], [{ material_type: 1 }]
    ]
  },
  notices: {
    required: ['title', 'content', 'created_by'],
    properties: {
      title: { bsonType: 'string' }, content: { bsonType: 'string' },
      category: { enum: ['general', 'academic', 'event', 'exam', 'holiday', 'sports'] },
      priority: { enum: ['low', 'normal', 'high', 'urgent'] },
      type: { enum: ['general', 'academic', 'exam', 'event', 'holiday', 'sports'] },
      target_audience: { enum: ['all', 'students', 'teachers', 'staff'] },
      is_active: { bsonType: 'bool' }, created_by: { bsonType: 'objectId' }
    },
    indexes: [
      [{ category: 1 }], [{ priority: 1 }], [{ target_audience: 1 }],
      [{ department: 1 }], [{ is_active: 1 }], [{ created_at: -1 }]
    ]
  },
  fee_notifications: {
    required: ['fee_id', 'title', 'message', 'sent_by'],
    properties: {
      fee_id: { bsonType: 'objectId' }, title: { bsonType: 'string' },
      message: { bsonType: 'string' }, sent_by: { bsonType: 'objectId' }
    },
    indexes: [
      [{ fee_id: 1 }], [{ sent_at: -1 }]
    ]
  },
  assignments: {
    required: ['teacher_id', 'subject_id', 'department', 'semester', 'title', 'due_date'],
    properties: {
      teacher_id: { bsonType: 'objectId' }, subject_id: { bsonType: 'objectId' },
      department: { bsonType: 'string' }, semester: { bsonType: 'int' },
      title: { bsonType: 'string' }, due_date: { bsonType: 'date' },
      is_active: { bsonType: 'bool' }
    },
    indexes: [
      [{ department: 1, semester: 1 }], [{ due_date: 1 }], [{ teacher_id: 1 }]
    ]
  },
  assignment_submissions: {
    required: ['assignment_id', 'student_id', 'file_path', 'file_name'],
    properties: {
      assignment_id: { bsonType: 'objectId' }, student_id: { bsonType: 'objectId' },
      file_path: { bsonType: 'string' }, file_name: { bsonType: 'string' },
      status: { enum: ['submitted', 'accepted', 'rejected'] }
    },
    indexes: [
      [{ assignment_id: 1, student_id: 1 }, { unique: true }],
      [{ student_id: 1 }], [{ status: 1 }]
    ]
  }
};

// --- Seed data --------------------------------------------------------------
const PW = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // password123
const ADMIN_PW = '$2y$10$du.0smOc08Tu6Bld/2V3A.6iytE/Jcg4KqWt3fk9GHy7gjbSAu5LK'; // admin123

const seedSessions = [
  { session_name: '2024-2025', start_year: 2024, end_year: 2025, start_date: new Date('2024-07-01'), end_date: new Date('2025-06-30'), is_active: true },
  { session_name: '2023-2024', start_year: 2023, end_year: 2024, start_date: new Date('2023-08-01'), end_date: new Date('2024-05-31'), is_active: false },
  { session_name: '2022-2023', start_year: 2022, end_year: 2023, start_date: new Date('2022-07-01'), end_date: new Date('2023-06-30'), is_active: false }
];

const deptDefs = [
  { key: 'bca', idDept: 'BCA', dept: 'BCA', label: 'BCA' },
  { key: 'bba', idDept: 'BBA', dept: 'BBA', label: 'BBA' },
  { key: 'bcom', idDept: 'BCOM', dept: 'B.Com', label: 'BCom' }
];
const teacherProfiles = {
  bca: [['Assistant Professor', 'PhD'], ['Assistant Professor', 'PhD'], ['Associate Professor', 'PhD'], ['Assistant Professor', 'M.Tech'], ['Professor', 'PhD']],
  bba: [['Assistant Professor', 'PhD'], ['Assistant Professor', 'MBA'], ['Associate Professor', 'PhD'], ['Assistant Professor', 'MBA'], ['Professor', 'PhD']],
  bcom: [['Assistant Professor', 'PhD'], ['Assistant Professor', 'M.Com'], ['Associate Professor', 'PhD'], ['Assistant Professor', 'M.Com'], ['Professor', 'PhD']]
};

// [code, name, credits, department, semester]
const seedSubjects = [
  ['BCA101','English Paper 1',4,'BCA',1],['BCA102','Computer Fundamentals and Digital Principles',4,'BCA',1],['BCA103','Basic Statistics and Introductory Probability Theory',4,'BCA',1],['BCA104','Mathematics Discrete Mathematics I',4,'BCA',1],['BCA105','Methodology of Programming and C Language',4,'BCA',1],['BCA106','Software Lab I',2,'BCA',1],
  ['BCA201','English Paper 2',4,'BCA',2],['BCA202','Database Management Systems',4,'BCA',2],['BCA203','Computer Organization and Architecture',4,'BCA',2],['BCA204','Object Oriented Programming Using C++',4,'BCA',2],['BCA205','Mathematics Discrete Mathematics II',4,'BCA',2],['BCA206','Software Lab II',2,'BCA',2],
  ['BCA301','Computer Graphics',4,'BCA',3],['BCA302','Microprocessor and PC Hardware',4,'BCA',3],['BCA303','Operating Systems',4,'BCA',3],['BCA304','Advanced Statistical Methods',4,'BCA',3],['BCA305','Data Structure Using C++',4,'BCA',3],['BCA306','Software Lab III',2,'BCA',3],
  ['BCA401','System Analysis and Software Engineering',4,'BCA',4],['BCA402','Design and Analysis of Algorithms',4,'BCA',4],['BCA403','Linux Administration',4,'BCA',4],['BCA404','Web Programming Using PHP',4,'BCA',4],['BCA405','Operation Research',4,'BCA',4],['BCA406','Software Lab IV',2,'BCA',4],
  ['BCA501','Computer Networks',4,'BCA',5],['BCA502','IT and Environment',4,'BCA',5],['BCA503','Java Programming Using Linux',4,'BCA',5],['BCA504','Open Course',4,'BCA',5],['BCA505','Mini Project',4,'BCA',5],['BCA506','Software Lab V',2,'BCA',5],
  ['BCA601','Cloud Computing',4,'BCA',6],['BCA602','Data Mining',4,'BCA',6],['BCA603','Mobile Application Development Android',4,'BCA',6],['BCA604','Main Project',6,'BCA',6],['BCA605','Course Viva',2,'BCA',6],['BCA606','Software Lab VI',2,'BCA',6],
  ['BBA101','Business Accounting',4,'BBA',1],['BBA102','Fundamentals of Business Mathematics',4,'BBA',1],['BBA103','Principles and Methodology of Management',4,'BBA',1],['BBA104','Fundamentals of Business Statistics',4,'BBA',1],['BBA105','Global Business Environment',4,'BBA',1],
  ['BBA201','Business Communication',4,'BBA',2],['BBA202','Cost and Management Accounting',4,'BBA',2],['BBA203','Mathematics for Management',4,'BBA',2],['BBA204','Statistics for Management',4,'BBA',2],['BBA205','English - Issues That Matter',4,'BBA',2],
  ['BBA301','Business Laws',4,'BBA',3],['BBA302','Human Resource Management',4,'BBA',3],['BBA303','Marketing Management',4,'BBA',3],['BBA304','Research Methodology',4,'BBA',3],['BBA305','Corporate Accounting',4,'BBA',3],
  ['BBA401','Basic Informatics for Management',4,'BBA',4],['BBA402','Corporate Law',4,'BBA',4],['BBA403','Financial Management',4,'BBA',4],['BBA404','Managerial Economics',4,'BBA',4],['BBA405','Entrepreneurship',4,'BBA',4],['BBA406','English - Evolution of the Philosophy of Science',4,'BBA',4],
  ['BBA501','Industrial Relations',4,'BBA',5],['BBA502','Intellectual Property Rights and Industrial Laws',4,'BBA',5],['BBA503','Operations Management',4,'BBA',5],['BBA504','Environment Science and Human Rights',4,'BBA',5],['BBA505','Capital Market and Investment Management',4,'BBA',5],['BBA506','Organisational Behaviour',4,'BBA',5],
  ['BBA601','Advertising and Salesmanship',4,'BBA',6],['BBA602','Communication Skills and Personality Development',4,'BBA',6],['BBA603','Investment and Insurance Management',4,'BBA',6],['BBA604','Strategic Management',4,'BBA',6],['BBA605','Banking and Insurance Management',4,'BBA',6],['BBA606','Income Tax Theory, Law, and Practice',4,'BBA',6],['BBA607','Production Management',4,'BBA',6],
  ['BCOM101','Corporate Regulations and Administration',4,'B.Com',1],['BCOM102','Dimensions and Methodology of Business Studies',4,'B.Com',1],['BCOM103','Financial Accounting 1',4,'B.Com',1],['BCOM104','Banking and Insurance',4,'B.Com',1],['BCOM105','English - Communication Skills',4,'B.Com',1],
  ['BCOM201','Business Management',4,'B.Com',2],['BCOM202','Business Regulatory Framework',4,'B.Com',2],['BCOM203','Financial Accounting 2',4,'B.Com',2],['BCOM204','Principles of Business Decisions',4,'B.Com',2],['BCOM205','Quantitative Techniques for Business Research',4,'B.Com',2],['BCOM206','English - Issues That Matter',4,'B.Com',2],
  ['BCOM301','Corporate Accounting 1',4,'B.Com',3],['BCOM302','Financial Markets and Operations',4,'B.Com',3],['BCOM303','Marketing Management',4,'B.Com',3],['BCOM304','Quantitative Techniques for Business 1',4,'B.Com',3],['BCOM305','Goods and Services Tax',4,'B.Com',3],['BCOM306','English - Literature and Identity',4,'B.Com',3],
  ['BCOM401','Corporate Accounting 2',4,'B.Com',4],['BCOM402','Entrepreneurship Development and Project Management',4,'B.Com',4],['BCOM403','Financial Services',4,'B.Com',4],['BCOM404','Quantitative Techniques for Business 2',4,'B.Com',4],['BCOM405','Information Technology for Office',4,'B.Com',4],['BCOM406','English - Illuminations',4,'B.Com',4],
  ['BCOM501','Cost Accounting 1',4,'B.Com',5],['BCOM502','Brand Management',4,'B.Com',5],['BCOM503','Computer Fundamentals, Internet, and MS Office',4,'B.Com',5],['BCOM504','E-Commerce',4,'B.Com',5],['BCOM505','Environment Management and Human Rights',4,'B.Com',5],['BCOM506','Programming in C Theory',4,'B.Com',5],
  ['BCOM601','Cost Accounting 2',4,'B.Com',6],['BCOM602','Management Accounting',4,'B.Com',6],['BCOM603','Advertisement and Sales Management',4,'B.Com',6],['BCOM604','Auditing and Assurance',4,'B.Com',6],['BCOM605','Income Tax 2',4,'B.Com',6],['BCOM606','International Marketing',4,'B.Com',6]
];

async function main() {
  const safeUri = URI.replace(/:\/\/([^:]+):[^@]+@/, '://$1:****@');
  console.log('Connecting to MongoDB Atlas: ' + safeUri);
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 15000 });

  try {
    await client.connect();
    await client.db(DB_NAME).command({ ping: 1 });
    console.log('Connected. Using database: ' + DB_NAME);
    const db = client.db(DB_NAME);

    // 1. Create collections + validators + indexes
    const existing = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
    for (const [name, def] of Object.entries(collections)) {
      const validator = { $jsonSchema: { bsonType: 'object', required: def.required, properties: def.properties } };
      if (existing.includes(name)) {
        await db.command({ collMod: name, validator, validationLevel: 'moderate', validationAction: 'warn' });
      } else {
        await db.createCollection(name, { validator, validationLevel: 'moderate', validationAction: 'warn' });
      }
      for (const [keys, opts] of def.indexes) {
        await db.collection(name).createIndex(keys, opts || {});
      }
      console.log('  collection ready: ' + name);
    }

    const now = new Date();

    // 2. Seed sessions
    for (const s of seedSessions) {
      await db.collection('sessions').updateOne(
        { session_name: s.session_name },
        { $set: { ...s, updated_at: now }, $setOnInsert: { created_at: now } },
        { upsert: true }
      );
    }
    const session2324 = await db.collection('sessions').findOne({ session_name: '2023-2024' });

    // 3. Seed super admin (admin / admin123)
    await db.collection('users').updateOne(
      { username: 'admin' },
      { $set: { username: 'admin', password: ADMIN_PW, email: 'admin@studentportal.edu', role: 'admin', status: 'active', updated_at: now }, $setOnInsert: { created_at: now } },
      { upsert: true }
    );
    const superAdmin = await db.collection('users').findOne({ username: 'admin' });
    await db.collection('admins').updateOne(
      { admin_id: 'ADM2024001' },
      { $set: { user_id: superAdmin._id, admin_id: 'ADM2024001', first_name: 'System', last_name: 'Administrator', phone: '1234567890', designation: 'Super Admin', updated_at: now }, $setOnInsert: { created_at: now } },
      { upsert: true }
    );

    // 4. Seed populate_users: admin@college.com + 15 teachers + 15 students
    async function upsertUser(username, email, role) {
      await db.collection('users').updateOne(
        { email },
        { $set: { username, email, password: PW, role, status: 'active', updated_at: now }, $setOnInsert: { created_at: now } },
        { upsert: true }
      );
      return (await db.collection('users').findOne({ email }))._id;
    }

    const adminUserId = await upsertUser('Admin User', 'admin@college.com', 'admin');
    await db.collection('admins').updateOne(
      { admin_id: 'ADM001' },
      { $set: { user_id: adminUserId, admin_id: 'ADM001', first_name: 'Admin', last_name: 'User', designation: 'System Administrator', updated_at: now }, $setOnInsert: { created_at: now } },
      { upsert: true }
    );

    for (const d of deptDefs) {
      for (let n = 1; n <= 5; n++) {
        const tEmail = `teacher${n}.${d.key}@college.com`;
        const tUserId = await upsertUser(`${d.label} Teacher ${n}`, tEmail, 'teacher');
        const profile = teacherProfiles[d.key][n - 1];
        const teacherId = 'EMP' + d.idDept + String(n).padStart(3, '0');
        await db.collection('teachers').updateOne(
          { teacher_id: teacherId },
          { $set: { user_id: tUserId, teacher_id: teacherId, first_name: `${d.label} Teacher`, last_name: String(n), date_of_birth: new Date('1980-01-01'), gender: (n % 2 === 0) ? 'female' : 'male', joining_date: new Date('2020-01-01'), department: d.dept, designation: profile[0], qualification: profile[1], updated_at: now }, $setOnInsert: { created_at: now } },
          { upsert: true }
        );

        const sEmail = `student${n}.${d.key}@college.com`;
        const sUserId = await upsertUser(`${d.label} Student ${n}`, sEmail, 'student');
        const studentId = 'STU' + d.idDept + String(n).padStart(3, '0');
        await db.collection('students').updateOne(
          { student_id: studentId },
          { $set: { user_id: sUserId, student_id: studentId, first_name: `${d.label} Student`, last_name: String(n), date_of_birth: new Date('2000-01-01'), gender: (n % 2 === 0) ? 'female' : 'male', enrollment_date: new Date('2023-08-01'), department: d.dept, semester: 1, session_id: session2324._id, batch_year: 2023, updated_at: now }, $setOnInsert: { created_at: now } },
          { upsert: true }
        );
      }
    }

    // 5. Seed subjects
    for (const [code, sname, credits, dept, sem] of seedSubjects) {
      await db.collection('subjects').updateOne(
        { subject_code: code },
        { $set: { subject_code: code, subject_name: sname, credit_hours: credits, department: dept, semester: sem, is_active: true, updated_at: now }, $setOnInsert: { created_at: now } },
        { upsert: true }
      );
    }

    // Summary
    console.log('\n=== Seed summary ===');
    for (const c of ['sessions', 'users', 'admins', 'teachers', 'students', 'subjects']) {
      console.log(`  ${c}: ${await db.collection(c).countDocuments()}`);
    }
    console.log('\nDone. Atlas database "' + DB_NAME + '" is set up.');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('\nSETUP FAILED:', err.message);
  if (/IP|whitelist|timed out|ETIMEDOUT|ENOTFOUND|querySrv/i.test(err.message)) {
    console.error('\nHint: In MongoDB Atlas, add your current IP under "Network Access" > IP Access List');
    console.error('(or 0.0.0.0/0 for development), and confirm the username/password are correct.');
  }
  process.exit(1);
});
