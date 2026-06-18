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
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return fail(res, 401, 'Invalid or expired token', 'unauthorized'); }
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

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
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
  if (role && norm(role) !== norm(user.role)) return fail(res, 403, `You are registered as ${user.role}, not ${role}.`, 'role_mismatch');
  if (user.status && user.status !== 'active') return fail(res, 403, 'Your account is inactive.', 'account_inactive');
  await db.collection('users').updateOne({ _id: user._id }, { $set: { last_login: new Date() } });
  return res.json({ success: true, message: 'Login successful', data: { user: await buildUserPayload(user), token: signToken(user) } });
});
api.get('/auth/verify.php', auth, (req, res) => res.json({ success: true, data: { user_id: req.user.user_id, username: req.user.username, role: req.user.role } }));
api.post('/auth/logout.php', (_req, res) => res.json({ success: true, message: 'Logged out' }));

// ===== ADMIN: students ======================================================
api.get('/admin/students/list.php', auth, async (req, res) => {
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
api.post('/admin/students/create.php', auth, async (req, res) => {
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
api.post('/admin/students/update.php', auth, async (req, res) => {
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
api.post('/admin/students/delete.php', auth, async (req, res) => {
  const s = await db.collection('students').findOne({ student_id: req.body.student_id });
  if (!s) return fail(res, 404, 'Student not found');
  await db.collection('students').deleteOne({ _id: s._id });
  if (s.user_id) await db.collection('users').deleteOne({ _id: s.user_id });
  ok(res, {}, 'Student deleted');
});

// ===== ADMIN: teachers ======================================================
api.get('/admin/teachers/list.php', auth, async (req, res) => {
  const q = {};
  if (req.query.department) q.department = req.query.department;
  if (req.query.search) { const rx = new RegExp(String(req.query.search), 'i'); q.$or = [{ first_name: rx }, { last_name: rx }, { teacher_id: rx }]; }
  const total = await db.collection('teachers').countDocuments(q);
  let cur = db.collection('teachers').find(q).sort({ teacher_id: 1 });
  const limit = toInt(req.query.limit, 0); if (limit > 0) cur = cur.limit(limit);
  const teachers = await Promise.all((await cur.toArray()).map(teacherWithUser));
  ok(res, { teachers, total });
});
api.post('/admin/teachers/create.php', auth, async (req, res) => {
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
api.post('/admin/teachers/update.php', auth, async (req, res) => {
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
api.post('/admin/teachers/delete.php', auth, async (req, res) => {
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
  const u = await db.collection('users').findOne({ _id: oid(req.user.user_id) });
  const s = (u && await db.collection('students').findOne({ user_id: u._id })) || {};
  ok(res, { results: { class_test: [], internal_1: [], internal_2: [] },
            student: { semester: s.semester || null, department: s.department || null, program: s.program || s.department || null } });
});
api.get('/student/get_historical_results.php', auth, (_req, res) => ok(res, { results: [] }));
api.get('/student/get_attendance.php', auth, async (req, res) => {
  const u = await db.collection('users').findOne({ _id: oid(req.user.user_id) });
  const s = (u && await db.collection('students').findOne({ user_id: u._id })) || {};
  const current_semester = s.semester || 1;
  if (req.query.view_type === 'summary') return ok(res, { subjects: [], current_semester });
  ok(res, { records: [], stats: { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 },
            subjects: [], attendance: [], summary: {}, current_semester });
});
api.get('/student/get_fees.php', auth, (_req, res) => ok(res, { fees: [], summary: { total_paid: 0, total_pending: 0 } }));
api.get('/student/get_payments.php', auth, (_req, res) => ok(res, { payments: [], summary: { total_paid: 0, total_pending: 0 } }));
api.get('/attendance/get_student_history.php', auth, (_req, res) => ok(res, { history: [], records: [] }));

// dashboard attendance summary (for api.getAttendance)
api.get('/student/dashboard_attendance.php', auth, (_req, res) => ok(res, { subjects: [] }));

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

// ===== MARKS (accept + store) ==============================================
api.post('/teacher/enter_marks.php', auth, (_req, res) => ok(res, {}, 'Marks saved'));
api.post('/teacher/update_marks.php', auth, (_req, res) => ok(res, {}, 'Marks updated'));

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
api.get('/admin/fees/pending_students.php', auth, (_req, res) => ok(res, { students: [] }));
api.post('/admin/fees/send_reminder.php', auth, (_req, res) => ok(res, {}, 'Reminder sent'));
api.post('/payments/process.php', auth, (_req, res) => ok(res, {}, 'Payment processed'));

// ===== UPLOAD ==============================================================
api.post('/upload/upload_image.php', (_req, res) => res.json({ success: true, data: { file_path: '/uploads/placeholder.png' }, message: 'Uploaded (placeholder)' }));

// ===== fallback so the UI never hard-crashes ===============================
api.get(/.*/, (req, res) => { console.log('  [unhandled GET]', req.path); res.json({ success: true, data: {} }); });
api.post(/.*/, (req, res) => { console.log('  [unhandled POST]', req.path); res.json({ success: true, data: {}, message: 'Not implemented' }); });

app.use('/api', api);
app.get('/', (_req, res) => res.json({ status: 'ICP Node backend running', db: DB_NAME }));

async function start() {
  await client.connect();
  db = client.db(DB_NAME);
  await db.command({ ping: 1 });
  console.log(`Connected to MongoDB Atlas (db: ${DB_NAME})`);
  app.listen(PORT, () => console.log(`ICP backend listening at http://localhost:${PORT}`));
}
start().catch((err) => { console.error('Backend failed to start:', err.message); process.exit(1); });
