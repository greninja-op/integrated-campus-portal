/**
 * ICP Node/Express + MongoDB backend
 * -----------------------------------
 * Drop-in replacement for the PHP backend, serving the same /api/*.php routes
 * the React frontend calls, backed by MongoDB Atlas.
 *
 * Reads MONGODB_URI / MONGODB_DB / JWT_SECRET from backend/.env.
 * Start:  cd server && npm install && npm start
 */

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dns from 'node:dns';

// Public DNS so mongodb+srv:// SRV lookups work on networks that refuse them.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- env -------------------------------------------------------------------
function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(resolve(__dirname, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
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
const JWT_SECRET = env.JWT_SECRET || 'dev_jwt_secret_change_me';
const PORT = Number(env.PORT || 8080);

if (!URI) {
  console.error('ERROR: MONGODB_URI missing in backend/.env');
  process.exit(1);
}

// --- db --------------------------------------------------------------------
const client = new MongoClient(URI, { serverSelectionTimeoutMS: 15000 });
let db;

// --- helpers ---------------------------------------------------------------
const ok = (res, data = {}, message = 'OK') => res.json({ success: true, message, data });
const fail = (res, code, message, error = 'error') => res.status(code).json({ success: false, error, message });

function signToken(user) {
  return jwt.sign({ user_id: String(user._id), username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
}

function getToken(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/Bearer\s+(.+)/i);
  return m ? m[1] : (req.query.token || null);
}

function auth(req, res, next) {
  const token = getToken(req);
  if (!token) return fail(res, 401, 'Please login to continue', 'unauthorized');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return fail(res, 401, 'Invalid or expired token', 'unauthorized');
  }
}

// Build the user object the frontend expects (profile merged in)
async function buildUserPayload(user) {
  const base = { id: String(user._id), username: user.username, email: user.email, role: user.role, status: user.status };
  let profile = {};
  if (user.role === 'student') {
    profile = await db.collection('students').findOne({ user_id: user._id }) || {};
  } else if (user.role === 'teacher') {
    profile = await db.collection('teachers').findOne({ user_id: user._id }) || {};
  } else if (user.role === 'admin') {
    profile = await db.collection('admins').findOne({ user_id: user._id }) || {};
  }
  const merged = { ...base };
  for (const k of ['student_id', 'teacher_id', 'admin_id', 'first_name', 'last_name', 'department', 'semester', 'designation', 'profile_image']) {
    if (profile[k] !== undefined) merged[k] = profile[k];
  }
  if (merged.first_name || merged.last_name) merged.full_name = `${merged.first_name || ''} ${merged.last_name || ''}`.trim();
  return merged;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });

const api = express.Router();

// ===== AUTH =================================================================
api.post('/auth/login.php', async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) return fail(res, 400, 'Username and password are required', 'validation_error');

  const user = await db.collection('users').findOne({ $or: [{ username }, { email: username }] });
  if (!user) return fail(res, 401, 'Invalid username or password', 'invalid_credentials');

  const match = await bcrypt.compare(password, user.password);
  if (!match) return fail(res, 401, 'Invalid username or password', 'invalid_credentials');

  const norm = (r) => (r === 'staff' ? 'teacher' : r);
  if (role && norm(role) !== norm(user.role)) {
    return fail(res, 403, `You are trying to login as ${role} but your account is ${user.role}.`, 'role_mismatch');
  }
  if (user.status && user.status !== 'active') return fail(res, 403, 'Your account is inactive.', 'account_inactive');

  await db.collection('users').updateOne({ _id: user._id }, { $set: { last_login: new Date() } });
  const payload = await buildUserPayload(user);
  return res.json({ success: true, message: 'Login successful', data: { user: payload, token: signToken(user) } });
});

api.get('/auth/verify.php', auth, async (req, res) => {
  return res.json({ success: true, data: { user_id: req.user.user_id, username: req.user.username, role: req.user.role } });
});

api.post('/auth/logout.php', (_req, res) => res.json({ success: true, message: 'Logged out' }));

// ===== helpers for listing ==================================================
function toInt(v, d) { const n = parseInt(v, 10); return Number.isNaN(n) ? d : n; }

