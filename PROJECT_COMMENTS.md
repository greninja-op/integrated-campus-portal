# Project Change Log

This document tracks all changes made to the ICP (Integrated Campus Portal) project.

---

## 📅 November 20, 2025

### 1. Database Setup & User Population
**Request:** "check the db. and check if all are perfect. all students and teachers and admin is there"

**Changes Made:**
- **Database**: Created and populated initial user data
- **Files Changed:**
  - `ICP/database/seeds/populate_users.sql` (Created)
  - `ICP/backend/fix_admin_password.php` (Created)

**What Changed:**
- Created SQL seed file with 1 admin, 15 teachers (5 per department), and 15 students (5 per department)
- Departments: BCA, BBA, B.Com
- Fixed password hashing issue - admin credentials set to:
  - Username: `admin`
  - Password: `admin123`

---

### 2. Docker Hub Image Push
**Request:** "now push this to dockerhub. create new repo. it should be private. remember we are in dev stage only."

**Changes Made:**
- **DevOps**: Pushed Docker images to Docker Hub
- **Files Changed:**
  - `ICP/scripts/push-to-dockerhub.bat` (Created)
  - `ICP/scripts/push-to-dockerhub.sh` (Created)
  - `ICP/DOCKERHUB_SETUP.txt` (Created)

**What Changed:**
- Tagged and pushed images:
  - `greninjaop/icp-backend:dev`
  - `greninjaop/icp-frontend:dev`
- Created scripts to automate Docker Hub push with API integration
- Note: Repositories need to be manually set to private on Docker Hub

---

### 3. GitHub Repository Setup
**Request:** "now push to github. https://github.com/greninja-op/integrated-campus-portal.git this repo. no history or anything full fresh and no commit messages. push to new branch called dev and make that default and keep the main branch not default but push that branch also."

**Changes Made:**
- **Git**: Initialized repository and pushed to GitHub
- **Branches Created:**
  - `dev` branch (pushed first)
  - `main` branch (pushed second)

**What Changed:**
- Single commit with message "init"
- All 224 files committed
- Both branches pushed to remote
- Note: Default branch needs to be changed to `dev` manually on GitHub settings

---

### 4. Semester-Based System Implementation
**Request:** "well there is a big problem with our teachers assigning to a subject or a department because while the time period of each semester is 6 months..."

**Changes Made:**
- **Database**: Implemented semester-based teacher-subject assignments
- **Files Changed:**
  - `ICP/database/migrations/04_semester_based_assignments.sql` (Created)

**What Changed:**
- Created `teacher_subjects` table with semester tracking
- Added `semester_start_date` and `last_semester_update` columns to students table
- Created stored procedure `progress_students_semester()` for automatic semester progression
- Created event scheduler to auto-progress students every 6 months
- System now supports:
  - Teachers assigned to subjects (which have semester info)
  - Students auto-progress through semesters
  - Data is semester-specific (marks, attendance)

---

### 5. Complete Subject Curriculum Addition
**Request:** "check the course title folder since there i have given all the details for these course bba, bca, bcom"

**Changes Made:**
- **Database**: Added all subjects for all departments and semesters
- **Files Changed:**
  - `ICP/database/seeds/11_all_subjects.sql` (Created)

**What Changed:**
- Added complete curriculum:
  - **BCA**: 5 subjects per semester × 6 semesters = 30 subjects
  - **BBA**: 5-7 subjects per semester × 6 semesters = 35 subjects
  - **B.Com**: 5-6 subjects per semester × 6 semesters = 35 subjects
- Each subject has: code, name, credit hours, department, semester
- Removed Software Lab subjects (BCA106, BCA206, etc.) as they are practical exams, not separate subjects

---

### 6. Teacher Subject Assignment Feature
**Request:** "remember while we add the student and a teacher or a course from the admin panel where information should be captured from that form in order to assign the teacher and student but for teachers there is something missing..."

**Changes Made:**
- **Frontend**: Added subject assignment section to teacher form
- **Backend**: Added API endpoint for fetching subjects
- **Files Changed:**
  - `ICP/frontend/src/pages/admin/AdminTeachers.jsx` (Modified)
  - `ICP/frontend/src/services/api.js` (Modified)

**What Changed:**
- Added "Assign Subjects" section in teacher add/edit form
- Shows all subjects for selected department
- Displays subjects grouped by semester with checkboxes
- Shows subject code and semester info
- Added `getAllSubjects()` API method
- Teachers can now be assigned to multiple subjects across different semesters

**UI Changes:**
- New section appears below "Phone Number" field in teacher form
- Checkbox list with subject details
- Counter showing selected subjects
- Auto-filters subjects by department

---

### 7. Student Form Autofill Prevention
**Request:** "well that works but the admin panel username and pass is by default is given in the form fill section for students"

**Changes Made:**
- **Frontend**: Enhanced autofill prevention in student form
- **Files Changed:**
  - `ICP/frontend/src/pages/admin/AdminStudents.jsx` (Modified)

**What Changed:**
- Added "Clear Form" button at top of student form
- Enhanced autocomplete attributes (`new-username`, `new-password`)
- Added `data-form-type="other"` attribute
- Fields start as readonly and become editable on focus
- Workaround: Users can click "Clear Form" button or clear browser saved passwords

---

### 8. UI Cleanup - Remove Department Filter
**Request:** "yet i dont see the clear button but do one thing remove this section under neet couse i think its not really efficient..."

**Changes Made:**
- **Frontend**: Removed redundant department filter dropdown
- **Files Changed:**
  - `ICP/frontend/src/pages/admin/AdminTeachers.jsx` (Modified)

**What Changed:**
- Removed department filter dropdown from teacher list
- Kept only the search bar for filtering teachers
- Cleaner UI - no duplicate filtering options

**UI Changes:**
- Before: Had department dropdown + search bar
- After: Only search bar remains


