# AI Memory - ICP Project Context

**Purpose**: This file serves as persistent memory for AI assistants working on this project. Read this file to understand the project state, development patterns, user preferences, and ongoing work.

---

## Project Overview

**Name**: ICP (Integrated Campus Portal)  
**Type**: Enterprise university management system  
**Stack**: React 19 + Vite (frontend), PHP 8.2 + Nginx (backend), MySQL 8.0 (database), Docker  
**Architecture**: Monolithic with separate frontend/backend, JWT authentication, role-based access control

### Core Functionality
- Student enrollment and profile management
- Attendance tracking (subject-wise, date-wise)
- Marks/grades management with GPA/CGPA calculation
- Fee management with multiple payment methods (QR, Card, UPI)
- Study materials upload/download system with exam type categorization
- Notice board with priority levels and image support
- PDF generation for receipts, ID cards, performance reports

### User Roles
1. **Students**: View marks, attendance, materials, notices, manage fee payments
2. **Teachers**: Mark attendance, enter marks, upload materials, view student lists
3. **Admins**: Full system management, user CRUD, fee configuration, reports

### Departments & Programs
- **BCA** (Bachelor of Computer Applications) - 6 semesters, 30 subjects
- **BBA** (Bachelor of Business Administration) - 6 semesters, 35 subjects
- **B.Com** (Bachelor of Commerce) - 6 semesters, 35 subjects

---

## Development History & Key Changes

### November 20, 2025 - Initial Setup & Core Features

#### Database Setup & User Population
- Created initial database schema with all core tables
- Populated with 1 admin, 15 teachers (5 per department), 15 students (5 per department)
- Fixed password hashing - admin credentials: username `admin`, password `admin123`
- Created seed file: `database/seeds/populate_users.sql`

#### Docker Hub Integration
- Pushed Docker images to Docker Hub (private repos)
- Images: `greninjaop/icp-backend:dev`, `greninjaop/icp-frontend:dev`
- Created automation scripts: `scripts/push-to-dockerhub.bat`, `scripts/push-to-dockerhub.sh`
- Note: Repositories need manual privacy setting on Docker Hub

#### GitHub Repository Setup
- Initialized Git repository with single "init" commit
- Pushed to: https://github.com/greninja-op/integrated-campus-portal.git
- Created `dev` branch (should be default) and `main` branch
- All 224 files committed without history

#### Semester-Based System Implementation
**Problem**: Teachers needed to be assigned to subjects per semester, students needed auto-progression
**Solution**: 
- Created `teacher_subjects` table linking teachers to subjects (subjects already have semester info)
- Added `semester_start_date` and `last_semester_update` to students table
- Created stored procedure `progress_students_semester()` for auto-progression every 6 months
- Created event scheduler to run progression daily
- Migration: `database/migrations/04_semester_based_assignments.sql`

#### Complete Subject Curriculum Addition
- Added all subjects from course title documents in `COUSE TTLE/` folder
- **BCA**: 30 subjects (5 per semester × 6 semesters)
- **BBA**: 35 subjects (5-7 per semester × 6 semesters)
- **B.Com**: 35 subjects (5-6 per semester × 6 semesters)
- Each subject has: code, name, credit hours, department, semester
- Removed Software Lab subjects (practical exams, not separate subjects)
- Seed file: `database/seeds/11_all_subjects.sql`

#### Teacher Subject Assignment Feature
**Problem**: Admin panel needed way to assign teachers to subjects when creating/editing teachers
**Solution**:
- Added "Assign Subjects" section to teacher form in `AdminTeachers.jsx`
- Shows all subjects for selected department grouped by semester
- Checkbox list with subject code and semester info
- Added `getAllSubjects()` API method to `services/api.js`
- Teachers can be assigned to multiple subjects across semesters

#### Student Form Autofill Prevention
**Problem**: Browser autofill was populating admin credentials in student form
**Solution**:
- Enhanced autocomplete attributes (`new-username`, `new-password`)
- Added `data-form-type="other"` attribute
- Fields start readonly, become editable on focus
- Added "Clear Form" button (later removed)

#### UI Cleanup - Remove Department Filter
- Removed redundant department filter dropdown from teacher list
- Kept only search bar for filtering teachers
- Cleaner UI without duplicate filtering options

### November 21, 2025 - UI Enhancements & Attendance System

#### CustomAlert Component Redesign
**Request**: "pls make another design for this alert"
**Changes**:
- Complete redesign with gradient-based color schemes
- Added decorative gradient top bar
- Animated icon with pulsing ring effect
- Message in bordered, colored container
- Spring animations for smooth entrance/exit
- "Got it" button with arrow icon and hover effects
- Better dark mode support
- Click outside to close functionality
- Gradient backgrounds: emerald (success), rose (error), amber (warning), blue (info)
- File: `frontend/src/components/CustomAlert.jsx`

#### Teacher Profile Picture Loading
**Problem**: Profile pictures not loading in teacher dashboard
**Solution**:
- Created `/teacher/get_profile.php` endpoint returning complete teacher profile
- Added `getTeacherProfile()` method to API service
- Updated TeacherDashboard to fetch and display profile pictures in header and welcome card
- Profile images load from `http://localhost:8080{profile_image}` path
- Fallback to icon if no image uploaded
- Files: `backend/api/teacher/get_profile.php`, `frontend/src/pages/TeacherDashboard.jsx`

#### Teacher Attendance System Overhaul
**Problem**: Multiple issues with attendance marking - showing all subjects, date picker issues, data not persisting
**Solution**:

