/**
 * ICP Node/Express + MongoDB backend
 * -----------------------------------
 * Serves the /api/*.php routes the React frontend calls, backed by MongoDB Atlas.
 * Reads MONGODB_URI / MONGODB_DB / JWT_SECRET / PORT from server/.env.
 */

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient, ObjectId } from 'mongodb';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
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
const CORS_ORIGIN = (env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
if (!URI) { console.error('ERROR: MONGODB_URI missing in server/.env'); process.exit(1); }

const client = new MongoClient(URI, { serverSelectionTimeoutMS: 15000 });
let db;

// --- helpers ---------------------------------------------------------------
const ok = (res, data = {}, message = 'OK') => res.json({ success: true, message, data });
const fail = (res, code, message, error = 'error') => res.status(code).json({ success: false, error, message });
const toInt = (v, d = undefined) => { const n = parseInt(v, 10); return Number.isNaN(n) ? d : n; };
const oid = (v) => { try { return new ObjectId(v); } catch { return null; } };

function signToken(user) {
  return jwt.sign({ user_id: String(user._id), username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h', jwtid: randomUUID() });
}
function getToken(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/Bearer\s+(.+)/i);
  return m ? m[1] : (req.query.token || null);
}

// In-memory token blacklist (jti -> expiry epoch). Cleared on restart; fine for
// a single-instance deployment. For multi-instance, back this with a Mongo TTL collection.
const tokenBlacklist = new Map();
setInterval(() => { const now = Date.now() / 1000; for (const [jti, exp] of tokenBlacklist) if (exp < now) tokenBlacklist.delete(jti); }, 60000).unref?.();

function auth(req, res, next) {
  const token = getToken(req);
  if (!token) return fail(res, 401, 'Please login to continue', 'unauthorized');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.jti && tokenBlacklist.has(decoded.jti)) return fail(res, 401, 'Session ended. Please login again.', 'unauthorized');
    req.user = decoded;
    next();
  } catch { return fail(res, 401, 'Invalid or expired token', 'unauthorized'); }
}

// Authorization: allow if the user's role is in `roles` (admin always allowed).
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, 'Please login to continue', 'unauthorized');
    if (req.user.role === 'admin' || roles.includes(req.user.role)) return next();
    return fail(res, 403, 'You do not have permission to access this resource', 'forbidden');
  };
}

async function activeSessionId() {
  const s = await db.collection('sessions').findOne({ is_active: true }) || await db.collection('sessions').findOne({});
  return s ? s._id : null;
}
async function buildUserPayload(user) {
  const base = { id: String(user._id), username: user.username, email: user.email, role: user.role, status: user.status };
  let profile = {};
  if (user.role === 'student') profile = await db.collection('students').findOne({ user_id: user._id }) || {};
  else if (user.role === 'teacher') profile = await db.collection('teachers').findOne({ user_id: user._id }) || {};
  else if (user.role === 'admin') profile = await db.collection('admins').findOne({ user_id: user._id }) || {};
  const merged = { ...base };
  for (const k of ['student_id', 'teacher_id', 'admin_id', 'first_name', 'last_name', 'department', 'semester', 'program', 'designation', 'profile_image']) {
    if (profile[k] !== undefined) merged[k] = profile[k];
  }
  if (merged.first_name || merged.last_name) merged.full_name = `${merged.first_name || ''} ${merged.last_name || ''}`.trim();
  return merged;
}
async function studentWithUser(s) {
  const u = await db.collection('users').findOne({ _id: s.user_id });
  return {
    ...s, id: String(s._id), _id: String(s._id),
    email: u?.email, username: u?.username,
    full_name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
    admission_year: s.batch_year, attendance_percentage: 0, cgpa: '0.00'
  };
}
async function teacherWithUser(t) {
  const u = await db.collection('users').findOne({ _id: t.user_id });
  const links = await db.collection('teacher_subjects').find({ teacher_id: t._id }).toArray();
  const assigned = [];
  for (const l of links) {
    const subj = await db.collection('subjects').findOne({ _id: l.subject_id });
    if (subj) assigned.push({ id: String(subj._id), subject_code: subj.subject_code, subject_name: subj.subject_name, semester: subj.semester });
  }
  return {
    ...t, id: String(t._id), _id: String(t._id),
    email: u?.email, username: u?.username,
    full_name: `${t.first_name || ''} ${t.last_name || ''}`.trim(),
    assigned_subjects: assigned
  };
}
function subjOut(s) { return { ...s, id: String(s._id), _id: String(s._id), credit_hours: s.credit_hours ?? 0 }; }
function noticeOut(n) {
  return {
    ...n, id: String(n._id), _id: String(n._id),
    image_url: n.image_url || n.attachment_url || null,
    attachment_url: n.attachment_url || n.image_url || null,
    date: n.created_at || null
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
async function studentForReq(req) {
  const u = await db.collection('users').findOne({ _id: oid(req.user.user_id) });
  return u ? await db.collection('students').findOne({ user_id: u._id }) : null;
}
async function subjectsById() {
  const map = {};
  (await db.collection('subjects').find({}).toArray()).forEach((x) => { map[String(x._id)] = x; });
  return map;
}

// Fees that apply to a student (matching dept+semester, or fee with null dept/sem = all)
async function feesForStudent(s) {
  if (!s) return [];
  return await db.collection('fees').find({
    is_active: { $ne: false },
    $and: [
      { $or: [{ department: s.department }, { department: null }, { department: { $exists: false } }] },
      { $or: [{ semester: s.semester }, { semester: null }, { semester: { $exists: false } }] }
    ]
  }).toArray();
}
async function studentFeeItems(s) {
  if (!s) return { items: [], summary: { total_paid: 0, total_pending: 0 } };
  const fees = await feesForStudent(s);
  const payments = await db.collection('payments').find({ student_id: s._id }).toArray();
  const paidMap = {};
  for (const p of payments) if (p.status === 'completed') paidMap[String(p.fee_id)] = p;
  let total_paid = 0; let total_pending = 0;
  const items = fees.map((f) => {
    const isPaid = !!paidMap[String(f._id)];
    if (isPaid) total_paid += f.amount; else total_pending += f.amount;
    const fd = f.fee_details || null;
    return {
      id: String(f._id),
      description: f.fee_name || f.fee_type,
      amount: f.amount,
      due_date: (fd && fd.lastDateNormal) || (f.due_date ? new Date(f.due_date).toISOString().slice(0, 10) : null),
      status: isPaid ? 'paid' : 'pending',
      feeDetails: fd
    };
  });
  return { items, summary: { total_paid, total_pending } };
}

const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });

