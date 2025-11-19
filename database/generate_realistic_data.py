#!/usr/bin/env python3
"""
Realistic Data Generator for Student Portal
Generates natural, precise data for 1 admin, 100 teachers, and 1000 students
"""

import mysql.connector
import random
from datetime import datetime, timedelta
from faker import Faker

# Initialize Faker with Indian locale
fake = Faker('en_IN')
Faker.seed(42)  # For reproducibility
random.seed(42)

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'root',
    'database': 'studentportal'
}

# Academic configuration
DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical']
SUBJECTS_BY_DEPT = {
    'Computer Science': [
        'Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems',
        'Computer Networks', 'Software Engineering', 'Web Development', 'Machine Learning'
    ],
    'Electronics': [
        'Digital Electronics', 'Analog Circuits', 'Microprocessors', 'Signal Processing',
        'Communication Systems', 'VLSI Design', 'Embedded Systems', 'Control Systems'
    ],
    'Mechanical': [
        'Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing Processes',
        'Heat Transfer', 'Strength of Materials', 'CAD/CAM', 'Automobile Engineering'
    ],
    'Civil': [
        'Structural Analysis', 'Concrete Technology', 'Surveying', 'Geotechnical Engineering',
        'Transportation Engineering', 'Environmental Engineering', 'Hydraulics', 'Construction Management'
    ],
    'Electrical': [
        'Power Systems', 'Electrical Machines', 'Power Electronics', 'Control Systems',
        'Electrical Measurements', 'High Voltage Engineering', 'Renewable Energy', 'Electric Drives'
    ]
}

# Grade distribution (realistic bell curve) - 4.0 scale
GRADE_DISTRIBUTION = {
    'A+': 0.10,  # 10% Outstanding (90-100)
    'A': 0.15,   # 15% Excellent (85-89)
    'A-': 0.15,  # 15% Very Good (80-84)
    'B+': 0.20,  # 20% Good (75-79)
    'B': 0.15,   # 15% Above Average (70-74)
    'B-': 0.10,  # 10% Average (65-69)
    'C+': 0.08,  # 8% Below Average (60-64)
    'C': 0.05,   # 5% Satisfactory (55-59)
    'F': 0.02    # 2% Fail (0-39)
}

GRADE_POINTS = {
    'A+': 4.00, 'A': 3.75, 'A-': 3.50,
    'B+': 3.25, 'B': 3.00, 'B-': 2.75,
    'C+': 2.50, 'C': 2.25, 'C-': 2.00,
    'D': 1.75, 'E': 1.50, 'F': 0.00
}

# Marks ranges for each grade
MARKS_RANGES = {
    'A+': (90, 100), 'A': (85, 89), 'A-': (80, 84),
    'B+': (75, 79), 'B': (70, 74), 'B-': (65, 69),
    'C+': (60, 64), 'C': (55, 59), 'C-': (50, 54),
    'D': (45, 49), 'E': (40, 44), 'F': (0, 39)
}

def hash_password(password):
    """Return pre-computed bcrypt hash for known passwords"""
    # Pre-computed bcrypt hashes (PHP password_hash with bcrypt)
    hashes = {
        'admin123': '$2y$10$cbM10SJLhbwG/rBNA2M6AeVEMa7LiNR1wz6C.VBw9e2xa2paORr7C',
        'teacher123': '$2y$10$P1j12gbDvWIWB5qMwNMV7eGMUYF5wnlDPSe0sfMuec0RKaM7CNw9i',
        'student123': '$2y$10$z8tY.yBnelciPPK3yULHCuEEhIXkmbBs5nai6Z92wgWfrigx2zXnK'
    }
    return hashes.get(password, hashes['student123'])

def get_random_grade():
    """Get a grade based on realistic distribution"""
    rand = random.random()
    cumulative = 0
    for grade, probability in GRADE_DISTRIBUTION.items():
        cumulative += probability
        if rand <= cumulative:
            return grade
    return 'B'