**Backend Fixes**:
- Modified `get_assigned_subjects.php` to query `teacher_subjects` table
- Added semester filter support
- Fixed attendance data format handling (accepts both object and array formats)
- Restricted attendance marking to today's date only
- Fixed persistence with ON DUPLICATE KEY UPDATE
- File: `backend/api/teacher/mark_attendance.php`

**Frontend Features**:
- Removed student count from subject cards
- Added semester filter dropdown (1-6 + All Semesters)
- Only shows subjects assigned to logged-in teacher
- Removed date picker - always uses today's date
- Fixed attendance submission format
- Attendance now persists and shows existing records
- Uses new CustomAlert component
- No default selection - teachers must explicitly mark each student
- File: `frontend/src/pages/TeacherAttendance.jsx`

**Business Rules Enforced**:
- Teachers can only see their assigned subjects
- Can only mark attendance for today
- Cannot edit past or future dates
- Must mark all students before confirming
- Attendance persists in database

#### Student Attendance Viewing System
**Request**: Implement student attendance viewing with graphs and percentages
**Solution**:

**Backend Features**:
- Created comprehensive student attendance API with two view modes
- **Daily View**: Day-by-day attendance for current and previous month only
- **Summary View**: Subject-wise statistics for all past months (before current-1 month)
- Smart date filtering based on current month
- Semester-based filtering
- File: `backend/api/student/get_attendance.php`

**Frontend Features**:
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
- Color-coded status indicators (green=present, red=absent, yellow=late, blue=excused)
- File: `frontend/src/pages/StudentAttendance.jsx`

**Data Access Rules**:
- Current semester: Daily view for current & previous month
- Past semesters: Only summary view with graphs
- Automatic restriction prevents viewing old daily data
- Students can view detailed records for recent months
- Historical data shown as graphs and percentages

#### Attendance Selection Behavior Fix
**Problem**: Present button was preselected by default
**Solution**:
- Removed default "present" selection for students
- Students now start with no selection (neutral state)
- Added yellow border for unmarked students
- Added warning message showing count of unmarked students
- Submit button disabled until all students are marked
- Only loads existing attendance status if previously saved
- Forces teachers to make explicit attendance decisions

#### Button Animation Restoration
**Request**: "PREVIOUSLY U HAD ADDED AN ANIMATION TO THE CHECK SYMBLE AND THE CROSS SYMBOLE BRING IT BACK"
**Solution**:
- **Present Button Animation**: Check icon scales up (1 → 1.3 → 1), wiggles with rotation (0° → 10° → -10° → 0°), 0.5s duration
- **Absent Button Animation**: X icon scales up (1 → 1.3 → 1), full 360° rotation, 0.5s duration
- Animations trigger when button is clicked/selected
- Smooth motion using Framer Motion library
- Provides satisfying visual feedback

### November 22-23, 2025 - Materials System & Dashboard Improvements

#### Study Materials System Creation
**Problem**: No system for uploading/viewing study materials
**Solution**:
- Created `study_materials` table with fields: department, semester, subject, material_type, unit, year, file info
- Built upload system for teachers and admins
- Implemented JWT-authenticated view/download endpoints
- Added duplicate detection for question papers
- Files: `backend/api/materials/upload.php`, `backend/api/materials/view.php`, `backend/api/materials/download.php`

#### Exam Type Categorization
**Problem**: Materials needed categorization by exam type
**Solution**:
- Added `exam_type` ENUM field to study_materials table: 'internal_1', 'internal_2', 'semester'
- Updated upload forms to include exam type selection
- Display exam type badges in materials list
- Migration: `database/migrations/06_add_exam_type.sql`
- Files: `frontend/src/pages/AdminUploadMaterials.jsx`, `frontend/src/pages/TeacherUploadMaterials.jsx`

#### Materials Access Control
**Problem**: Students could only see materials from their current semester
**Solution**:
- Removed semester restriction in `get_by_department.php`
- Students can now view ALL materials from their department
- Allows access to previous semester materials for revision
- File: `backend/api/materials/get_by_department.php`

#### File Serving System
**Problem**: Direct file access blocked by CORS
**Solution**:
- Created `view.php` and `download.php` endpoints with proper CORS headers
- JWT authentication via query parameter for direct browser access
- Department verification to ensure students only access their department materials
- Files: `backend/api/materials/view.php`, `backend/api/materials/download.php`

#### Dashboard Attendance Display
**Problem**: User wanted attendance percentage instead of GPA on dashboard
**Solution**:
- Replaced GPA display with attendance percentage calculation
- Added color-coded progress ring (green >75%, yellow 60-75%, red <60%)
- Calculates attendance from all subjects in current semester
- File: `frontend/src/pages/Dashboard.jsx`

#### Notice Image Layout
**Problem**: Notice images not displaying properly
**Solution**:
- Restructured notice cards to display images on RIGHT side
- Fixed flex layout with proper sizing
- Added background styling for image container
- File: `frontend/src/pages/Notice.jsx`

#### GPA Trend Analysis
**Problem**: Analysis page showing future semesters with no data
**Solution**:
- Modified to show only COMPLETED semesters based on student's current semester
- If student in semester 3, only shows semesters 1 and 2
- Prevents empty graphs for future semesters
- File: `frontend/src/pages/Analysis.jsx`

#### Date Picker Restoration
**Problem**: User wanted calendar pickers for some forms but manual inputs for others
**Solution**:
- Created `CalendarDatePicker` component for fee management
- Kept manual date inputs for student registration forms (DOB, joining date)
- Separate components for different use cases
- File: `frontend/src/components/CalendarDatePicker.jsx`

#### Student Management Fixes
**Problem**: Delete functionality not working properly
**Solution**:
- Fixed delete functionality in AdminStudents component
- Maintained debug logging for development troubleshooting
- Ensured proper error handling and user feedback
- File: `frontend/src/pages/admin/AdminStudents.jsx`