// Stricter rate limit on login to slow brute-force attempts.
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ success: false, error: 'rate_limited', message: 'Too many login attempts. Please try again shortly.' }) });

const api = express.Router();

// ===== AUTH =================================================================
api.post('/auth/login.php', loginLimiter, async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) return fail(res, 400, 'Username and password are required', 'validation_error');
  const user = await db.collection('users').findOne({ $or: [{ username }, { email: username }] });
  if (!user) return fail(res, 401, 'Invalid username or password', 'invalid_credentials');
  const match = await bcrypt.compare(password, user.password);
  if (!match) return fail(res, 401, 'Invalid username or password', 'invalid_credentials');
  const norm = (r) => (r === 'staff' ? 'teacher' : r);
  if (role && norm(role) !== norm(user.role)) return fail(res, 403, `You are registered as ${user.role}, not ${role}.`, 'role_mismatch');
  if (user.status && user.status !== 'active') return fail(res, 403, 'Your account is inactive.', 'account_inactive');
  await db.collection('users').updateOne({ _id: user._id }, { $set: { last_login: new Date() } });
  return res.json({ success: true, message: 'Login successful', data: { user: await buildUserPayload(user), token: signToken(user) } });
});
api.get('/auth/verify.php', auth, (req, res) => res.json({ success: true, data: { user_id: req.user.user_id, username: req.user.username, role: req.user.role } }));
api.post('/auth/logout.php', (req, res) => {
  const token = getToken(req);
  if (token) {
    try { const d = jwt.decode(token); if (d?.jti && d?.exp) tokenBlacklist.set(d.jti, d.exp); } catch { /* ignore */ }
  }
  res.json({ success: true, message: 'Logged out' });
});

