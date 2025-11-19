# ICP - Project Structure

Complete overview of the Integrated Campus Portal project structure.

## 📁 Directory Tree

```
ICP/
├── .github/                    # GitHub configuration
│   └── workflows/              # CI/CD workflows
│       └── ci.yml              # Automated testing and deployment
│
├── backend/                    # PHP Backend API
│   ├── api/                    # API endpoints (64 endpoints)
│   │   ├── admin/              # Admin operations
│   │   │   ├── fees/           # Fee management
│   │   │   ├── notices/        # Notice management
│   │   │   ├── payments/       # Payment processing
│   │   │   ├── reports/        # Report generation
│   │   │   ├── semesters/      # Semester management
│   │   │   ├── sessions/       # Session management
│   │   │   ├── students/       # Student CRUD
│   │   │   ├── subjects/       # Subject management
│   │   │   └── teachers/       # Teacher CRUD
│   │   ├── attendance/         # Attendance tracking
│   │   ├── auth/               # Authentication
│   │   ├── materials/          # Study materials
│   │   ├── notices/            # Public notices
│   │   ├── payments/           # Payment operations
│   │   ├── student/            # Student operations
│   │   ├── teacher/            # Teacher operations
│   │   └── upload/             # File uploads
│   │
│   ├── config/                 # Configuration files
│   │   ├── database.php        # Database connection
│   │   └── jwt.php             # JWT configuration
│   │
│   ├── includes/               # Helper functions
│   │   ├── auth.php            # Authentication helpers
│   │   ├── bootstrap.php       # Application bootstrap
│   │   ├── cleanup_temp_files.php
│   │   ├── cors.php            # CORS configuration
│   │   ├── EnvLoader.php       # Environment loader
│   │   ├── functions.php       # Utility functions
│   │   ├── grade_calculator.php # GPA/CGPA calculation
│   │   ├── Logger.php          # Logging system
│   │   ├── pdf_generator.php   # PDF generation
│   │   ├── RateLimiter.php     # Rate limiting
│   │   ├── TokenBlacklist.php  # Token management
│   │   └── validation.php      # Input validation
│   │
│   ├── logs/                   # Application logs
│   │   ├── app-*.log           # Daily logs
│   │   └── error.log           # Error logs
│   │
│   ├── scripts/                # Utility scripts
│   │   ├── add_default_users.php
│   │   ├── fix_system_data.php
│   │   └── update_notices_schema.php
│   │
│   ├── uploads/                # File storage
│   │   ├── assignments/        # Assignment files
│   │   ├── profiles/           # Profile images
│   │   ├── receipts/           # Payment receipts
│   │   └── temp/               # Temporary files
│   │
│   ├── vendor/                 # Composer dependencies
│   │
│   ├── .env                    # Environment variables (not in git)
│   ├── .env.example            # Environment template
│   ├── composer.json           # PHP dependencies
│   ├── composer.lock           # Dependency lock file
│   ├── index.php               # API entry point
│   ├── setup_cleanup_cron.sh   # Cleanup cron (Linux)
│   └── setup_cleanup_task.bat  # Cleanup task (Windows)
│
├── config/                     # Environment configurations
│   ├── development/            # Development settings
│   └── production/             # Production settings
│
├── database/                   # Database management
│   ├── migrations/             # Schema migrations
│   │   ├── 01_add_indexes.sql
│   │   ├── 01_add_notices_and_notifications.sql
│   │   ├── 01_add_teacher_subjects.sql
│   │   ├── 02_add_study_materials.sql
│   │   ├── 03_fix_notices_schema.sql
│   │   ├── add_assignments_tables.sql
│   │   ├── add_category_priority_to_notices.sql
│   │   ├── add_notices_table.sql
│   │   ├── add_student_profile_fields.sql
│   │   └── performance_optimization.sql
│   │
│   ├── seeds/                  # Seed data
│   │   ├── 01_sessions.sql     # Academic sessions
│   │   ├── 02_admin.sql        # Admin users
│   │   ├── 03_teachers.sql     # Teacher data
│   │   ├── 04_students.sql     # Student data
│   │   ├── 05_subjects.sql     # Subject catalog
│   │   ├── 06_marks.sql        # Sample marks
│   │   ├── 07_attendance.sql   # Sample attendance
│   │   ├── 08_fees.sql         # Fee structures
│   │   ├── 09_payments.sql     # Sample payments
│   │   ├── 10_bba_bcom_subjects.sql
│   │   └── README.md
│   │
│   ├── create_materials_table.py
│   ├── create_notices_table.py
│   ├── generate_realistic_data.py
│   ├── requirements.txt        # Python dependencies
│   ├── reset_users.py
│   ├── run_migrations.py       # Migration runner
│   ├── schema.sql              # Main database schema
│   ├── setup_full_system.py    # Complete setup script
│   └── verify_users.py
│
├── docs/                       # Documentation
│   ├── api/                    # API documentation
│   ├── database/               # Database documentation
│   ├── deployment/             # Deployment guides
│   ├── guides/                 # User guides
│   ├── CLEANUP_SUMMARY.txt     # Cleanup history
│   └── INSTALLATION.md         # Installation guide
│
├── frontend/                   # React Frontend
│   ├── dist/                   # Build output
│   │
│   ├── node_modules/           # NPM dependencies
│   │
│   ├── public/                 # Static assets
│   │   └── debug-storage.html
│   │
│   ├── src/                    # Source code
│   │   ├── components/         # Reusable components (8 files)
│   │   │   ├── AnimatedDatePicker.jsx
│   │   │   ├── CustomAlert.jsx
│   │   │   ├── CustomSelect.jsx
│   │   │   ├── ImageCropper.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── PageTransition.jsx
│   │   │   ├── SemesterMarksForm.jsx
│   │   │   └── ThemeToggle.jsx
│   │   │
│   │   ├── pages/              # Page components (18 files)
│   │   │   ├── admin/          # Admin pages
│   │   │   │   ├── AdminCourses.jsx
│   │   │   │   ├── AdminFeeManagement.jsx
│   │   │   │   ├── AdminNotices.jsx
│   │   │   │   ├── AdminStudents.jsx
│   │   │   │   ├── AdminTeachers.jsx
│   │   │   │   └── AdminUploadMaterials.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Analysis.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Notice.jsx
│   │   │   ├── Payments.jsx
│   │   │   ├── Result.jsx
│   │   │   ├── StudentAttendance.jsx
│   │   │   ├── StudentMaterials.jsx
│   │   │   ├── Subjects.jsx
│   │   │   ├── TeacherAttendance.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── TeacherMarks.jsx
│   │   │   ├── TeacherNotice.jsx
│   │   │   ├── TeacherStudentList.jsx
│   │   │   ├── TeacherUploadMaterials.jsx
│   │   │   ├── TeacherViewMaterials.jsx
│   │   │   └── TeacherViewResults.jsx
│   │   │
│   │   ├── services/           # API services
│   │   │   └── api.js          # API client
│   │   │
│   │   ├── utils/              # Utility functions
│   │   │   ├── gradeCalculator.js
│   │   │   └── receiptGenerator.js
│   │   │
│   │   ├── App.jsx             # Main app component
│   │   ├── index.css           # Global styles
│   │   └── main.jsx            # Entry point
│   │
│   ├── .gitignore              # Git ignore rules
│   ├── index.html              # HTML template
│   ├── package.json            # NPM dependencies
│   ├── package-lock.json       # Dependency lock file
│   ├── postcss.config.js       # PostCSS configuration
│   ├── START_DEV_SERVER.ps1    # Dev server (PowerShell)
│   ├── START_SERVER.bat        # Dev server (Windows)
│   ├── tailwind.config.js      # Tailwind configuration
│   └── vite.config.js          # Vite configuration
│
├── scripts/                    # Automation scripts
│   ├── EXPORT_CURRENT_DB.bat   # Database export
│   ├── IMPORT_BACKUP_DB.bat    # Database import
│   ├── SETUP_DATABASE.bat      # Database setup
│   └── START_BACKEND.bat       # Backend startup
│
├── tests/                      # Test suites
│   ├── backend/                # Backend tests
│   ├── frontend/               # Frontend tests
│   └── integration/            # Integration tests
│
├── .editorconfig               # Editor configuration
├── .gitignore                  # Git ignore rules
├── CHANGELOG.md                # Version history
├── CONTRIBUTING.md             # Contribution guidelines
├── LICENSE                     # License file
├── PROJECT_STRUCTURE.md        # This file
└── README.md                   # Main documentation
```