#### Parent/Guardian Fields Enhancement
**Problem**: Only one guardian field, needed two parent entries
**Solution**:
- Added parent1 and parent2 fields with relationship type
- Migrated existing guardian data to parent1 fields
- Migration: `database/migrations/05_add_parent_fields.sql`

#### Notice System Enhancement
**Problem**: Notices needed priority levels and better categorization
**Solution**:
- Added `priority` ENUM field: 'low', 'normal', 'high', 'urgent'
- Added `category` ENUM field: 'general', 'academic', 'event', 'exam', 'holiday', 'sports'
- Color-coded priority badges in UI
- Migration: `database/migrations/add_category_priority_to_notices.sql`

---

## Development History & Key Changes



### November 24, 2025 - Current Session

#### AI Memory File Creation
**Request**: Create comprehensive memory file for AI context transfer between sessions/models
**Solution**:
- Created `AI_MEMORY.md` with complete project context
- Includes all development history, user preferences, code patterns
- Documents communication style and decision-making patterns
- Enables seamless context transfer when switching AI models or systems

---

## User Communication Style & Preferences

### How User Communicates
- **Casual, conversational tone** - uses lowercase, minimal punctuation
- **Direct and brief** - gets straight to the point
- **Assumes context** - refers to "that thing", "the file", "u know what i mean"
- **Typos are common** - "rigth" instead of "right", "oftenly" instead of "often"
- **Uses abbreviations** - "u" for "you", "ur" for "your"

### User Expectations from AI
1. **Understand context quickly** - don't ask obvious questions
2. **Be concise** - no lengthy explanations unless asked
3. **Show, don't tell** - implement first, explain if needed
4. **Remember decisions** - don't suggest things already rejected
5. **Adapt to style** - match the casual, direct communication
6. **No unnecessary docs** - only create markdown files when explicitly requested

### Development Preferences
- **Minimal code** - write only what's needed, avoid over-engineering
- **Quick iterations** - make changes fast, test, adjust
- **Keep existing patterns** - follow established code structure
- **Debug logging** - maintain console.log statements for troubleshooting
- **Visual feedback** - users like color coding, animations, clear UI states

---

## Current System State

### Database Schema (Complete)

**Core Tables**:
- `users` - Authentication (username, password_hash, role, email, status, last_login)
- `sessions` - Academic sessions/years (session_name, start_year, end_year, is_active)
- `students` - Student profiles with:
  - Basic info: student_id, first_name, last_name, date_of_birth, gender, phone, address
  - Academic: enrollment_date, session_id, semester, department, program, batch_year
  - Parent info: parent1_name, parent1_phone, parent1_relationship, parent2_name, parent2_phone, parent2_relationship
  - Semester tracking: semester_start_date, last_semester_update
  - Profile: profile_image
- `teachers` - Teacher profiles with:
  - Basic info: teacher_id, first_name, last_name, date_of_birth, gender, phone, address
  - Professional: joining_date, department, designation, qualification, specialization, experience_years
  - Profile: profile_image
- `admins` - Admin profiles (admin_id, first_name, last_name, phone, designation, permissions JSON)
- `subjects` - Course catalog (subject_code, subject_name, credit_hours, department, semester, description, is_active)
- `teacher_subjects` - Teacher-subject assignments (teacher_id, subject_id, is_active, assigned_date)
- `semesters` - Semester periods (semester_number, semester_name, start_date, end_date, session_id, is_active)

**Academic Data Tables**:
- `marks` - Student marks (student_id, subject_id, session_id, semester, internal_marks, external_marks, total_marks, grade_point, letter_grade, entered_by)
- `attendance` - Daily attendance (student_id, subject_id, session_id, attendance_date, status: present/absent/late/excused, marked_by)

**Financial Tables**:
- `fees` - Fee structure (fee_type, fee_name, amount, semester, department, program, session_id, due_date, late_fine_per_day, max_late_fine)
- `payments` - Payment transactions (student_id, fee_id, amount_paid, late_fine, total_amount, payment_date, payment_method: cash/card/online/cheque/other, transaction_id, receipt_number, status, processed_by)

**Content Tables**:
- `study_materials` - Uploaded files (department, semester, subject, material_type, unit, year, exam_type: internal_1/internal_2/semester, description, file_name, file_path, file_url, file_size, uploaded_by)
- `notices` - Notice board (title, content, type: general/academic/exam/event/holiday/sports, target_audience: all/students/teachers/staff, department, semester, category, priority: low/normal/high/urgent, attachment_url, is_active, expiry_date, created_by)

**Database Features**:
- InnoDB engine with foreign key constraints
- UTF-8 (utf8mb4) character set
- Indexed queries for performance
- Stored procedure: `progress_students_semester()` - Auto-progresses students every 6 months
- Event scheduler: `auto_progress_semesters` - Runs daily to check semester progression