// ===== ADMIN: students ======================================================
api.get('/admin/students/list.php', auth, requireRole('admin'), async (req, res) => {
  const q = {};
  if (req.query.department) q.department = req.query.department;
  if (req.query.semester) q.semester = toInt(req.query.semester);
  if (req.query.search) { const rx = new RegExp(String(req.query.search), 'i'); q.$or = [{ first_name: rx }, { last_name: rx }, { student_id: rx }]; }
  const total = await db.collection('students').countDocuments(q);
  let cur = db.collection('students').find(q).sort({ student_id: 1 });
  const limit = toInt(req.query.limit, 0); if (limit > 0) cur = cur.limit(limit);
  const students = await Promise.all((await cur.toArray()).map(studentWithUser));
  ok(res, { students, total });
});
api.post('/admin/students/create.php', auth, requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.student_id || !b.username) return fail(res, 400, 'student_id and username are required');
  if (await db.collection('students').findOne({ student_id: b.student_id })) return fail(res, 409, 'Student ID already exists');
  const now = new Date();
  const hash = await bcrypt.hash(b.password || 'password123', 10);
  const userRes = await db.collection('users').insertOne({
    username: b.username, email: b.email || `${b.username}@college.com`, password: hash, role: 'student', status: 'active', created_at: now, updated_at: now
  });
  await db.collection('students').insertOne({
    user_id: userRes.insertedId, student_id: b.student_id, first_name: b.first_name || '', last_name: b.last_name || '',
    date_of_birth: b.date_of_birth ? new Date(b.date_of_birth) : null, gender: b.gender || 'male', phone: b.phone || null,
    address: b.address || null, department: b.department || null, semester: toInt(b.semester, 1),
    session_id: await activeSessionId(), batch_year: toInt(b.admission_year, new Date().getFullYear()),
    profile_image: b.profile_image || null, enrollment_date: now, created_at: now, updated_at: now
  });
  ok(res, {}, 'Student created');
});
api.post('/admin/students/update.php', auth, requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  const s = await db.collection('students').findOne({ student_id: b.student_id });
  if (!s) return fail(res, 404, 'Student not found');
  const set = {};
  for (const k of ['first_name', 'last_name', 'phone', 'address', 'department']) if (b[k] !== undefined) set[k] = b[k];
  if (b.gender) set.gender = b.gender;
  if (b.semester !== undefined) set.semester = toInt(b.semester);
  if (b.date_of_birth) set.date_of_birth = new Date(b.date_of_birth);
  if (b.admission_year !== undefined) set.batch_year = toInt(b.admission_year);
  if (b.profile_image !== undefined) set.profile_image = b.profile_image;
  set.updated_at = new Date();
  await db.collection('students').updateOne({ _id: s._id }, { $set: set });
  if (s.user_id && (b.email || b.username || b.password)) {
    const us = {};
    if (b.email) us.email = b.email;
    if (b.username) us.username = b.username;
    if (b.password) us.password = await bcrypt.hash(b.password, 10);
    await db.collection('users').updateOne({ _id: s.user_id }, { $set: us });
  }
  ok(res, {}, 'Student updated');
});
api.post('/admin/students/delete.php', auth, requireRole('admin'), async (req, res) => {
  const s = await db.collection('students').findOne({ student_id: req.body.student_id });
  if (!s) return fail(res, 404, 'Student not found');
  await db.collection('students').deleteOne({ _id: s._id });
  if (s.user_id) await db.collection('users').deleteOne({ _id: s.user_id });
  ok(res, {}, 'Student deleted');
});

// ===== ADMIN: teachers ======================================================
api.get('/admin/teachers/list.php', auth, requireRole('admin'), async (req, res) => {
  const q = {};
  if (req.query.department) q.department = req.query.department;
  if (req.query.search) { const rx = new RegExp(String(req.query.search), 'i'); q.$or = [{ first_name: rx }, { last_name: rx }, { teacher_id: rx }]; }
  const total = await db.collection('teachers').countDocuments(q);
  let cur = db.collection('teachers').find(q).sort({ teacher_id: 1 });
  const limit = toInt(req.query.limit, 0); if (limit > 0) cur = cur.limit(limit);
  const teachers = await Promise.all((await cur.toArray()).map(teacherWithUser));
  ok(res, { teachers, total });
});
api.post('/admin/teachers/create.php', auth, requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  if (!b.teacher_id || !b.username) return fail(res, 400, 'teacher_id and username are required');
  if (await db.collection('teachers').findOne({ teacher_id: b.teacher_id })) return fail(res, 409, 'Teacher ID already exists');
  const now = new Date();
  const hash = await bcrypt.hash(b.password || 'password123', 10);
  const userRes = await db.collection('users').insertOne({
    username: b.username, email: b.email || `${b.username}@college.com`, password: hash, role: 'teacher', status: 'active', created_at: now, updated_at: now
  });
  const tRes = await db.collection('teachers').insertOne({
    user_id: userRes.insertedId, teacher_id: b.teacher_id, first_name: b.first_name || '', last_name: b.last_name || '',
    date_of_birth: b.date_of_birth ? new Date(b.date_of_birth) : null, gender: b.gender || 'male', phone: b.phone || null,
    address: b.address || null, department: b.department || null, designation: b.designation || 'Assistant Professor',
    qualification: b.qualification || null, specialization: b.specialization || null, profile_image: b.profile_image || null,
    created_at: now, updated_at: now
  });
  for (const sid of (b.assigned_subjects || [])) {
    const so = oid(sid); if (!so) continue;
    await db.collection('teacher_subjects').updateOne({ teacher_id: tRes.insertedId, subject_id: so }, { $set: { teacher_id: tRes.insertedId, subject_id: so, is_active: true, assigned_date: now } }, { upsert: true });
  }
  ok(res, {}, 'Teacher created');
});
api.post('/admin/teachers/update.php', auth, requireRole('admin'), async (req, res) => {
  const b = req.body || {};
  const t = await db.collection('teachers').findOne({ teacher_id: b.teacher_id });
  if (!t) return fail(res, 404, 'Teacher not found');
  const set = {};
  for (const k of ['first_name', 'last_name', 'phone', 'address', 'department', 'designation', 'qualification', 'specialization']) if (b[k] !== undefined) set[k] = b[k];
  if (b.gender) set.gender = b.gender;
  if (b.date_of_birth) set.date_of_birth = new Date(b.date_of_birth);
  if (b.profile_image !== undefined) set.profile_image = b.profile_image;
  set.updated_at = new Date();
  await db.collection('teachers').updateOne({ _id: t._id }, { $set: set });
  if (t.user_id && (b.email || b.username || b.password)) {
    const us = {};
    if (b.email) us.email = b.email;
    if (b.username) us.username = b.username;
    if (b.password) us.password = await bcrypt.hash(b.password, 10);
    await db.collection('users').updateOne({ _id: t.user_id }, { $set: us });
  }
  if (Array.isArray(b.assigned_subjects)) {
    await db.collection('teacher_subjects').deleteMany({ teacher_id: t._id });
    for (const sid of b.assigned_subjects) {
      const so = oid(sid); if (!so) continue;
      await db.collection('teacher_subjects').insertOne({ teacher_id: t._id, subject_id: so, is_active: true, assigned_date: new Date() });
    }
  }
  ok(res, {}, 'Teacher updated');
});
api.post('/admin/teachers/delete.php', auth, requireRole('admin'), async (req, res) => {
  const t = await db.collection('teachers').findOne({ teacher_id: req.body.teacher_id });
  if (!t) return fail(res, 404, 'Teacher not found');
  await db.collection('teachers').deleteOne({ _id: t._id });
  await db.collection('teacher_subjects').deleteMany({ teacher_id: t._id });
  if (t.user_id) await db.collection('users').deleteOne({ _id: t.user_id });
  ok(res, {}, 'Teacher deleted');
});

