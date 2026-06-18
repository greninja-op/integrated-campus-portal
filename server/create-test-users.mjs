/**
 * Create 3 test accounts in Atlas (idempotent):
 *   teststudent@gmail.com / password123  (student)
 *   testteacher@gmail.com / password123  (teacher)
 *   testadmin@gmail.com   / password123  (admin)
 *
 * Run:  cd server && node create-test-users.mjs
 */
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(resolve(__dirname, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('='); if (i === -1) continue;
      const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!(k in env)) env[k] = v;
    }
  } catch { /* ignore */ }
  return env;
}

const env = loadEnv();
const URI = env.MONGODB_URI;
const DB_NAME = env.MONGODB_DB || 'studentportal';
if (!URI) { console.error('No MONGODB_URI in server/.env'); process.exit(1); }

const client = new MongoClient(URI, { serverSelectionTimeoutMS: 15000 });

async function upsertUser(db, username, email, role, hash, now) {
  await db.collection('users').updateOne(
    { email },
    { $set: { username, email, password: hash, role, status: 'active', updated_at: now }, $setOnInsert: { created_at: now } },
    { upsert: true }
  );
  return (await db.collection('users').findOne({ email }))._id;
}

try {
  await client.connect();
  const db = client.db(DB_NAME);
  const now = new Date();
  const hash = await bcrypt.hash('password123', 10);

  // Need a session for the student (validator requires session_id)
  let session = await db.collection('sessions').findOne({ is_active: true });
  if (!session) session = await db.collection('sessions').findOne({});
  if (!session) {
    const r = await db.collection('sessions').insertOne({
      session_name: '2024-2025', start_year: 2024, end_year: 2025,
      start_date: new Date('2024-07-01'), end_date: new Date('2025-06-30'),
      is_active: true, created_at: now, updated_at: now
    });
    session = { _id: r.insertedId };
  }

  // STUDENT
  const sUser = await upsertUser(db, 'teststudent', 'teststudent@gmail.com', 'student', hash, now);
  await db.collection('students').updateOne(
    { student_id: 'STUTEST001' },
    { $set: {
        user_id: sUser, student_id: 'STUTEST001', first_name: 'Test', last_name: 'Student',
        date_of_birth: new Date('2002-01-01'), gender: 'male', enrollment_date: new Date('2024-07-01'),
        department: 'BCA', semester: 1, session_id: session._id, batch_year: 2024, updated_at: now
      }, $setOnInsert: { created_at: now } },
    { upsert: true }
  );

  // TEACHER
  const tUser = await upsertUser(db, 'testteacher', 'testteacher@gmail.com', 'teacher', hash, now);
  await db.collection('teachers').updateOne(
    { teacher_id: 'EMPTEST001' },
    { $set: {
        user_id: tUser, teacher_id: 'EMPTEST001', first_name: 'Test', last_name: 'Teacher',
        date_of_birth: new Date('1985-01-01'), gender: 'male', joining_date: new Date('2024-01-01'),
        department: 'BCA', designation: 'Assistant Professor', qualification: 'M.Tech', updated_at: now
      }, $setOnInsert: { created_at: now } },
    { upsert: true }
  );

  // ADMIN
  const aUser = await upsertUser(db, 'testadmin', 'testadmin@gmail.com', 'admin', hash, now);
  await db.collection('admins').updateOne(
    { admin_id: 'ADMTEST001' },
    { $set: {
        user_id: aUser, admin_id: 'ADMTEST001', first_name: 'Test', last_name: 'Admin',
        designation: 'Administrator', updated_at: now
      }, $setOnInsert: { created_at: now } },
    { upsert: true }
  );

  console.log('Test accounts ready (all password: password123):');
  console.log('  student -> teststudent@gmail.com');
  console.log('  teacher -> testteacher@gmail.com');
  console.log('  admin   -> testadmin@gmail.com');
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
} finally {
  await client.close();
}