### API Structure (Complete)
```
backend/api/
├── auth/
│   ├── login.php - User authentication, JWT token generation
│   ├── logout.php - Token invalidation
│   └── verify.php - Token verification
├── student/
│   ├── get_profile.php - Student profile data
│   ├── get_marks.php - Marks/grades by semester
│   ├── get_attendance.php - Attendance (daily/summary views)
│   ├── get_fees.php - Fee structure and payment status
│   └── get_subjects.php - Enrolled subjects
├── teacher/
│   ├── get_profile.php - Teacher profile with assigned subjects
│   ├── get_assigned_subjects.php - Subjects assigned to teacher (with semester filter)
│   ├── mark_attendance.php - Mark student attendance (today only)
│   ├── get_students_by_subject.php - Student list for subject
│   ├── enter_marks.php - Enter/update student marks
│   └── upload_materials.php - Upload study materials
├── admin/
│   ├── students/
│   │   ├── create.php - Add new student
│   │   ├── update.php - Update student info
│   │   ├── delete.php - Delete student
│   │   └── get_all.php - List all students
│   ├── teachers/
│   │   ├── create.php - Add new teacher
│   │   ├── update.php - Update teacher info
│   │   ├── delete.php - Delete teacher
│   │   └── get_all.php - List all teachers
│   ├── subjects/
│   │   ├── create.php - Add new subject
│   │   ├── update.php - Update subject
│   │   ├── delete.php - Delete subject
│   │   └── get_all.php - List all subjects
│   ├── fees/
│   │   ├── create.php - Create fee structure
│   │   ├── update.php - Update fees
│   │   └── get_all.php - List fee structures
│   └── dashboard_stats.php - Admin dashboard statistics
├── materials/
│   ├── upload.php - Upload study materials (teachers/admins)
│   ├── get_by_department.php - Get materials by department (all semesters)
│   ├── view.php - View file with JWT auth
│   └── download.php - Download file with JWT auth
├── notices/
│   ├── create.php - Create new notice
│   ├── get_all.php - Get all notices (filtered by role)
│   ├── update.php - Update notice
│   └── delete.php - Delete notice
└── payments/
    ├── process.php - Process payment
    ├── generate_receipt.php - Generate PDF receipt
    └── get_history.php - Payment history
```

**API Conventions**:
- All endpoints return JSON: `{ success: bool, data: {}, message: string }`
- Authentication via JWT in Authorization header: `Bearer <token>`
- File downloads use token as query parameter: `?token=<jwt>`
- CORS headers included for cross-origin requests
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- Prepared statements (PDO) for SQL injection prevention

### Frontend Structure (Complete)

**Student Pages** (`frontend/src/pages/`):
- `Dashboard.jsx` - Main dashboard with attendance percentage, quick stats
- `Analysis.jsx` - GPA trends, grade distribution (completed semesters only)
- `StudentAttendance.jsx` - Attendance viewing (daily/summary modes with charts)
- `StudentMarks.jsx` - Marks/grades by semester
- `StudentMaterials.jsx` - Study materials browser (all department materials)
- `Notice.jsx` - Notice board with priority badges and images
- `Fees.jsx` - Fee structure and payment management
- `Profile.jsx` - Student profile with edit capability

**Teacher Pages** (`frontend/src/pages/`):
- `TeacherDashboard.jsx` - Teacher dashboard with profile picture, quick stats
- `TeacherAttendance.jsx` - Mark attendance (today only, assigned subjects, semester filter)
- `TeacherMarks.jsx` - Enter/update student marks
- `TeacherStudentList.jsx` - View students by subject
- `TeacherUploadMaterials.jsx` - Upload study materials with exam type
- `TeacherViewMaterials.jsx` - View uploaded materials
- `TeacherNotice.jsx` - Create/manage notices

**Admin Pages** (`frontend/src/pages/admin/`):
- `AdminDashboard.jsx` - Admin dashboard with system statistics
- `AdminStudents.jsx` - Student management (CRUD, search, profile images)
- `AdminAddStudent.jsx` - Add new student form
- `AdminTeachers.jsx` - Teacher management (CRUD, subject assignment)
- `AdminAddTeacher.jsx` - Add new teacher form with subject selection
- `AdminSubjects.jsx` - Subject management
- `AdminFees.jsx` - Fee structure management with CalendarDatePicker
- `AdminPayments.jsx` - Payment processing and history
- `AdminUploadMaterials.jsx` - Upload study materials
- `AdminNotices.jsx` - Notice management with priority and category

**Reusable Components** (`frontend/src/components/`):
- `Navigation.jsx` - Role-based navigation menu with dark mode toggle
- `CustomAlert.jsx` - Animated alert with gradient backgrounds (success/error/warning/info)
- `CustomSelect.jsx` - Styled select dropdown with dark mode
- `ImageCropper.jsx` - Image cropping for profile pictures
- `ThemeToggle.jsx` - Dark/light mode toggle switch
- `CalendarDatePicker.jsx` - Calendar-based date picker for fee management
- `AnimatedDatePicker.jsx` - Animated date picker component
- `PageTransition.jsx` - Page transition animations
- `ProtectedRoute.jsx` - Route protection based on authentication

**Services** (`frontend/src/services/`):
- `api.js` - Centralized API service with methods for all endpoints

**Utilities** (`frontend/src/utils/`):
- `gradeCalculator.js` - GPA/CGPA calculation logic
- `receiptGenerator.js` - Client-side PDF receipt generation

### Authentication Flow
1. User logs in with username/password → `auth/login.php`
2. Backend validates credentials, generates JWT token with user data (id, username, role)
3. Token stored in localStorage on frontend
4. All API calls include token in Authorization header: `Bearer <token>`
5. Backend verifies token with `verifyAuth()` function from `includes/auth.php`
6. Role-based access control with `checkRole()` function
7. File downloads use token as query parameter for direct browser access: `?token=<jwt>`
8. Token blacklist for logout functionality
9. Token expiration: 24 hours (configurable in `config/jwt.php`)

### Default Credentials
- **Admin**: username `admin`, password `admin123`
- **Teachers**: username format `teacher{1-15}`, password `password123`
- **Students**: username format `student{1-15}`, password `password123`

---

## Known Issues & Workarounds

### Issue 1: CORS for File Serving
**Problem**: Direct file access blocked by CORS  
**Solution**: Created view.php and download.php endpoints with proper CORS headers and JWT verification  
**Files**: `backend/api/materials/view.php`, `backend/api/materials/download.php`

