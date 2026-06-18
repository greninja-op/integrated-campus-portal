# ICP — Integrated Campus Portal

A university management system for **students, teachers, and admins** across the BCA,
BBA, and B.Com programs. It covers attendance, marks/results, fees & payments, study
materials, notices, and assignments.

> Migrated from the original **PHP + MySQL** stack to **Node/Express + MongoDB**. The old
> PHP backend, MySQL files, and Docker setup have been removed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router 7, Framer Motion, Recharts |
| Backend | Node.js, Express, MongoDB driver |
| Database | MongoDB (Atlas) |
| Auth | JWT (HS256) + bcrypt, role-based access control |

### Dependencies

**Frontend (`frontend/package.json`)**
- `react`, `react-dom` — UI
- `react-router-dom` — routing
- `motion` (Framer Motion) — animations
- `recharts` — attendance/analysis charts
- `jspdf`, `html2canvas` — PDF receipts / report export
- `react-image-crop` — profile image cropping
- `liquid-glass-react` — UI effect
- dev: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`

**Backend (`server/package.json`)**
- `express` — HTTP server/routing
- `mongodb` — Atlas driver
- `jsonwebtoken` — JWT sign/verify
- `bcryptjs` — password hashing/verify (supports `$2y$` hashes)
- `cors` — locked cross-origin access
- `helmet` — security headers
- `express-rate-limit` — login brute-force protection
- `express-async-errors` — async error handling
- `multer` — file uploads (materials, assignments)

---

## Authentication & Security

- **Login** (`POST /api/auth/login.php`) — accepts **username OR email** + password;
  passwords verified with bcrypt. Returns a JWT plus the user profile.
- **Roles** — `student`, `teacher`, `admin`. `staff` is treated as an alias of `teacher`.
  A role mismatch on login is rejected (`403 role_mismatch`).
- **JWT** — HS256, 24h expiry, carries a unique `jti`. Sent as
  `Authorization: Bearer <token>` (or `?token=` for direct file links).
- **Token verification** (`GET /api/auth/verify.php`) — used by the frontend
  `ProtectedRoute` on every guarded page.
- **Logout** (`POST /api/auth/logout.php`) — adds the token's `jti` to a blacklist so it
  can no longer be used (real invalidation, not just client-side).
- **Authorization** — admin-only endpoints enforce `requireRole('admin')`; admins may
  access all resources.
- **Login rate limiting** — 10 requests/min/IP (`429` on exceed).
- **Hardening** — `helmet` security headers, CORS locked to `CORS_ORIGIN`, unknown API
  routes return `404`, central async error handler, optional `trust proxy`.
- **Account status** — inactive accounts are blocked from logging in.

---

## Roles & Pages

Routing is defined in `frontend/src/App.jsx`; each route is wrapped in `ProtectedRoute`
with the allowed role(s).

### Student (`role: student`)
| Route | Page | Purpose |
|---|---|---|
| `/dashboard` | `Dashboard.jsx` | Overview + attendance % ring, quick links, notices |
| `/attendance` | `StudentAttendance.jsx` | Daily & summary attendance with charts |
| `/result` | `Results.jsx` | Current-semester results by exam type |
| `/analysis` | `Analysis.jsx` | GPA trend / performance charts |
| `/subjects` | `Subjects.jsx` | Enrolled subjects |
| `/materials` | `StudentMaterials.jsx` | Browse / view / download study materials |
| `/payments` | `Payments.jsx` | View fees, pay, download receipt |
| `/notice` | `Notice.jsx` | Notice board |

### Teacher (`role: teacher` / `staff`)
| Route | Page | Purpose |
|---|---|---|
| `/teacher/dashboard` | `TeacherDashboard.jsx` | Overview, profile, stats |
| `/teacher/attendance` | `TeacherAttendance.jsx` | Mark attendance (assigned subjects) |
| `/teacher/marks` | `TeacherMarks.jsx` | Enter class-test / internal marks |
| `/teacher/results` | `TeacherViewResults.jsx` | View student results |
| `/teacher/students` | `TeacherStudentList.jsx` | Students in the teacher's department |
| `/teacher/upload-materials` | `TeacherUploadMaterials.jsx` | Upload study materials |
| `/teacher/view-materials` | `TeacherViewMaterials.jsx` | View / delete uploaded materials |
| `/teacher/notices` | `TeacherNotice.jsx` | View notices |

### Admin (`role: admin`)
| Route | Page | Purpose |
|---|---|---|
| `/admin/dashboard` | `AdminDashboard.jsx` | System stats + recent notices |
| `/admin/students` | `AdminStudents.jsx` | Student CRUD |
| `/admin/teachers` | `AdminTeachers.jsx` | Teacher CRUD + subject assignment |
| `/admin/teachers/add` | `AdminAddTeacher.jsx` | Add / edit a teacher |
| `/admin/courses` | `AdminCourses.jsx` | Subjects / course catalog |
| `/admin/fee-management` | `AdminFeeManagement.jsx` | Create fees, view pending payers |
| `/admin/notices` | `AdminNotices.jsx` | Notice CRUD (with images) |
| `/admin/upload-materials` | `AdminUploadMaterials.jsx` | Upload study materials |

### Shared / reusable components (`frontend/src/components/`)
`Navigation`, `ProtectedRoute` (in `App.jsx`), `CustomAlert`, `CustomSelect`,
`ThemeToggle` (dark mode), `ImageCropper`, `CalendarDatePicker` / `AnimatedDatePicker` /
`AssignmentDatePicker` / `FeeDatePicker`, `ConfirmDialog`, `PageTransition`,
`SemesterMarksForm`. Central API client: `frontend/src/services/api.js`; env-driven
config: `frontend/src/config.js`.

---

## Backend Modules & API

Base path: `/api` (served by `server/index.mjs`). Standard envelope:
`{ success, message?, data? }`.

- **Auth** — `auth/login.php`, `auth/verify.php`, `auth/logout.php`, `health`
- **Admin · students** — `admin/students/list|create|update|delete.php`
- **Admin · teachers** — `admin/teachers/list|create|update|delete.php`
- **Subjects** — `admin/subjects/list.php` (open to any authenticated role)
- **Admin · fees** — `admin/fees/create|list|delete|pending_students|send_reminder.php`
- **Notices** — `notices/get_all|create|delete.php`
- **Student** — `student/get_profile|get_marks|get_current_results|get_historical_results|get_attendance|get_fees|get_payments|dashboard_attendance.php`
- **Teacher** — `teacher/get_profile|get_students|get_assigned_subjects|enter_marks|update_marks|get_attendance_report.php`
- **Attendance** — `attendance/get_students|mark|get_student_history.php`
- **Materials** — `materials/get_all|get_by_department|upload|view|download|delete.php` (files under `server/uploads/materials/`, served at `/uploads`)
- **Assignments** — `assignments/get_student_subjects|get_student_assignments|submit|create|get_teacher_assignments|get_subjects_by_semester|get_submissions|review_submission|get_dashboard_notifications.php`
- **Payments** — `payments/process.php`
- **Upload** — `upload/upload_image.php`

> The `.php` suffixes are kept as route paths so the frontend (originally built against
> the PHP backend) works unchanged against the Node API.

### Data model (MongoDB collections)
`users`, `students`, `teachers`, `admins`, `sessions`, `subjects`, `semesters`,
`teacher_subjects`, `marks`, `exam_marks`, `attendance`, `fees`, `payments`,
`study_materials`, `notices`, `fee_notifications`, `assignments`,
`assignment_submissions`. Schema + indexes + seeds live in `database/mongodb/`.

---

## Implemented Features

- ✅ **Authentication** — JWT login (username/email), RBAC, token invalidation, rate limiting
- ✅ **Admin** — student/teacher/subject management; fee creation; notices; dashboards
- ✅ **Marks** — teacher enters class-test/internal marks → student sees them in Results
- ✅ **Attendance** — teacher marks → student daily/summary views with charts
- ✅ **Fees & Payments** — admin creates fees → student pays → recorded with receipt; admin pending list
- ✅ **Study Materials** — upload (file stored on disk) → list → view/download → delete
- ✅ **Assignments** — teacher create (+file) → student submit (+file) → teacher review/accept/reject *(backend + pages implemented; assignment routes are not yet wired into `App.jsx`)*
- ✅ **Notices** — admin create (with image) → role-targeted display
- ✅ **Tests/CI/Deploy** — backend unit tests, GitHub Actions, deployment guide

### Planned / optional hardening (not yet done)
- Wire the assignment pages into `App.jsx` routing
- Object/persistent storage for uploads (`server/uploads/` is ephemeral on some hosts)
- Move the token blacklist to a Mongo TTL collection for multi-instance deployments
- Semester auto-progression (the old MySQL stored procedure) as a scheduled job
- External error monitoring (e.g. Sentry); frontend bundle code-splitting

---

## Getting Started (local)

### 1. Configure environment
```bash
cp server/.env.example server/.env       # set MONGODB_URI, JWT_SECRET, CORS_ORIGIN, ...
cp frontend/.env.example frontend/.env    # optional; defaults to http://localhost:8080
```

### 2. Set up the database (one time)
```bash
cd database/mongodb
npm install
npm run setup        # creates collections, indexes, and seed data on Atlas
# node verify.mjs    # optional: check connection + document counts
```

### 3. Start the backend (port 8080)
```bash
cd server
npm install
npm start            # http://localhost:8080   (health: /api/health)
```

### 4. Start the frontend (port 5173)
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Open **http://localhost:5173** and log in.

---

## Test Credentials

Passwords are `password123` (the primary admin seed uses `admin123`):

| Role | Login |
|---|---|
| Admin | `admin` / `admin123`  ·  or `testadmin@gmail.com` |
| Teacher | `testteacher@gmail.com`  ·  or `teacher{1-5}.{bca\|bba\|bcom}@college.com` |
| Student | `teststudent@gmail.com`  ·  or `student{1-5}.{bca\|bba\|bcom}@college.com` |

---

## Tests & CI

```bash
cd server && npm test     # backend unit tests (Node built-in test runner)
```
`.github/workflows/ci.yml` runs the backend tests and the frontend production build on
pushes/PRs to `dev` / `main`.

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** — MongoDB Atlas + a Node API host + a static
frontend, with required env vars and a post-deploy checklist.

## Project Structure

```
frontend/          React + Vite app (pages, components, services, config)
server/            Node/Express API (index.mjs), lib/, test/, uploads/
database/mongodb/  MongoDB schema.js, seeds, Atlas loader (atlas-setup.mjs), verify.mjs
DEPLOYMENT.md      Deployment guide
AI_MEMORY.md       Project context/history for AI assistants
PROJECT_COMMENTS.md  Detailed change log
```

## Notes

- `server/.env`, `server/uploads/`, and `*/node_modules` are gitignored.
- Default branch: `dev`.

## License

See `LICENSE`.