// ===== SUBJECTS =============================================================
api.get('/admin/subjects/list.php', auth, async (req, res) => {
  const q = {};
  if (req.query.department) q.department = req.query.department;
  if (req.query.semester) q.semester = toInt(req.query.semester);
  const total = await db.collection('subjects').countDocuments(q);
  let cur = db.collection('subjects').find(q).sort({ subject_code: 1 });
  const limit = toInt(req.query.limit, 0); if (limit > 0) cur = cur.limit(limit);
  const subjects = (await cur.toArray()).map(subjOut);
  ok(res, { subjects, total });
});

// ===== NOTICES ==============================================================
api.get('/notices/get_all.php', auth, async (_req, res) => {
  const docs = await db.collection('notices').find({ is_active: { $ne: false } }).sort({ created_at: -1 }).toArray();
  ok(res, { notices: docs.map(noticeOut) });
});
api.post('/notices/create.php', auth, async (req, res) => {
  const b = req.body || {}; const now = new Date();
  const doc = {
    title: b.title || 'Untitled', content: b.content || '',
    category: b.category || b.type || 'general', type: b.type || b.category || 'general',
    priority: b.priority || 'normal', target_audience: b.target_audience || 'all',
    department: b.department || null, semester: b.semester != null ? toInt(b.semester) : null,
    attachment_url: b.attachment_url || b.image_url || null, image_url: b.image_url || b.attachment_url || null,
    is_active: true, created_by: req.user?.user_id ? oid(req.user.user_id) : null, created_at: now, updated_at: now
  };
  const r = await db.collection('notices').insertOne(doc);
  ok(res, { id: String(r.insertedId) }, 'Notice created');
});
api.post('/notices/delete.php', auth, async (req, res) => {
  const id = oid(req.body.id); if (id) await db.collection('notices').deleteOne({ _id: id });
  ok(res, {}, 'Notice deleted');
});