async function mergeStudentUser(s) {
  const u = await db.collection('users').findOne({ _id: s.user_id });
  return { ...s, id: String(s._id), _id: String(s._id), email: u?.email, username: u?.username,
           full_name: `${s.first_name || ''} ${s.last_name || ''}`.trim() };
}
async function mergeTeacherUser(t) {
  const u = await db.collection('users').findOne({ _id: t.user_id });
  return { ...t, id: String(t._id), _id: String(t._id), email: u?.email, username: u?.username,
           full_name: `${t.first_name || ''} ${t.last_name || ''}`.trim() };
}

// ===== ADMIN: students ======================================================
api.get('/admin/students/list.php', auth, async (req, res) => {
  const q = {};
  if (req.query.department) q.department = req.query.department;
  if (req.query.semester) q.semester = toInt(req.query.semester);
  if (req.query.search) {
    const rx = new RegExp(String(req.query.search), 'i');
    q.$or = [{ first_name: rx }, { last_name: rx }, { student_id: rx }];
  }
  const total = await db.collection('students').countDocuments(q);
  const limit = toInt(req.query.limit, 0);
  let cursor = db.collection('students').find(q).sort({ student_id: 1 });
  if (limit > 0) cursor = cursor.limit(limit);
  const docs = await cursor.toArray();
  const students = await Promise.all(docs.map(mergeStudentUser));
  ok(res, { students, total });
});

api.post('/admin/students/delete.php', auth, async (req, res) => {
  const sid = req.body.student_id;
  const s = await db.collection('students').findOne({ student_id: sid });
  if (!s) return fail(res, 404, 'Student not found');
  await db.collection('students').deleteOne({ _id: s._id });
  if (s.user_id) await db.collection('users').deleteOne({ _id: s.user_id });
  ok(res, {}, 'Student deleted');
});

// ===== ADMIN: teachers ======================================================
api.get('/admin/teachers/list.php', auth, async (req, res) => {
  const q = {};
  if (req.query.department) q.department = req.query.department;
  if (req.query.search) {
    const rx = new RegExp(String(req.query.search), 'i');
    q.$or = [{ first_name: rx }, { last_name: rx }, { teacher_id: rx }];
  }
  const total = await db.collection('teachers').countDocuments(q);
  const limit = toInt(req.query.limit, 0);
  let cursor = db.collection('teachers').find(q).sort({ teacher_id: 1 });
  if (limit > 0) cursor = cursor.limit(limit);
  const docs = await cursor.toArray();
  const teachers = await Promise.all(docs.map(mergeTeacherUser));
  ok(res, { teachers, total });
});

api.post('/admin/teachers/delete.php', auth, async (req, res) => {
  const tid = req.body.teacher_id;
  const t = await db.collection('teachers').findOne({ teacher_id: tid });
  if (!t) return fail(res, 404, 'Teacher not found');
  await db.collection('teachers').deleteOne({ _id: t._id });
  if (t.user_id) await db.collection('users').deleteOne({ _id: t.user_id });
  ok(res, {}, 'Teacher deleted');
});

// ===== ADMIN/shared: subjects ==============================================
api.get('/admin/subjects/list.php', auth, async (req, res) => {
  const q = {};
  if (req.query.department) q.department = req.query.department;
  if (req.query.semester) q.semester = toInt(req.query.semester);
  const total = await db.collection('subjects').countDocuments(q);
  const limit = toInt(req.query.limit, 0);
  let cursor = db.collection('subjects').find(q).sort({ subject_code: 1 });
  if (limit > 0) cursor = cursor.limit(limit);
  const docs = await cursor.toArray();
  const subjects = docs.map((s) => ({ ...s, id: String(s._id), _id: String(s._id) }));
  ok(res, { subjects, total });
});

// ===== NOTICES ==============================================================
api.get('/notices/get_all.php', auth, async (_req, res) => {
  const docs = await db.collection('notices').find({ is_active: { $ne: false } }).sort({ created_at: -1 }).toArray();
  const notices = docs.map((n) => ({ ...n, id: String(n._id), _id: String(n._id) }));
  ok(res, { notices });
});