### Issue 2: Semester Access Restriction
**Problem**: Students couldn't see materials from other semesters  
**Solution**: Removed semester check in get_by_department.php - now shows all department materials  
**Reason**: Students need access to previous semester materials for revision  
**File**: `backend/api/materials/get_by_department.php`

### Issue 3: Date Picker Consistency
**Problem**: User wanted calendar pickers but also manual inputs  
**Solution**: CalendarDatePicker for fee management, manual inputs for student DOB/joining dates  
**Files**: `frontend/src/components/CalendarDatePicker.jsx`, `frontend/src/pages/admin/AdminAddStudent.jsx`

### Issue 4: Dashboard GPA Display
**Problem**: User wanted attendance instead of GPA on dashboard  
**Solution**: Replaced GPA with attendance percentage and color-coded progress ring  
**File**: `frontend/src/pages/Dashboard.jsx`

### Issue 5: Browser Autofill in Forms
**Problem**: Browser autofilling admin credentials in student forms  
**Solution**: Enhanced autocomplete attributes, readonly fields until focus  
**Note**: Not fully preventable - users can clear browser saved passwords  
**File**: `frontend/src/pages/admin/AdminStudents.jsx`

### Issue 6: Attendance Default Selection
**Problem**: Present button was preselected by default  
**Solution**: No default selection, yellow border for unmarked students, submit disabled until all marked  
**File**: `frontend/src/pages/TeacherAttendance.jsx`

### Issue 7: Profile Pictures Not Loading
**Problem**: Teacher profile pictures not showing in dashboard  
**Solution**: Created dedicated get_profile.php endpoint with profile_image field  
**Files**: `backend/api/teacher/get_profile.php`, `frontend/src/pages/TeacherDashboard.jsx`

### Issue 8: Analysis Page Empty Graphs
**Problem**: Showing future semesters with no data  
**Solution**: Only show completed semesters based on student's current semester  
**File**: `frontend/src/pages/Analysis.jsx`

---

## Current Work & Next Steps

### What We're Currently Doing (November 24, 2025)
- System is stable with all core features working
- All major bugs fixed
- Ready for new feature requests or improvements
- Documentation complete with AI_MEMORY.md for context transfer

### Completed Features ✅
- ✅ User authentication with JWT and role-based access
- ✅ Student management (CRUD, profile pictures, parent info)
- ✅ Teacher management (CRUD, subject assignment, profile pictures)
- ✅ Subject management with semester-based curriculum
- ✅ Attendance system (marking for teachers, viewing for students with charts)
- ✅ Marks/grades system with GPA/CGPA calculation
- ✅ Study materials system with exam type categorization
- ✅ Notice board with priority levels and images
- ✅ Fee management and payment processing
- ✅ Dashboard with attendance percentage display
- ✅ Analysis page with GPA trends and grade distribution
- ✅ Dark mode support across all pages
- ✅ Responsive design for mobile/tablet/desktop
- ✅ PDF generation for receipts
- ✅ Image cropping for profile pictures
- ✅ Semester auto-progression system

### Potential Future Work (Not Started)
- Assignment submission system
- Timetable/schedule management
- Library management integration
- Mobile app development (React Native)
- Email notifications for important events
- SMS integration for attendance alerts
- Parent portal access
- Online exam system
- Video lecture integration
- Discussion forums
- Certificate generation
- Alumni management
- Hostel management
- Transport management
- Canteen management

### Technical Debt & Improvements
- Some API endpoints need better error handling
- Frontend could use more loading states and skeleton screens
- Database queries could be optimized with better indexing
- Need comprehensive testing suite (unit, integration, e2e)
- API documentation (Swagger/OpenAPI)
- Code comments and inline documentation
- Performance monitoring and logging
- Backup and disaster recovery system
- Security audit and penetration testing
- Accessibility improvements (WCAG compliance)
- Internationalization (i18n) support

---

## How to Use This File

### For New AI Assistant
1. Read this entire file first
2. Understand the user's communication style
3. Review the development history to avoid suggesting rejected ideas
4. Check current system state before making changes
5. Follow established patterns and preferences
6. Be concise and direct in responses

### For Continuing Work
1. Update this file when major changes are made
2. Add new issues/workarounds as discovered
3. Document user preferences as they emerge
4. Keep "Current Work" section up to date
5. Remove completed items from "Next Steps"

### Key Reminders
- User types casually with typos - understand intent, not literal text
- Don't create unnecessary documentation files
- Implement first, explain later
- Follow existing code patterns
- Keep debug logging for development
- Test changes before marking complete

---

## Critical Code Patterns

### Backend API Response Format
```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../includes/auth.php';

// Check HTTP method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Verify authentication
$user = verifyAuth();
checkRole($user, ['student', 'teacher', 'admin']);

// Process request
try {
    // Your logic here
    echo json_encode([
        'success' => true,
        'data' => $result,
        'message' => 'Operation successful'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
```

### Frontend API Call Pattern
```javascript
import api from './services/api';

// In component
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await api.getStudentProfile();
        if (response.success) {
            setData(response.data);
        } else {
            setError(response.message);
        }
    } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    fetchData();
}, []);
```

### Authentication Check (Backend)
```php
require_once '../../includes/auth.php';

// Verify user is authenticated
$user = verifyAuth();

// Check if user has required role
checkRole($user, ['student', 'teacher', 'admin']);

// Access user data
$userId = $user['id'];
$userRole = $user['role'];
$username = $user['username'];
```