// ===== STUDENT ==============================================================
api.get('/student/get_profile.php', auth, async (req, res) => {
  const u = await db.collection('users').findOne({ _id: oid(req.user.user_id) });
  if (!u) return fail(res, 404, 'User not found');
  const s = await db.collection('students').findOne({ user_id: u._id }) || {};
  ok(res, { ...s, id: String(s._id || ''), _id: String(s._id || ''), email: u.email, username: u.username,
            program: s.program || s.department || null, full_name: `${s.first_name || ''} ${s.last_name || ''}`.trim() });
});
api.get('/student/get_marks.php', auth, (_req, res) => ok(res, { marks: [], summary: { gpa: '0.00', cgpa: '0.00' } }));
api.get('/student/get_current_results.php', auth, async (req, res) => {
  const s = await studentForReq(req) || {};
  const out = { class_test: [], internal_1: [], internal_2: [] };
  if (s._id) {
    const subjMap = await subjectsById();
    const marks = await db.collection('exam_marks').find({ student_id: s._id, semester: s.semester }).toArray();
    for (const m of marks) {
      const subj = subjMap[String(m.subject_id)];
      const row = { subject_name: subj?.subject_name || 'Unknown', subject_code: subj?.subject_code || '',
                    marks_obtained: m.marks_obtained, max_marks: m.max_marks };
      if (out[m.exam_type]) out[m.exam_type].push(row);
    }
  }
  ok(res, { results: out, student: { semester: s.semester || null, department: s.department || null, program: s.program || s.department || null } });
});
api.get('/student/get_historical_results.php', auth, (_req, res) => ok(res, { results: [] }));
api.get('/student/get_attendance.php', auth, async (req, res) => {
  const s = await studentForReq(req);
  const current_semester = s?.semester || 1;
  const emptyDaily = { records: [], stats: { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 }, subjects: [], attendance: [], summary: {}, current_semester };
  if (!s) return ok(res, emptyDaily);
  const subjMap = await subjectsById();
  const semFilter = req.query.semester ? String(req.query.semester) : null;
  const matchSem = (r) => { const subj = subjMap[String(r.subject_id)]; return !semFilter || (subj && String(subj.semester) === semFilter); };

  if (req.query.view_type === 'summary') {
    const recs = (await db.collection('attendance').find({ student_id: s._id }).toArray()).filter(matchSem);
    const bySubject = {};
    for (const r of recs) {
      const subj = subjMap[String(r.subject_id)];
      const key = String(r.subject_id);
      bySubject[key] = bySubject[key] || { subject: subj, total: 0, present: 0, months: {} };
      const g = bySubject[key]; g.total++;
      if (r.status === 'present' || r.status === 'late') g.present++;
      const d = new Date(r.attendance_date); const mk = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      g.months[mk] = g.months[mk] || { month: d.getUTCMonth(), year: d.getUTCFullYear(), total_classes: 0, present_count: 0, absent_count: 0 };
      const mm = g.months[mk]; mm.total_classes++;
      if (r.status === 'present' || r.status === 'late') mm.present_count++; else mm.absent_count++;
    }
    const subjects = Object.values(bySubject).map((g) => ({
      subject_name: g.subject?.subject_name || 'Unknown', subject_code: g.subject?.subject_code || '',
      overall_percentage: g.total ? Math.round((g.present / g.total) * 100) : 0,
      months: Object.values(g.months).map((m) => ({ month_name: MONTHS[m.month], year: m.year, total_classes: m.total_classes, present_count: m.present_count, absent_count: m.absent_count, percentage: m.total_classes ? Math.round((m.present_count / m.total_classes) * 100) : 0 }))
    }));
    return ok(res, { subjects, current_semester });
  }

  const now = new Date();
  const month = toInt(req.query.month, now.getUTCMonth() + 1);
  const year = toInt(req.query.year, now.getUTCFullYear());
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const recs = (await db.collection('attendance').find({ student_id: s._id, attendance_date: { $gte: start, $lt: end } }).sort({ attendance_date: 1 }).toArray()).filter(matchSem);
  const records = []; const stats = { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 };
  for (const r of recs) {
    const subj = subjMap[String(r.subject_id)];
    records.push({ status: r.status, subject_name: subj?.subject_name || 'Unknown', subject_code: subj?.subject_code || '', remarks: r.remarks || '', attendance_date: new Date(r.attendance_date).toISOString().slice(0, 10) });
    stats.total++; if (stats[r.status] !== undefined) stats[r.status]++;
  }
  stats.percentage = stats.total ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;
  ok(res, { records, stats, subjects: [], attendance: records, summary: stats, current_semester });
});
api.get('/student/get_fees.php', auth, async (req, res) => {
  const s = await studentForReq(req);
  const { items, summary } = await studentFeeItems(s);
  ok(res, { fees: items, summary });
});
api.get('/student/get_payments.php', auth, async (req, res) => {
  const s = await studentForReq(req);
  const { items, summary } = await studentFeeItems(s);
  ok(res, { payments: items, summary });
});
api.get('/attendance/get_student_history.php', auth, (_req, res) => ok(res, { history: [], records: [] }));