api.post('/notices/create.php', auth, async (req, res) => {
  const now = new Date();
  const doc = {
    title: req.body.title || 'Untitled',
    content: req.body.content || '',
    category: req.body.category || 'general',
    priority: req.body.priority || 'normal',
    type: req.body.type || req.body.category || 'general',
    target_audience: req.body.target_audience || 'all',
    department: req.body.department || null,
    semester: req.body.semester != null ? toInt(req.body.semester) : null,
    is_active: true,
    created_by: req.user?.user_id ? new ObjectId(req.user.user_id) : null,
    created_at: now, updated_at: now
  };
  const r = await db.collection('notices').insertOne(doc);
  ok(res, { id: String(r.insertedId) }, 'Notice created');
});

api.post('/notices/delete.php', auth, async (req, res) => {
  const id = req.body.id;
  try { await db.collection('notices').deleteOne({ _id: new ObjectId(id) }); } catch { /* ignore */ }
  ok(res, {}, 'Notice deleted');
});

// ===== STUDENT ==============================================================
api.get('/student/get_profile.php', auth, async (req, res) => {
  const u = await db.collection('users').findOne({ _id: new ObjectId(req.user.user_id) });
  if (!u) return fail(res, 404, 'User not found');
  const s = await db.collection('students').findOne({ user_id: u._id }) || {};
  ok(res, { ...s, id: String(s._id || ''), email: u.email, username: u.username,
            full_name: `${s.first_name || ''} ${s.last_name || ''}`.trim() });
});

api.get('/student/get_marks.php', auth, async (_req, res) => {
  ok(res, { marks: [], summary: { gpa: '0.00', cgpa: '0.00' } });
});
api.get('/student/get_attendance.php', auth, async (_req, res) => {
  ok(res, { attendance: [], summary: {}, daily: [], subjects: [] });
});
api.get('/student/get_fees.php', auth, async (_req, res) => {
  ok(res, { fees: [], summary: { total: 0, paid: 0, pending: 0 } });
});
api.get('/student/get_payments.php', auth, async (_req, res) => ok(res, { payments: [] }));

// ===== TEACHER ==============================================================
api.get('/teacher/get_profile.php', auth, async (req, res) => {
  const u = await db.collection('users').findOne({ _id: new ObjectId(req.user.user_id) });
  if (!u) return fail(res, 404, 'User not found');
  const t = await db.collection('teachers').findOne({ user_id: u._id }) || {};
  ok(res, { ...t, id: String(t._id || ''), email: u.email, username: u.username,
            full_name: `${t.first_name || ''} ${t.last_name || ''}`.trim(), assigned_subjects: [] });
});

api.get('/teacher/get_assigned_subjects.php', auth, async (_req, res) => ok(res, { subjects: [] }));
api.get('/teacher/get_students.php', auth, async (_req, res) => ok(res, { students: [] }));
api.get('/attendance/get_students.php', auth, async (_req, res) => ok(res, { students: [] }));

// ===== MATERIALS ============================================================
api.get('/materials/get_all.php', async (_req, res) => res.json({ success: true, materials: [], data: { materials: [] } }));
api.get('/materials/get_by_department.php', async (_req, res) => res.json({ success: true, materials: [], data: { materials: [] } }));

// ===== fallback so the UI never hard-crashes on an unimplemented endpoint ===
api.get(/.*/, (req, res) => { console.log('  [unhandled GET]', req.path); res.json({ success: true, data: {} }); });
api.post(/.*/, (req, res) => { console.log('  [unhandled POST]', req.path); res.json({ success: true, data: {}, message: 'Not implemented in Node backend yet' }); });

app.use('/api', api);
app.get('/', (_req, res) => res.json({ status: 'ICP Node backend running', db: DB_NAME }));

// --- startup ---------------------------------------------------------------
async function start() {
  await client.connect();
  db = client.db(DB_NAME);
  await db.command({ ping: 1 });
  console.log(`Connected to MongoDB Atlas (db: ${DB_NAME})`);
  app.listen(PORT, () => console.log(`ICP backend listening at http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Backend failed to start:', err.message);
  process.exit(1);
});