### Database Query Pattern (Prepared Statements)
```php
require_once '../../config/database.php';

// SELECT query
$stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
$stmt->execute([$studentId]);
$student = $stmt->fetch(PDO::FETCH_ASSOC);

// INSERT query
$stmt = $pdo->prepare("INSERT INTO attendance (student_id, subject_id, attendance_date, status, marked_by) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$studentId, $subjectId, $date, $status, $userId]);

// UPDATE query
$stmt = $pdo->prepare("UPDATE students SET first_name = ?, last_name = ? WHERE id = ?");
$stmt->execute([$firstName, $lastName, $studentId]);

// DELETE query
$stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
$stmt->execute([$studentId]);

// INSERT with duplicate key update
$stmt = $pdo->prepare("INSERT INTO attendance (student_id, subject_id, attendance_date, status, marked_by) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)");
$stmt->execute([$studentId, $subjectId, $date, $status, $userId]);
```

### React Component Pattern
```javascript
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import api from '../services/api';
import CustomAlert from '../components/CustomAlert';

function ComponentName() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.getData();
            if (response.success) {
                setData(response.data);
            } else {
                showAlert('error', response.message);
            }
        } catch (error) {
            showAlert('error', 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {alert.show && (
                <CustomAlert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert({ ...alert, show: false })}
                />
            )}
            {/* Component content */}
        </div>
    );
}

export default ComponentName;
```

### File Upload Pattern (Backend)
```php
// Handle file upload
if (isset($_FILES['file'])) {
    $file = $_FILES['file'];
    $allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (!in_array($file['type'], $allowedTypes)) {
        echo json_encode(['success' => false, 'message' => 'Invalid file type']);
        exit();
    }
    
    $uploadDir = '../../uploads/materials/';
    $fileName = uniqid() . '_' . basename($file['name']);
    $filePath = $uploadDir . $fileName;
    
    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        // File uploaded successfully
        $fileUrl = '/uploads/materials/' . $fileName;
    } else {
        echo json_encode(['success' => false, 'message' => 'Upload failed']);
        exit();
    }
}
```

### Tailwind CSS Pattern (Dark Mode)
```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Title</h1>
    <p className="text-gray-600 dark:text-gray-400">Description</p>
    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
        Click Me
    </button>
</div>
```

---

**Last Updated**: November 24, 2025  
**Project Status**: Active Development  
**System Version**: 1.0 (Production Ready)


---

## Component Logic & Constraints

### Student Components

#### Dashboard.jsx
**Purpose**: Main landing page for students showing key metrics and quick access

**Logic**:
- Fetches student profile on mount
- Calculates attendance percentage from all subjects in current semester
- Displays color-coded progress ring based on attendance
- Shows quick stats: current semester, total subjects, attendance rate
- Provides navigation cards to other sections

**Constraints**:
- Must show ATTENDANCE PERCENTAGE, not GPA (user requirement)
- Color coding: Green (>75%), Yellow (60-75%), Red (<60%)
- Only calculates attendance for current semester
- Progress ring animates on load

**Key Features**:
- Profile picture display with fallback icon
- Welcome message with student name
- Quick action cards (Attendance, Marks, Materials, Fees)
- Responsive grid layout
- Dark mode support

---

#### StudentAttendance.jsx
**Purpose**: View attendance records with daily and summary modes

**Logic**:
- Two view modes: Daily and Summary
- **Daily Mode**:
  - Shows current and previous month only
  - Day-by-day attendance records
  - Pie chart for distribution
  - Stats cards (Total, Present, Absent, Late, Percentage)
- **Summary Mode**:
  - Shows all past months (before current-1 month)
  - Subject-wise breakdown with bar charts
  - Monthly statistics per subject
  - Overall percentage per subject
- Semester filter applies to both modes
- Auto-fetches data on mode/month/semester change

**Constraints**:
- Daily view: ONLY current and previous month (user requirement)
- Summary view: ONLY historical data (not current/previous month)
- Cannot view old daily data - prevents clutter
- Must show graphs and percentages in summary mode
- Color-coded status: Green (present), Red (absent), Yellow (late), Blue (excused)

**Key Features**:
- View mode toggle (Daily/Summary)
- Month selector for daily view
- Semester filter dropdown
- Recharts for data visualization
- Responsive card layouts
- Empty state handling

---

#### StudentMaterials.jsx
**Purpose**: Browse and download study materials

**Logic**:
- Fetches all materials from student's department
- Groups materials by semester
- Filters by material type (Notes, Question Papers, Syllabus)
- Displays exam type badges (Internal 1, Internal 2, Semester)
- Download/view buttons with JWT authentication

**Constraints**:
- Shows ALL materials from department, not just current semester (user requirement)
- Students can access previous semester materials for revision
- Department-based access control (cannot see other departments)
- JWT token required for file access
- File types: PDF, DOC, DOCX, PPT, PPTX

**Key Features**:
- Semester-wise grouping
- Material type filter
- Exam type badges
- File size display
- Upload date and uploader info
- View in browser or download options

---

#### Analysis.jsx
**Purpose**: Display GPA trends and grade distribution

**Logic**:
- Fetches marks for all semesters
- Calculates GPA per semester
- Shows line chart for GPA trend
- Displays grade distribution pie chart
- Shows subject-wise performance

**Constraints**:
- ONLY shows COMPLETED semesters (user requirement)
- If student in semester 3, shows only semesters 1 and 2
- Excludes current and future semesters to prevent empty graphs
- Calculates GPA using grade points from marks table

**Key Features**:
- Semester filter
- GPA trend line chart
- Grade distribution pie chart
- Subject-wise performance cards
- Color-coded grades
- Responsive charts

---

### Teacher Components

#### TeacherDashboard.jsx
**Purpose**: Main landing page for teachers