// dashboard attendance summary (for api.getAttendance)
api.get('/student/dashboard_attendance.php', auth, async (req, res) => {
  const s = await studentForReq(req);
  if (!s) return ok(res, { subjects: [] });
  const recs = await db.collection('attendance').find({ student_id: s._id }).toArray();
  const by = {};
  for (const r of recs) {
    const k = String(r.subject_id); by[k] = by[k] || { present: 0, total: 0 };
    by[k].total++; if (r.status === 'present' || r.status === 'late') by[k].present++;
  }
  ok(res, { subjects: Object.values(by) });
});

// ===== TEACHER ==============================================================
api.get('/teacher/get_profile.php', auth, async (req, res) => {
  const u = await db.collection('users').findOne({ _id: oid(req.user.user_id) });
  if (!u) return fail(res, 404, 'User not found');
  const t = await db.collection('teachers').findOne({ user_id: u._id }) || {};
  ok(res, { ...t, id: String(t._id || ''), _id: String(t._id || ''), email: u.email, username: u.username,
            full_name: `${t.first_name || ''} ${t.last_name || ''}`.trim(), assigned_subjects: [] });
});
async function teacherDept(req) {
  const u = await db.collection('users').findOne({ _id: oid(req.user.user_id) });
  const t = u && await db.collection('teachers').findOne({ user_id: u._id });
  return t?.department || null;
}
api.get('/teacher/get_students.php', auth, async (req, res) => {
  const dept = req.query.department || await teacherDept(req);
  const q = {}; if (dept) q.department = dept;
  if (req.query.semester) q.semester = toInt(req.query.semester);
  const total = await db.collection('students').countDocuments(q);
  let cur = db.collection('students').find(q).sort({ student_id: 1 });
  const limit = toInt(req.query.limit, 0); if (limit > 0) cur = cur.limit(limit);
  const students = await Promise.all((await cur.toArray()).map(studentWithUser));
  ok(res, { students, total, pagination: { total } });
});
api.get('/teacher/get_assigned_subjects.php', auth, async (req, res) => {
  const dept = await teacherDept(req);
  const q = {}; if (dept) q.department = dept;
  if (req.query.semester) q.semester = toInt(req.query.semester);
  const subjects = (await db.collection('subjects').find(q).sort({ semester: 1, subject_code: 1 }).toArray()).map(subjOut);
  ok(res, { subjects });
});
api.get('/teacher/get_attendance_report.php', auth, (_req, res) => ok(res, { report: [] }));

// ===== ATTENDANCE (teacher marking) ========================================
api.get('/attendance/get_students.php', auth, async (req, res) => {
  const q = {};
  if (req.query.department) q.department = req.query.department;
  if (req.query.semester) q.semester = toInt(req.query.semester);
  const studentsRaw = await db.collection('students').find(q).sort({ student_id: 1 }).toArray();
  const sid = oid(req.query.subject_id);
  const date = req.query.date ? new Date(req.query.date) : null;
  let existing = {};
  if (sid && date) {
    const recs = await db.collection('attendance').find({ subject_id: sid, attendance_date: date }).toArray();
    for (const r of recs) existing[String(r.student_id)] = r.status;
  }
  const students = studentsRaw.map((s) => ({
    id: String(s._id), student_id: s.student_id, first_name: s.first_name, last_name: s.last_name,
    profile_image: s.profile_image || null, status: existing[String(s._id)] || null
  }));
  ok(res, { students });
});
api.post('/attendance/mark.php', auth, async (req, res) => {
  const b = req.body || {};
  const sid = oid(b.subject_id);
  const date = b.date ? new Date(b.date) : new Date();
  const map = b.attendance || {};
  if (!sid) return fail(res, 400, 'subject_id required');
  const sessionId = await activeSessionId();
  const markedBy = oid(req.user.user_id);
  let count = 0;
  for (const [studentId, status] of Object.entries(map)) {
    const stId = oid(studentId); if (!stId || !status) continue;
    await db.collection('attendance').updateOne(
      { student_id: stId, subject_id: sid, attendance_date: date },
      { $set: { student_id: stId, subject_id: sid, session_id: sessionId, attendance_date: date, status, marked_by: markedBy, marked_at: new Date() } },
      { upsert: true }
    );
    count++;
  }
  ok(res, { marked: count }, `Attendance saved for ${count} students`);
});