## 📊 Statistics

### Backend
- **Total API Endpoints**: 64
- **Helper Functions**: 12 files
- **Configuration Files**: 2
- **Utility Scripts**: 3

### Frontend
- **React Components**: 34 files
  - Reusable Components: 8
  - Page Components: 18
  - Admin Pages: 6
  - Services: 1
  - Utils: 2
- **Total Lines of Code**: ~15,000+

### Database
- **Tables**: 11
- **Migrations**: 10
- **Seed Files**: 10
- **Python Scripts**: 6

### Documentation
- **Main Docs**: 6 files
- **Subdirectories**: 4
- **Total Pages**: 10+

## 🎯 Key Directories Explained

### `/backend/api/`
Contains all REST API endpoints organized by feature:
- **admin/**: Administrative operations (24 endpoints)
- **student/**: Student-specific operations (9 endpoints)
- **teacher/**: Teacher-specific operations (7 endpoints)
- **auth/**: Authentication (3 endpoints)
- **Common**: Shared operations (21 endpoints)

### `/frontend/src/`
React application source code:
- **components/**: Reusable UI components
- **pages/**: Route-based page components
- **services/**: API integration layer
- **utils/**: Helper functions and utilities

### `/database/`
Database management:
- **schema.sql**: Complete database structure
- **migrations/**: Incremental schema updates
- **seeds/**: Test and sample data

### `/docs/`
Comprehensive documentation:
- **api/**: API endpoint documentation
- **database/**: Schema and relationship docs
- **deployment/**: Production deployment guides
- **guides/**: User and developer guides

## 🔧 Configuration Files

### Root Level
- `.editorconfig`: Code editor settings
- `.gitignore`: Git exclusion rules
- `CHANGELOG.md`: Version history
- `CONTRIBUTING.md`: Contribution guidelines
- `LICENSE`: Software license
- `README.md`: Main documentation

### Backend
- `.env`: Environment variables (not in git)
- `.env.example`: Environment template
- `composer.json`: PHP dependencies

### Frontend
- `package.json`: NPM dependencies
- `vite.config.js`: Build configuration
- `tailwind.config.js`: CSS framework config
- `postcss.config.js`: CSS processing

## 📦 Dependencies

### Backend (PHP)
- **tecnickcom/tcpdf**: PDF generation
- **firebase/php-jwt**: JWT authentication (via manual implementation)

### Frontend (React)
- **react**: 19.0.0
- **react-dom**: 19.0.0
- **react-router-dom**: 7.9.4
- **vite**: 6.0.7
- **tailwindcss**: 3.4.17
- **motion**: 11.15.0
- **liquid-glass-react**: 1.1.1
- **html2canvas**: 1.4.1
- **jspdf**: 3.0.3
- **react-image-crop**: 11.0.10

## 🚀 Entry Points

### Development
- **Backend**: `backend/index.php` (via `php -S localhost:8000`)
- **Frontend**: `frontend/src/main.jsx` (via `npm run dev`)

### Production
- **Backend**: Web server points to `backend/` directory
- **Frontend**: Serve `frontend/dist/` directory

## 📝 Important Files

### Must Configure
1. `backend/.env` - Database and app configuration
2. `frontend/src/services/api.js` - API base URL

### Must Not Delete
1. `database/schema.sql` - Database structure
2. `backend/config/database.php` - DB connection
3. `frontend/src/App.jsx` - Main app component

### Can Customize
1. `frontend/tailwind.config.js` - Theme colors
2. `backend/includes/functions.php` - Helper functions
3. `docs/` - Documentation

## 🔒 Security Sensitive

These directories contain sensitive data:
- `backend/.env` - Never commit to git
- `backend/uploads/` - User uploaded files
- `backend/logs/` - Application logs
- `config/production/` - Production credentials

## 📈 Growth Areas

Directories that will grow over time:
- `backend/api/` - New endpoints
- `frontend/src/pages/` - New features
- `database/migrations/` - Schema updates
- `docs/` - Documentation updates
- `tests/` - Test coverage

## 🎓 Learning Path

Recommended order to explore the codebase:

1. **Start**: `README.md`
2. **Setup**: `docs/INSTALLATION.md`
3. **Database**: `database/schema.sql`
4. **Backend**: `backend/api/auth/login.php`
5. **Frontend**: `frontend/src/pages/Login.jsx`
6. **API Flow**: `frontend/src/services/api.js`
7. **Components**: `frontend/src/components/`
8. **Advanced**: `backend/includes/` helpers

---

**Last Updated**: November 19, 2025
**Version**: 1.0.0
**Maintainer**: ICP Team