**Logic**:
- Fetches teacher profile with assigned subjects
- Displays profile picture in header and welcome card
- Shows quick stats: assigned subjects, total students
- Provides navigation to key functions

**Constraints**:
- Must load profile picture from backend (user requirement)
- Fallback to icon if no image
- Shows only assigned subjects count
- Profile picture displays in two places: header (top right) and welcome card

**Key Features**:
- Profile picture display
- Welcome message with teacher name
- Quick action cards (Attendance, Marks, Materials, Students)
- Assigned subjects list
- Dark mode support

---

#### TeacherAttendance.jsx
**Purpose**: Mark student attendance for assigned subjects

**Logic**:
- Fetches only assigned subjects from teacher_subjects table
- Semester filter to show subjects by semester
- Displays students for selected subject
- Loads existing attendance if already marked for today
- Validates all students marked before submission
- Saves attendance with ON DUPLICATE KEY UPDATE

**Constraints**:
- ONLY shows assigned subjects (user requirement)
- Can ONLY mark attendance for TODAY (user requirement)
- NO date picker - always uses current date
- NO default selection - teachers must explicitly mark each student (user requirement)
- Submit button disabled until all students marked
- Yellow border for unmarked students
- Warning message shows count of unmarked students
- Attendance persists in database

**Key Features**:
- Semester filter dropdown (1-6 + All Semesters)
- Subject cards with semester badges
- Student list with attendance buttons
- Present/Absent buttons with animations:
  - Present: Check icon scales and wiggles (0° → 10° → -10° → 0°)
  - Absent: X icon scales and rotates 360°
- Stats display (Total, Present, Absent)
- Unmarked student highlighting
- Confirmation before submit

**Button Animations** (user requirement):
```javascript
// Present button
animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
transition={{ duration: 0.5 }}

// Absent button
animate={{ scale: [1, 1.3, 1], rotate: [0, 360] }}
transition={{ duration: 0.5 }}
```

---

#### TeacherUploadMaterials.jsx
**Purpose**: Upload study materials for students

**Logic**:
- Form with department, semester, subject, material type
- Exam type selection (Internal 1, Internal 2, Semester)
- File upload with validation
- Duplicate detection for question papers
- Saves to backend/uploads/materials/

**Constraints**:
- Must include exam type field (user requirement)
- File types: PDF, DOC, DOCX, PPT, PPTX
- Max file size validation
- Duplicate check for question papers (same dept, semester, subject, year, exam type)
- Replaces existing file if duplicate found

**Key Features**:
- Department dropdown
- Semester selector (1-6)
- Subject input
- Material type: Notes, Question Papers, Syllabus
- Exam type: Internal 1, Internal 2, Semester
- Unit and year fields
- Description textarea
- File upload with progress
- Success/error alerts

---

#### TeacherViewMaterials.jsx
**Purpose**: View uploaded materials

**Logic**:
- Fetches all materials uploaded by teacher
- Groups by semester and material type
- Shows exam type badges
- Provides view/download links

**Constraints**:
- Shows only materials uploaded by logged-in teacher
- Displays exam type for each material (user requirement)
- Color-coded badges for exam types

**Key Features**:
- Semester-wise grouping
- Material type filtering
- Exam type badges (Orange color)
- File info (size, upload date)
- View/download buttons
- Delete option for own uploads

---

### Admin Components

#### AdminStudents.jsx
**Purpose**: Manage student records (CRUD operations)

**Logic**:
- Lists all students with search functionality
- Add/Edit/Delete operations
- Profile picture upload with cropping
- Parent/guardian information (2 entries)
- Form validation before submission

**Constraints**:
- Must have 2 parent/guardian entries (user requirement)
- Each parent has: name, phone, relationship
- Profile picture cropping before upload
- No browser autofill for credentials (attempted fix with autocomplete attributes)
- Delete functionality must work properly (user requirement)
- Debug logging maintained for troubleshooting

**Key Features**:
- Search bar for filtering
- Add student button
- Student cards with profile pictures
- Edit/Delete buttons
- Modal form for add/edit
- Image cropper component
- Parent 1 and Parent 2 sections
- Relationship dropdown: Father, Mother, Guardian, Other
- Form validation
- Success/error alerts

---

#### AdminTeachers.jsx
**Purpose**: Manage teacher records with subject assignment

**Logic**:
- Lists all teachers with search
- Add/Edit/Delete operations
- Subject assignment during creation/editing
- Shows subjects grouped by semester
- Checkbox selection for multiple subjects

**Constraints**:
- Must include subject assignment section (user requirement)
- Shows all subjects for selected department
- Grouped by semester with checkboxes
- Teachers can be assigned to multiple subjects
- NO department filter dropdown (removed per user request)
- Only search bar for filtering

**Key Features**:
- Search bar only (no department filter)
- Add teacher button
- Teacher cards with profile pictures
- Edit/Delete buttons
- Modal form with subject assignment
- "Assign Subjects" section below phone number
- Subjects grouped by semester
- Checkbox list with subject code and name
- Counter showing selected subjects
- Auto-filters subjects by department

---

#### AdminUploadMaterials.jsx
**Purpose**: Admin upload of study materials

**Logic**:
- Same as TeacherUploadMaterials but with admin privileges
- Can upload for any department
- Includes exam type selection

**Constraints**:
- Must include exam type field (user requirement)
- Same file validation as teacher upload
- Duplicate detection for question papers

**Key Features**:
- All features from TeacherUploadMaterials
- Admin can upload for any department
- Same exam type categorization

---

#### AdminFees.jsx
**Purpose**: Manage fee structure

**Logic**:
- Create/edit fee structures
- Set due dates, amounts, late fines
- Department and semester-based fees
- Uses CalendarDatePicker for due dates