// ===== MARKS (persist to exam_marks) =======================================
async function saveExamMarks(req, res) {
  const b = req.body || {};
  const semester = toInt(b.semester);
  const examType = b.exam_type;
  const maxMarks = Number(b.max_marks) || 0;
  const marksMap = b.marks || {};
  if (!b.subject_code || !semester || !examType) return fail(res, 400, 'subject_code, semester and exam_type are required');
  const subjQuery = { subject_code: b.subject_code };
  if (b.department) subjQuery.department = b.department;
  const subject = await db.collection('subjects').findOne(subjQuery);
  if (!subject) return fail(res, 404, 'Subject not found');
  const u = await db.collection('users').findOne({ _id: oid(req.user.user_id) });
  const teacher = u && await db.collection('teachers').findOne({ user_id: u._id });
  const now = new Date();
  let count = 0;
  for (const [studentId, val] of Object.entries(marksMap)) {
    if (val === '' || val === null || val === undefined) continue;
    const stId = oid(studentId); if (!stId) continue;
    await db.collection('exam_marks').updateOne(
      { student_id: stId, subject_id: subject._id, semester, exam_type: examType },
      { $set: { student_id: stId, subject_id: subject._id, semester, exam_type: examType, marks_obtained: Number(val), max_marks: maxMarks, entered_by: teacher?._id || null, updated_at: now }, $setOnInsert: { created_at: now } },
      { upsert: true }
    );
    count++;
  }
  ok(res, { saved: count }, `Saved marks for ${count} student(s)`);
}
api.post('/teacher/enter_marks.php', auth, requireRole('teacher'), saveExamMarks);
api.post('/teacher/update_marks.php', auth, requireRole('teacher'), saveExamMarks);

// ===== MATERIALS ============================================================
const emptyMaterials = (_req, res) => res.json({ success: true, materials: [], data: { materials: [] } });
api.get('/materials/get_all.php', emptyMaterials);
api.get('/materials/get_by_department.php', emptyMaterials);
api.post('/materials/upload.php', (_req, res) => res.json({ success: true, message: 'Uploaded', data: {} }));
api.post('/materials/delete.php', (_req, res) => res.json({ success: true, message: 'Deleted' }));

// ===== ASSIGNMENTS ==========================================================
api.get('/assignments/get_student_subjects.php', auth, async (req, res) => {
  const u = await db.collection('users').findOne({ _id: oid(req.user.user_id) });
  const s = (u && await db.collection('students').findOne({ user_id: u._id })) || {};
  const subs = s.department ? await db.collection('subjects').find({ department: s.department }).toArray() : [];
  const subjects = subs.map((x) => ({ id: String(x._id), subject_name: x.subject_name, subject_code: x.subject_code, pending_count: 0, rejected_count: 0, total_assignments: 0 }));
  ok(res, { subjects });
});
api.get('/assignments/get_student_assignments.php', auth, (_req, res) => ok(res, { pending: [], rejected: [], submitted: [], overdue: [] }));
api.post('/assignments/submit.php', (_req, res) => res.json({ success: true, message: 'Submitted' }));
api.get('/assignments/get_teacher_assignments.php', auth, (_req, res) => ok(res, { assignments: [] }));
api.get('/assignments/get_subjects_by_semester.php', auth, async (req, res) => {
  const dept = await teacherDept(req);
  const q = {}; if (dept) q.department = dept;
  if (req.query.semester) q.semester = toInt(req.query.semester);
  const subjects = (await db.collection('subjects').find(q).toArray()).map(subjOut);
  ok(res, { subjects });
});
api.get('/assignments/get_submissions.php', auth, (_req, res) => ok(res, { submitted: [], not_submitted: [], assignment: { id: null, title: '' } }));
api.post('/assignments/create.php', (_req, res) => res.json({ success: true, message: 'Assignment created' }));
api.post('/assignments/review_submission.php', (_req, res) => res.json({ success: true, message: 'Reviewed' }));
api.get('/assignments/get_dashboard_notifications.php', auth, (_req, res) => ok(res, { notifications: [] }));

