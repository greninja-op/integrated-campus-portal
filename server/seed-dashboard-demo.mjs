/**
 * Seed demo dashboard data for a single student (default: teststudent@gmail.com).
 * Inserts real records the dashboard reads from MongoDB: attendance, exam_marks,
 * and fees (one paid, one pending). Idempotent — safe to re-run (it clears this
 * student's previously-seeded rows first). Does NOT touch other students.
 *
 *   node seed-dashboard-demo.mjs [studentEmail]
 */
import { MongoClient } from 'mongodb';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(resolve(__dirname, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('='); if (i === -1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!(k in env)) env[k] = v;
    }
  } catch { /* ignore */ }
  return env;
}

const env = loadEnv();
const URI = env.MONGODB_URI;
const DB_NAME = env.MONGODB_DB || 'studentportal';
const EMAIL = process.argv[2] || 'teststudent@gmail.com';
if (!URI) { console.error('MONGODB_URI missing in server/.env'); process.exit(1); }

const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;

async function main() {
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db(DB_NAME);

  const user = await db.collection('users').findOne({ email: EMAIL });
  if (!user) throw new Error(`No user with email ${EMAIL}`);
  const student = await db.collection('students').findOne({ user_id: user._id });
  if (!student) throw new Error(`No student profile for ${EMAIL}`);

  let { department, semester } = student;
  semester = semester || 1;

  // Find subjects for the student's department + semester; fall back gracefully.
  let subjects = await db.collection('subjects').find({ department, semester }).toArray();
  if (subjects.length === 0) subjects = await db.collection('subjects').find({ department }).limit(5).toArray();
  if (subjects.length === 0) subjects = await db.collection('subjects').find({}).limit(5).toArray();
  if (subjects.length === 0) throw new Error('No subjects found to attach data to.');
  subjects = subjects.slice(0, 6);
  console.log(`Student ${student.student_id} (${department}, sem ${semester}) -> ${subjects.length} subjects`);

  // ---- Clear this student's previously seeded rows (idempotent) ----
  await db.collection('attendance').deleteMany({ student_id: student._id });
  await db.collection('exam_marks').deleteMany({ student_id: student._id });
  await db.collection('payments').deleteMany({ student_id: student._id });

  const now = new Date();

  // ---- Attendance: ~24 classes/subject over the last ~8 weeks, ~86% present ----
  const attendance = [];
  for (const subj of subjects) {
    for (let i = 0; i < 24; i++) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i * 2); // every couple of days back
      const roll = Math.random();
      const status = roll < 0.82 ? 'present' : roll < 0.90 ? 'late' : roll < 0.97 ? 'absent' : 'excused';
      attendance.push({
        student_id: student._id, subject_id: subj._id, attendance_date: d,
        status, remarks: '', created_at: now,
      });
    }
  }
  await db.collection('attendance').insertMany(attendance);

  // ---- Exam marks: class_test (/20), internal_1 (/50), internal_2 (/50) ----
  const examTypes = [['class_test', 20], ['internal_1', 50], ['internal_2', 50]];
  const examMarks = [];
  for (const subj of subjects) {
    for (const [exam_type, max] of examTypes) {
      const obtained = Math.round(max * (randInt(68, 94) / 100));
      examMarks.push({
        student_id: student._id, subject_id: subj._id, semester,
        exam_type, marks_obtained: obtained, max_marks: max, created_at: now,
      });
    }
  }
  await db.collection('exam_marks').insertMany(examMarks);

  // ---- Fees: ensure two exist for dept+sem; mark one paid, leave one pending ----
  const feeDefs = [
    { fee_name: 'Semester Tuition Fee', fee_type: 'tuition', amount: 28500, paid: true },
    { fee_name: 'Examination Fee', fee_type: 'exam', amount: 2200, paid: false },
  ];
  const dueNormal = new Date(now); dueNormal.setUTCDate(dueNormal.getUTCDate() + 21);
  const feeIds = {};
  for (const f of feeDefs) {
    await db.collection('fees').updateOne(
      { fee_name: f.fee_name, department, semester },
      {
        $set: {
          fee_name: f.fee_name, fee_type: f.fee_type, amount: f.amount,
          department, semester, is_active: true, due_date: dueNormal,
          fee_details: { lastDateNormal: dueNormal.toISOString().slice(0, 10) }, updated_at: now,
        },
        $setOnInsert: { created_at: now },
      },
      { upsert: true }
    );
    const fee = await db.collection('fees').findOne({ fee_name: f.fee_name, department, semester });
    feeIds[f.fee_name] = fee._id;
  }
  // Pay the tuition fee (completed payment) so the dashboard shows exactly one "due".
  await db.collection('payments').insertOne({
    student_id: student._id, fee_id: feeIds['Semester Tuition Fee'],
    amount: 28500, status: 'completed', payment_method: 'card',
    transaction_id: 'DEMO-' + Date.now(), paid_at: now, created_at: now,
  });

  console.log(`Inserted: ${attendance.length} attendance, ${examMarks.length} exam marks, 2 fees (1 paid / 1 pending).`);
  await client.close();
}

main().then(() => { console.log('Done.'); process.exit(0); })
  .catch((e) => { console.error('Seed failed:', e.message); process.exit(1); });