**Constraints**:
- Must use CalendarDatePicker for date selection (user requirement)
- Not manual date input like student forms
- Fee structure per department/semester/session

**Key Features**:
- Fee type dropdown
- Amount input
- CalendarDatePicker for due date
- Late fine configuration
- Department and semester filters
- Session selection

---

### Reusable Components

#### CustomAlert.jsx
**Purpose**: Display success/error/warning/info messages

**Logic**:
- Animated modal overlay
- Gradient backgrounds based on type
- Pulsing icon animation
- Auto-dismiss or manual close
- Click outside to close

**Constraints**:
- Must have modern gradient design (user requirement)
- Animated icon with pulse effect
- Spring animations for entrance/exit
- "Got it" button with arrow icon

**Design** (user requirement):
- Success: Emerald gradient
- Error: Rose gradient
- Warning: Amber gradient
- Info: Blue gradient
- Decorative gradient top bar
- Icon scales and rotates on entrance
- Continuous pulse on icon background
- Staggered animations (icon → message → button)

**Animations**:
```javascript
// Icon entrance
animate={{ scale: [0, 1.2, 1], rotate: [0, 360] }}

// Pulse effect
animate={{ scale: [1, 1.1, 1] }}
transition={{ repeat: Infinity, duration: 2 }}
```

---

#### CalendarDatePicker.jsx
**Purpose**: Calendar-based date selection

**Logic**:
- Calendar popup with month/year navigation
- Date selection with visual feedback
- Returns selected date to parent component

**Constraints**:
- Used ONLY for fee management (user requirement)
- NOT used for student DOB or joining dates (those use manual input)
- Different use cases require different components

**Key Features**:
- Calendar grid display
- Month/year navigation
- Selected date highlighting
- Dark mode support
- Smooth animations
- Accessible keyboard navigation

---

#### ImageCropper.jsx
**Purpose**: Crop profile pictures before upload

**Logic**:
- Loads image for cropping
- Allows drag and zoom
- Returns cropped image blob
- Used for student/teacher profile pictures

**Constraints**:
- Must crop to square aspect ratio
- Returns blob for upload
- Cancel option to discard

**Key Features**:
- Drag to reposition
- Zoom slider
- Crop preview
- Confirm/Cancel buttons
- Dark mode support

---

#### ThemeToggle.jsx
**Purpose**: Switch between light and dark mode

**Logic**:
- Toggles dark class on document root
- Saves preference to localStorage
- Loads saved preference on mount
- Animated sun/moon icon

**Constraints**:
- Must persist across page reloads
- Smooth transition between themes
- Icon animation on toggle

**Key Features**:
- Sun/moon icon toggle
- Smooth rotation animation
- localStorage persistence
- Applies to entire app

---

## Business Rules & Constraints Summary

### Attendance System
1. Teachers can ONLY mark attendance for TODAY (no past/future dates)
2. Teachers see ONLY their assigned subjects
3. NO default selection - explicit marking required
4. All students must be marked before submission
5. Students see daily view for current + previous month only
6. Students see summary view for all past months (before current-1)
7. Dashboard shows attendance percentage, NOT GPA

### Materials System
1. Students can view ALL materials from their department (not just current semester)
2. Materials must have exam type: Internal 1, Internal 2, or Semester
3. Duplicate question papers are replaced (same dept, semester, subject, year, exam type)
4. File access requires JWT authentication
5. Department-based access control (students can't see other departments)

### Student Management
1. Must have 2 parent/guardian entries (not just 1)
2. Each parent has name, phone, relationship
3. Profile pictures must be cropped before upload
4. Delete functionality must cascade properly

### Teacher Management
1. Must include subject assignment during creation/editing
2. Teachers can be assigned to multiple subjects
3. Subjects grouped by semester in assignment UI
4. NO department filter dropdown (only search bar)

### Analysis & Dashboard
1. Analysis page shows ONLY completed semesters (not current/future)
2. Dashboard shows attendance percentage with color coding
3. GPA trends exclude empty semesters

### Date Pickers
1. CalendarDatePicker for fee management
2. Manual date input for student DOB and joining dates
3. Different components for different use cases

### UI/UX Requirements
1. CustomAlert must have gradient design with animations
2. Attendance buttons must have scale and rotation animations
3. Dark mode support across all components
4. Responsive design for mobile/tablet/desktop
5. Loading states and error handling
6. Success/error feedback for all operations

### Security Constraints
1. JWT authentication for all API calls
2. Role-based access control (student/teacher/admin)
3. File access requires token verification
4. Department-based access restrictions
5. Prepared statements for SQL injection prevention
6. CORS headers for cross-origin requests

### File Upload Constraints
1. Allowed types: PDF, DOC, DOCX, PPT, PPTX
2. File size validation
3. Unique filenames with uniqid()
4. Stored in backend/uploads/ subdirectories
5. File path validation to prevent directory traversal

---

## User Preferences & Patterns

### What User Likes
- Quick, minimal implementations
- Visual feedback (animations, color coding)
- Practical, working features over perfect code
- Debug logging for troubleshooting
- Responsive, modern UI
- Dark mode support

### What User Dislikes
- Unnecessary documentation files
- Over-engineering
- Default selections (wants explicit user actions)
- Lengthy explanations
- Features that don't work as expected

### Development Style
- Iterate fast, fix issues quickly
- Keep existing patterns
- Don't remove debug logging
- Test changes before marking complete
- Maintain consistency across components
- Follow established code structure

### Communication Patterns
- Casual, direct language
- Assumes context from previous conversations
- Uses abbreviations and typos
- Gets straight to the point
- Expects AI to understand intent
- Prefers action over discussion