// ===== FEES (admin) ========================================================
api.post('/admin/fees/create.php', auth, requireRole('admin'), async (req, res) => {
  const b = req.body || {}; const now = new Date();
  const doc = {
    fee_type: b.fee_type || b.feeType || 'other',
    fee_name: b.fee_name || b.feeTypeName || 'Fee',
    amount: Number(b.amount) || 0,
    semester: b.semester != null ? toInt(b.semester) : null,
    department: b.department || null,
    program: b.program || null,
    session_id: await activeSessionId(),
    due_date: b.due_date ? new Date(b.due_date) : (b.lastDateNormal ? new Date(b.lastDateNormal) : now),
    late_fine_per_day: Number(b.late_fine_per_day || 0),
    max_late_fine: Number(b.superFineAmount || b.max_late_fine || 0),
    description: b.description || null,
    is_active: true,
    fee_details: {
      feeTypeName: b.fee_name || b.feeTypeName || null,
      lastDateNormal: b.lastDateNormal || null,
      lastDateFine: b.lastDateFine || null,
      lastDateSuperFine: b.lastDateSuperFine || null,
      fineAmount: b.fineAmount || null,
      superFineAmount: b.superFineAmount || null
    },
    created_at: now, updated_at: now
  };
  const r = await db.collection('fees').insertOne(doc);
  ok(res, { id: String(r.insertedId) }, 'Fee created');
});
api.get('/admin/fees/list.php', auth, requireRole('admin'), async (_req, res) => {
  const fees = (await db.collection('fees').find({}).sort({ created_at: -1 }).toArray()).map((f) => ({ ...f, id: String(f._id), _id: String(f._id) }));
  ok(res, { fees });
});
api.post('/admin/fees/delete.php', auth, requireRole('admin'), async (req, res) => {
  const id = oid(req.body.id || req.body.fee_id); if (id) await db.collection('fees').deleteOne({ _id: id });
  ok(res, {}, 'Fee deleted');
});
api.get('/admin/fees/pending_students.php', auth, requireRole('admin'), async (req, res) => {
  const feeQuery = { is_active: { $ne: false } };
  if (req.query.fee_type && req.query.fee_type !== 'all') feeQuery.fee_type = req.query.fee_type;
  const fees = await db.collection('fees').find(feeQuery).toArray();
  const rows = [];
  for (const f of fees) {
    const sQuery = {};
    if (f.department) sQuery.department = f.department;
    if (f.semester) sQuery.semester = f.semester;
    const students = await db.collection('students').find(sQuery).toArray();
    for (const st of students) {
      const paid = await db.collection('payments').findOne({ student_id: st._id, fee_id: f._id, status: 'completed' });
      if (paid) continue;
      const fd = f.fee_details || {};
      rows.push({
        id: `${st._id}_${f._id}`,
        rollNo: st.student_id, name: `${st.first_name || ''} ${st.last_name || ''}`.trim(),
        department: st.department, year: Math.ceil((st.semester || 1) / 2), semester: st.semester,
        feeType: f.fee_name || f.fee_type, amount: f.amount,
        dueDate: fd.lastDateNormal || (f.due_date ? new Date(f.due_date).toISOString().slice(0, 10) : null),
        fineAmount: Number(fd.fineAmount || 0), superFineAmount: Number(fd.superFineAmount || 0)
      });
    }
  }
  const filtered = (req.query.department && req.query.department !== 'all') ? rows.filter((r) => r.department === req.query.department) : rows;
  ok(res, { students: filtered });
});
api.post('/admin/fees/send_reminder.php', auth, requireRole('admin'), (_req, res) => ok(res, {}, 'Reminder sent'));

// ===== PAYMENTS (record to DB) =============================================
api.post('/payments/process.php', auth, async (req, res) => {
  const s = await studentForReq(req);
  if (!s) return fail(res, 404, 'Student not found');
  const fid = oid(req.body.fee_id);
  if (!fid) return fail(res, 400, 'fee_id is required');
  const fee = await db.collection('fees').findOne({ _id: fid });
  if (!fee) return fail(res, 404, 'Fee not found');
  const existing = await db.collection('payments').findOne({ student_id: s._id, fee_id: fid, status: 'completed' });
  if (existing) return ok(res, { receipt_number: existing.receipt_number }, 'Already paid');
  const now = new Date();
  const receipt = 'RCP' + Date.now() + Math.floor(Math.random() * 1000);
  await db.collection('payments').insertOne({
    student_id: s._id, fee_id: fid, amount_paid: fee.amount, late_fine: 0, total_amount: fee.amount,
    payment_date: now, payment_method: String(req.body.payment_method || 'online').toLowerCase(),
    transaction_id: 'TXN' + Date.now(), receipt_number: receipt, status: 'completed', processed_by: null,
    created_at: now, updated_at: now
  });
  ok(res, { receipt_number: receipt }, 'Payment successful');
});

// ===== UPLOAD ==============================================================
api.post('/upload/upload_image.php', (_req, res) => res.json({ success: true, data: { file_path: '/uploads/placeholder.png' }, message: 'Uploaded (placeholder)' }));

// ===== unknown API routes -> 404 (no more blanket success) =================
api.all(/.*/, (req, res) => fail(res, 404, `Unknown endpoint: ${req.method} ${req.originalUrl}`, 'not_found'));

app.use('/api', api);
app.get('/', (_req, res) => res.json({ status: 'ICP Node backend running', db: DB_NAME }));

// Central error handler (catches sync + async route errors via express-async-errors)
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return;
  res.status(500).json({ success: false, error: 'server_error', message: 'Something went wrong' });
});

async function start() {
  await client.connect();
  db = client.db(DB_NAME);
  await db.command({ ping: 1 });
  console.log(`Connected to MongoDB Atlas (db: ${DB_NAME})`);
  app.listen(PORT, () => console.log(`ICP backend listening at http://localhost:${PORT}`));
}
start().catch((err) => { console.error('Backend failed to start:', err.message); process.exit(1); });
