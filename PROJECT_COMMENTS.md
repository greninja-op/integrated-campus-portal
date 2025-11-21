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




---

## 📅 November 21, 2025

### 1. CustomAlert Component Redesign
**Request:** "pls make another design for this alert"

**Changes Made:**
- **Frontend**: Complete redesign of CustomAlert component with modern UI
- **Files Changed:**
  - `ICP/frontend/src/components/CustomAlert.jsx` (Modified)

**What Changed:**
- New gradient-based color schemes for each alert type (success, error, warning, info)
- Added decorative gradient top bar
- Animated icon with pulsing ring effect
- Message displayed in bordered, colored container
- Spring animations for smooth entrance/exit
- "Got it" button with arrow icon and hover effects
- Better dark mode support
- Click outside to close functionality
- Enhanced visual hierarchy with modern design patterns

**UI Improvements:**
- Gradient backgrounds: emerald (success), rose (error), amber (warning), blue (info)
- Animated icon entrance with rotation
- Continuous pulse animation on icon background
- Staggered content animations (icon → message → button)
- Improved accessibility and user feedback

---

### 2. Teacher Profile Picture Loading
**Request:** "well the image that i just changed for this teacher when i loged in with the credentials its not loading the profile picture that i given"

**Changes Made:**
- **Backend**: Created teacher profile API endpoint
- **Frontend**: Updated teacher dashboard to fetch and display profile pictures
- **Files Changed:**
  - `ICP/backend/api/teacher/get_profile.php` (Created)
  - `ICP/frontend/src/services/api.js` (Modified)
  - `ICP/frontend/src/pages/TeacherDashboard.jsx` (Modified)

**What Changed:**
- Created `/teacher/get_profile.php` endpoint that returns complete teacher profile including `profile_image`
- Added `getTeacherProfile()` method to API service
- Updated TeacherDashboard to:
  - Fetch teacher profile on component mount
  - Display profile picture in header (top right)
  - Display profile picture in welcome card
  - Fallback to icon if no image uploaded
- Profile images load from `http://localhost:8080{profile_image}` path

**Technical Details:**
- Profile endpoint includes assigned subjects
- Fetches data from `teachers` and `users` tables with JOIN
- Returns teacher details, user info, and assigned subjects list

---

### 3. Teacher Attendance System Overhaul
**Request:** "moving on to the attendance page in the teachers panel have a number of issues..."

**Changes Made:**
- **Backend**: Fixed attendance APIs to only show assigned subjects
- **Frontend**: Complete rewrite of teacher attendance page
- **Files Changed:**
  - `ICP/backend/api/teacher/get_assigned_subjects.php` (Modified)
  - `ICP/backend/api/teacher/mark_attendance.php` (Modified)
  - `ICP/frontend/src/pages/TeacherAttendance.jsx` (Rewritten)

**What Changed:**

**Backend Fixes:**
- `get_assigned_subjects.php` now queries `teacher_subjects` table to show only assigned subjects
- Added semester filter support
- Fixed attendance data format handling (accepts both object and array formats)
- Restricted attendance marking to today's date only
- Fixed attendance persistence with ON DUPLICATE KEY UPDATE

**Frontend Features:**
- Removed student count from subject cards
- Added semester filter dropdown (1-6 + All Semesters)
- Only shows subjects assigned to logged-in teacher
- Removed date picker - always uses today's date
- Fixed attendance submission format
- Attendance now persists and shows existing records
- Uses new CustomAlert component
- No default selection - teachers must explicitly mark each student

**UI Changes:**
- Subject cards show semester badge instead of student count
- Semester filter in header
- Date banner shows today's date (no picker)
- Clean, modern card-based subject selection
- Improved stats display (Total, Present, Absent)
- Better visual feedback for attendance status

**Business Rules Enforced:**
- Teachers can only see their assigned subjects
- Can only mark attendance for today
- Cannot edit past or future dates
- Must mark all students before confirming
- Attendance persists in database

---

### 4. Student Attendance Viewing System
**Request:** "YES" (to implementing student attendance viewing with graphs and percentages)

**Changes Made:**
- **Backend**: Created comprehensive student attendance API
- **Frontend**: Complete rewrite of student attendance page with graphs
- **Files Changed:**
  - `ICP/backend/api/student/get_attendance.php` (Created)
  - `ICP/frontend/src/services/api.js` (Modified)
  - `ICP/frontend/src/pages/StudentAttendance.jsx` (Rewritten)