def generate_phone():
    """Generate realistic Indian phone number"""
    prefixes = ['98', '97', '96', '95', '94', '93', '92', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75']
    return f"+91{random.choice(prefixes)}{random.randint(10000000, 99999999)}"

def generate_email(name, role):
    """Generate realistic email"""
    name_part = name.lower().replace(' ', '.')
    if role == 'student':
        domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
        return f"{name_part}{random.randint(1, 999)}@{random.choice(domains)}"
    elif role == 'teacher':
        return f"{name_part}@college.edu.in"
    else:
        return f"{name_part}@admin.college.edu.in"

def connect_db():
    """Connect to database"""
    return mysql.connector.connect(**DB_CONFIG)

def clear_existing_data(cursor):
    """Clear all existing data from tables"""
    print("Clearing existing data...")
    
    tables = [
        'marks', 'attendance', 'payments', 'fees', 'subjects',
        'students', 'teachers', 'admins', 'semesters', 'sessions', 'users'
    ]
    
    cursor.execute('SET FOREIGN_KEY_CHECKS = 0')
    for table in tables:
        cursor.execute(f'TRUNCATE TABLE {table}')
    cursor.execute('SET FOREIGN_KEY_CHECKS = 1')
    
    print("✓ Existing data cleared")

def create_admin(cursor):
    """Create 1 super admin with full permissions"""
    print("\nCreating admin...")
    
    # Admin credentials
    username = 'admin'
    password = 'admin123'
    email = 'admin@college.edu.in'
    first_name = 'System'
    last_name = 'Administrator'
    phone = '+919876543210'
    admin_id = 'ADM001'
    
    # Insert into users table
    cursor.execute("""
        INSERT INTO users (username, password, email, role, status, created_at)
        VALUES (%s, %s, %s, 'admin', 'active', NOW())
    """, (username, hash_password(password), email))
    
    user_id = cursor.lastrowid
    
    # Insert into admins table with full permissions
    permissions = '{"all": true, "users": true, "students": true, "teachers": true, "subjects": true, "marks": true, "attendance": true, "fees": true, "payments": true, "reports": true}'
    
    cursor.execute("""
        INSERT INTO admins (user_id, admin_id, first_name, last_name, phone, designation, permissions, created_at)
        VALUES (%s, %s, %s, %s, %s, 'Super Administrator', %s, NOW())
    """, (user_id, admin_id, first_name, last_name, phone, permissions))
    
    print(f"✓ Admin created: {username} / {password}")
    return user_id

def create_sessions_and_semesters(cursor):
    """Create academic sessions and semesters"""
    print("\nCreating sessions and semesters...")
    
    sessions = []
    current_year = datetime.now().year
    
    # Create 3 academic years
    for i in range(3):
        year = current_year - 2 + i
        session_name = f"{year}-{year+1}"
        start_date = f"{year}-07-01"
        end_date = f"{year+1}-06-30"
        is_active = 1 if i == 2 else 0  # Latest session is active
        
        cursor.execute("""
            INSERT INTO sessions (session_name, start_year, end_year, start_date, end_date, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """, (session_name, year, year+1, start_date, end_date, is_active))
        
        session_id = cursor.lastrowid
        sessions.append(session_id)
        
        # Create 2 semesters per session
        for sem_num in range(1, 3):
            sem_name = f"Semester {sem_num}"
            sem_start = f"{year}-07-01" if sem_num == 1 else f"{year+1}-01-01"
            sem_end = f"{year}-12-31" if sem_num == 1 else f"{year+1}-06-30"
            
            cursor.execute("""
                INSERT INTO semesters (session_id, semester_number, semester_name, start_date, end_date, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (session_id, sem_num, sem_name, sem_start, sem_end, is_active and sem_num == 2))
    
    print(f"✓ Created {len(sessions)} sessions with 6 semesters")
    return sessions

def create_teachers(cursor, count=100):
    """Create realistic teacher profiles"""
    print(f"\nCreating {count} teachers...")
    
    teachers = []
    
    for i in range(count):
        # Generate teacher details
        gender = random.choice(['male', 'female'])
        if gender == 'male':
            name = fake.name_male()
        else:
            name = fake.name_female()
        
        name_parts = name.split()
        first_name = name_parts[0]
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else name_parts[0]
        
        email = generate_email(name, 'teacher')
        phone = generate_phone()
        department = random.choice(DEPARTMENTS)
        qualification = random.choice(['M.Tech', 'Ph.D', 'M.Sc', 'M.E'])
        experience = random.randint(2, 25)
        designation = random.choice(['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer'])
        specialization = random.choice(SUBJECTS_BY_DEPT[department][:3])
        
        # Date of birth (30-60 years old)
        dob = fake.date_of_birth(minimum_age=30, maximum_age=60)
        joining_date = fake.date_between(start_date='-15y', end_date='today')
        
        # Teacher ID
        teacher_id = f"TCH{i+1:04d}"
        
        # Username: first name + last 4 digits of phone
        username = first_name.lower() + phone[-4:]
        password = 'teacher123'
        
        # Insert into users table
        cursor.execute("""
            INSERT INTO users (username, password, email, role, status, created_at)
            VALUES (%s, %s, %s, 'teacher', 'active', NOW())
        """, (username, hash_password(password), email))
        
        user_id = cursor.lastrowid
        
        # Insert into teachers table
        cursor.execute("""
            INSERT INTO teachers (user_id, teacher_id, first_name, last_name, date_of_birth, 
                                 gender, phone, department, designation, qualification, 
                                 specialization, experience_years, joining_date, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (user_id, teacher_id, first_name, last_name, dob, gender, phone, department, 
              designation, qualification, specialization, experience, joining_date))
        
        db_teacher_id = cursor.lastrowid
        teachers.append({
            'id': db_teacher_id,
            'user_id': user_id,
            'name': name,
            'department': department,
            'username': username
        })
        
        if (i + 1) % 20 == 0:
            print(f"  Created {i + 1} teachers...")
    
    print(f"✓ Created {count} teachers")
    return teachers

def create_subjects(cursor, teachers, sessions):
    """Create subjects and assign teachers"""
    print("\nCreating subjects...")
    
    subjects = []
    subject_counter = 1
    
    for dept, subject_list in SUBJECTS_BY_DEPT.items():
        # Get teachers from this department
        dept_teachers = [t for t in teachers if t['department'] == dept]
        
        # Distribute subjects across 6 semesters
        for idx, subject_name in enumerate(subject_list):
            semester = (idx % 6) + 1  # Distribute across semesters 1-6
            
            # Generate unique subject code with global counter
            subject_code = f"{dept[:3].upper()}{subject_counter:03d}"
            subject_counter += 1
            
            # Assign random teacher from department
            teacher = random.choice(dept_teachers)
            credits = random.choice([3, 4])
            
            cursor.execute("""
                INSERT INTO subjects (subject_code, subject_name, credit_hours, department, 
                                    semester, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s, TRUE, NOW())
            """, (subject_code, subject_name, credits, dept, semester))
            
            subjects.append({
                'id': cursor.lastrowid,
                'name': subject_name,
                'code': subject_code,
                'department': dept,
                'credits': credits,
                'semester': semester
            })
    
    print(f"✓ Created {len(subjects)} subjects")
    return subjects

def create_students(cursor, sessions, count=1000):
    """Create realistic student profiles"""
    print(f"\nCreating {count} students...")
    
    students = []
    current_year = datetime.now().year
    
    for i in range(count):
        # Generate student details
        gender = random.choice(['male', 'female'])
        if gender == 'male':
            name = fake.name_male()
        else:
            name = fake.name_female()
        
        name_parts = name.split()
        first_name = name_parts[0]
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else name_parts[0]
        
        email = generate_email(name, 'student')
        phone = generate_phone()
        department = random.choice(DEPARTMENTS)
        program = f"B.Tech in {department}"
        
        # Admission year (spread across 3 years)
        batch_year = current_year - random.randint(0, 2)
        current_semester = min((current_year - batch_year) * 2 + 1, 6)
        
        # Get appropriate session
        session_index = min(current_year - batch_year, len(sessions) - 1)
        session_id = sessions[session_index]
        
        # Generate student ID: DEPT_CODE + YEAR + NUMBER
        dept_code = department[:3].upper()
        student_id = f"{dept_code}{batch_year % 100:02d}{i+1:04d}"
        
        # Username: student ID
        username = student_id.lower()
        password = 'student123'
        
        # Parent details
        guardian_name = fake.name_male()
        guardian_phone = generate_phone()
        guardian_email = generate_email(guardian_name, 'student')
        
        # Address
        address = fake.address().replace('\n', ', ')
        
        # Date of birth (18-22 years old)
        dob = fake.date_of_birth(minimum_age=18, maximum_age=22)
        enrollment_date = f"{batch_year}-07-15"
        
        # Insert into users table
        cursor.execute("""
            INSERT INTO users (username, password, email, role, status, created_at)
            VALUES (%s, %s, %s, 'student', 'active', NOW())
        """, (username, hash_password(password), email))
        
        user_id = cursor.lastrowid
        
        # Insert into students table
        cursor.execute("""
            INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth,
                                 gender, phone, address, enrollment_date, session_id, semester,
                                 department, program, batch_year, guardian_name, guardian_phone,
                                 guardian_email, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (user_id, student_id, first_name, last_name, dob, gender, phone, address,
              enrollment_date, session_id, current_semester, department, program, batch_year,
              guardian_name, guardian_phone, guardian_email))
        
        db_student_id = cursor.lastrowid
        students.append({
            'id': db_student_id,
            'user_id': user_id,
            'student_id': student_id,
            'name': name,
            'department': department,
            'current_semester': current_semester,
            'batch_year': batch_year,
            'session_id': session_id
        })
        
        if (i + 1) % 100 == 0:
            print(f"  Created {i + 1} students...")
    
    print(f"✓ Created {count} students")
    return students

def create_marks_and_attendance(cursor, students, subjects, sessions, teachers):
    """Create marks and attendance records"""
    print("\nGenerating marks and attendance...")
    
    marks_count = 0
    attendance_count = 0
    
    # Get a teacher user_id for marking attendance
    teacher_user_id = teachers[0]['user_id'] if teachers else 1
    
    for student in students:
        # Get subjects for student's department and current semester
        student_subjects = [s for s in subjects 
                          if s['department'] == student['department'] 
                          and s['semester'] <= student['current_semester']]
        
        for subject in student_subjects:
            # Create marks
            grade = get_random_grade()
            marks_range = MARKS_RANGES[grade]
            total_marks = random.randint(marks_range[0], marks_range[1])
            
            # Split into internal (30%) and external (70%)
            internal_marks = round(total_marks * 0.3)
            external_marks = total_marks - internal_marks
            
            cursor.execute("""
                INSERT INTO marks (student_id, subject_id, session_id, semester,
                                 internal_marks, external_marks, total_marks,
                                 grade_point, letter_grade, entered_by, entered_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, (student['id'], subject['id'], student['session_id'], subject['semester'],
                  internal_marks, external_marks, total_marks,
                  GRADE_POINTS[grade], grade, teacher_user_id))
            
            marks_count += 1
            
            # Create attendance records (multiple dates)
            total_classes = random.randint(40, 60)
            attendance_rate = random.uniform(0.60, 0.95)
            
            # Generate attendance for random dates
            for day in range(total_classes):
                attendance_date = datetime.now() - timedelta(days=random.randint(1, 120))
                status = 'present' if random.random() < attendance_rate else random.choice(['absent', 'late'])
                
                try:
                    cursor.execute("""
                        INSERT INTO attendance (student_id, subject_id, session_id, attendance_date,
                                              status, marked_by, marked_at)
                        VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    """, (student['id'], subject['id'], student['session_id'], 
                          attendance_date.date(), status, teacher_user_id))
                    attendance_count += 1
                except:
                    # Skip duplicate dates
                    pass
        
        if (students.index(student) + 1) % 100 == 0:
            print(f"  Processed {students.index(student) + 1} students...")
    
    print(f"✓ Created {marks_count} marks records")
    print(f"✓ Created {attendance_count} attendance records")

def create_fees_and_payments(cursor, students, sessions):
    """Create fee structures and payment records"""
    print("\nGenerating fees and payments...")
    
    fees_count = 0
    payments_count = 0
    receipt_counter = 1
    
    # Fee structure by semester
    base_fee = 50000
    
    for session_id in sessions:
        for semester in range(1, 7):  # 6 semesters
            # Create fee structure
            due_date = datetime.now() + timedelta(days=30)
            
            cursor.execute("""
                INSERT INTO fees (fee_type, fee_name, amount, semester, session_id, due_date,
                                late_fine_per_day, max_late_fine, is_active, created_at)
                VALUES ('tuition', %s, %s, %s, %s, %s, 50, 1000, TRUE, NOW())
            """, (f"Semester {semester} Tuition Fee", base_fee, semester, session_id, due_date))
            
            fee_id = cursor.lastrowid
            fees_count += 1
            
            # Create payments for students
            for student in students:
                # Only create payments for semesters the student has completed or is in
                if semester > student['current_semester']:
                    continue
                
                # 90% students have paid
                if random.random() < 0.90:
                    # Payment timing (determines fine)
                    payment_timing = random.random()
                    late_fine = 0
                    
                    if payment_timing < 0.70:  # 70% pay on time
                        late_fine = 0
                        payment_date = datetime.now() - timedelta(days=random.randint(1, 30))
                    elif payment_timing < 0.90:  # 20% pay late
                        late_fine = random.randint(100, 500)
                        payment_date = datetime.now() - timedelta(days=random.randint(31, 60))
                    else:  # 10% pay very late
                        late_fine = random.randint(500, 1000)
                        payment_date = datetime.now() - timedelta(days=random.randint(61, 90))
                    
                    total_amount = base_fee + late_fine
                    
                    # Payment method
                    payment_method = random.choice(['online', 'cash', 'cheque', 'card'])
                    transaction_id = f"TXN{random.randint(100000, 999999)}" if payment_method == 'online' else None
                    receipt_number = f"RCP{receipt_counter:06d}"
                    receipt_counter += 1
                    
                    cursor.execute("""
                        INSERT INTO payments (student_id, fee_id, amount_paid, late_fine, total_amount,
                                            payment_date, payment_method, transaction_id, receipt_number,
                                            status, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'completed', NOW())
                    """, (student['id'], fee_id, base_fee, late_fine, total_amount,
                          payment_date.date(), payment_method, transaction_id, receipt_number))
                    
                    payments_count += 1
    
    print(f"✓ Created {fees_count} fee structures")
    print(f"✓ Created {payments_count} payment records")

def main():
    """Main execution function"""
    print("=" * 60)
    print("REALISTIC DATA GENERATOR FOR STUDENT PORTAL")
    print("=" * 60)
    print("\nConfiguration:")
    print("  - Admins: 1")
    print("  - Teachers: 100")
    print("  - Students: 1000")
    print("  - Sessions: 3 (with 6 semesters)")
    print("  - Subjects: ~120 (8 per department × 5 departments × 3 sessions)")
    print("\n" + "=" * 60)
    
    conn = None
    cursor = None
    
    try:
        # Connect to database
        print("\nConnecting to database...")
        conn = connect_db()
        cursor = conn.cursor()
        print("✓ Connected to database")
        
        # Clear existing data
        clear_existing_data(cursor)
        
        # Create data
        admin_id = create_admin(cursor)
        sessions = create_sessions_and_semesters(cursor)
        teachers = create_teachers(cursor, 100)
        subjects = create_subjects(cursor, teachers, sessions)
        students = create_students(cursor, sessions, 1000)
        
        # Commit before creating relationships
        conn.commit()
        print("\n✓ Core data committed")
        
        # Create relationships
        create_marks_and_attendance(cursor, students, subjects, sessions, teachers)
        create_fees_and_payments(cursor, students, sessions)
        
        # Final commit
        conn.commit()
        print("\n✓ All data committed successfully")
        
        # Summary
        print("\n" + "=" * 60)
        print("DATA GENERATION COMPLETE")
        print("=" * 60)
        print("\nLogin Credentials:")
        print("  Admin: admin / admin123")
        print("  Teachers: [firstname][last4digits] / teacher123")
        print("  Students: [rollnumber] / student123")
        print("\nDatabase Statistics:")
        cursor.execute("SELECT COUNT(*) FROM users")
        print(f"  Total Users: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM students")
        print(f"  Students: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM teachers")
        print(f"  Teachers: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM subjects")
        print(f"  Subjects: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM marks")
        print(f"  Marks Records: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM attendance")
        print(f"  Attendance Records: {cursor.fetchone()[0]}")
        cursor.execute("SELECT COUNT(*) FROM payments")
        print(f"  Payment Records: {cursor.fetchone()[0]}")
        print("=" * 60)
        
    except mysql.connector.Error as err:
        print(f"\n✗ Database Error: {err}")
        if conn:
            conn.rollback()
    except Exception as e:
        print(f"\n✗ Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("\n✓ Database connection closed")

if __name__ == "__main__":
    main()