**What Changed:**

**Backend Features:**
- Two view modes: `daily` and `summary`
- **Daily View**: 
  - Shows day-by-day attendance for current and previous month only
  - Restricted to prevent viewing old daily data
  - Returns individual attendance records with dates
- **Summary View**:
  - Shows subject-wise statistics for all past months (before current-1 month)
  - Groups data by subject and month
  - Calculates percentages and totals
- Smart date filtering based on current month
- Semester-based filtering

**Frontend Features:**
- **View Mode Toggle**: Switch between Daily and Summary views
- **Daily View**:
  - Month selector (current and previous month only)
  - Stats cards (Total, Present, Absent, Late, Percentage)
  - Pie chart showing attendance distribution
  - Detailed daily records list with dates and status
- **Summary View**:
  - Subject-wise breakdown with bar charts
  - Overall percentage per subject
  - Monthly details cards with statistics
  - Only shows historical data (not current/previous month)
- Semester filter for both views
- Responsive charts using Recharts library
- Modern card-based UI with dark mode support

**Data Access Rules:**
- Current semester: Daily view for current & previous month
- Past semesters: Only summary view with graphs
- Automatic restriction prevents viewing old daily data
- Students can view detailed records for recent months
- Historical data shown as graphs and percentages

**UI Components:**
- Pie chart for attendance distribution
- Bar charts for monthly subject-wise attendance
- Color-coded status indicators (green=present, red=absent, yellow=late, blue=excused)
- Responsive grid layouts
- Smooth animations and transitions

---

### 5. Attendance Selection Behavior Fix
**Request:** "WELL THE PRESENT BUTTON IS PRESELECTED PLS CHANGE IT TO NOTHING BEIGN SELECTED AT THE FIRST PLACE"

**Changes Made:**
- **Frontend**: Changed default attendance behavior to require explicit selection
- **Files Changed:**
  - `ICP/frontend/src/pages/TeacherAttendance.jsx` (Modified)

**What Changed:**
- Removed default "present" selection for students
- Students now start with no selection (neutral state)
- Added yellow border for unmarked students
- Added warning message showing count of unmarked students
- Submit button disabled until all students are marked
- Only loads existing attendance status if previously saved

**UI Improvements:**
- Unmarked students have yellow border and background
- Warning banner shows "X students not marked yet"
- Submit button grayed out and disabled when students unmarked
- Clear visual distinction between marked and unmarked students
- Forces teachers to make explicit attendance decisions

---

### 6. Button Animation Restoration
**Request:** "PREVIOUSLY U HAD ADDED AN ANIMATION TO THE CHECK SYMBLE AND THE CROSS SYMBOLE BRING IT BACK"

**Changes Made:**
- **Frontend**: Restored icon animations for attendance buttons
- **Files Changed:**
  - `ICP/frontend/src/pages/TeacherAttendance.jsx` (Modified)

**What Changed:**
- **Present Button Animation**:
  - Check icon scales up (1 → 1.3 → 1)
  - Wiggles with rotation (0° → 10° → -10° → 0°)
  - 0.5 second duration
- **Absent Button Animation**:
  - X icon scales up (1 → 1.3 → 1)
  - Full 360° rotation
  - 0.5 second duration
- Animations trigger when button is clicked/selected
- Smooth motion using Framer Motion library
- Provides satisfying visual feedback

---

## Summary of November 21, 2025 Changes

**Major Features Implemented:**
1. ✅ Redesigned alert system with modern gradients and animations
2. ✅ Teacher profile picture loading in dashboard
3. ✅ Complete teacher attendance system overhaul
4. ✅ Comprehensive student attendance viewing with graphs
5. ✅ Fixed attendance selection behavior (no default selection)
6. ✅ Restored button animations for better UX

**Key Improvements:**
- Better visual feedback throughout the application
- Enforced business rules for attendance marking
- Smart data filtering based on time periods
- Enhanced user experience with animations
- Improved data visualization with charts
- Better dark mode support across components

**Technical Achievements:**
- Proper API data formatting and validation
- Efficient database queries with date filtering
- Responsive chart implementations
- State management improvements
- Better error handling and user feedback
