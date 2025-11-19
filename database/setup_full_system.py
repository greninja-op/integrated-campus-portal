import mysql.connector
from mysql.connector import Error
from faker import Faker
import random
import os
from datetime import datetime, timedelta

# Configuration
DB_HOST = 'localhost'
DB_NAME = 'studentportal'
DB_USER = 'root'
DB_PASS = ''

fake = Faker()

def create_connection():
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def execute_file(connection, file_path):
    cursor = connection.cursor()
    with open(file_path, 'r') as f:
        sql_script = f.read()
    
    # Split by semicolon but handle basic splitting
    commands = sql_script.split(';')
    for command in commands:
        if command.strip():
            try:
                cursor.execute(command)
            except Error as e:
                # Ignore duplicate entry errors for seeding
                if e.errno != 1062: 
                    print(f"Error executing command: {e}")
    connection.commit()

def setup_system():
    print("Processing...")
    conn = create_connection()
    if not conn:
        return

    cursor = conn.cursor()

    # 1. Create BBA/BCom Subjects
    execute_file(conn, 'database/seeds/10_bba_bcom_subjects.sql')
    print("subjects created....")

    # 2. Create Teacher Subjects Table
    execute_file(conn, 'database/migrations/01_add_teacher_subjects.sql')
    print("table created.....")

    print("script running....")

    # 3. Clean Database (Order matters due to foreign keys)
    tables = ['teacher_subjects', 'attendance', 'marks', 'payments', 'fees', 'students', 'teachers', 'admins', 'users', 'sessions']
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
    for table in tables:
        cursor.execute(f"TRUNCATE TABLE {table}")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
    
    # 4. Create Session
    cursor.execute("INSERT INTO sessions (session_name, start_date, end_date, is_active) VALUES (%s, %s, %s, %s)",
                   ('2023-2024', '2023-08-01', '2024-05-31', 1))
    session_id = cursor.lastrowid

    # 5. Create Users & Profiles
    departments = ['BCA', 'BBA', 'B.Com']
    
    for dept in departments:
        # Create 5 Teachers per Dept
        teachers_ids = []
        for i in range(5):
            name = f"{dept} Teacher {i+1}"
            email = f"teacher{i+1}.{dept.lower().replace('.', '')}@college.com"
            password_hash = "$2y$10$abcdefghijklmnopqrstuvwxyz0123456789" # Dummy hash for "password123" - In real app this should be properly hashed, but for simplicity/faker we use a placeholder or simple hash. 
            # Wait, standard PHP password_hash('password123', PASSWORD_DEFAULT) is needed.
            # I'll use a known hash for 'password123': $2y$10$S.r.y8k.Y.e.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z (fake)
            # Actually let's just use a simple string, assuming the auth system handles it or we use a real hash.
            # Real hash for 'password123' (BCRYPT cost 10): $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
            real_hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
            
            # Create User
            cursor.execute("INSERT INTO users (username, email, password, role, status) VALUES (%s, %s, %s, %s, %s)",
                           (name, email, real_hash, 'teacher', 'active'))
            user_id = cursor.lastrowid
            
            # Create Teacher Profile
            # Schema requires: user_id, teacher_id, first_name, last_name, date_of_birth, gender, joining_date, department, designation, qualification
            fname = f"{dept} Teacher"
            lname = str(i+1)
            dob = '1980-01-01'
            join_date = '2020-01-01'
            cursor.execute("INSERT INTO teachers (user_id, teacher_id, first_name, last_name, date_of_birth, gender, joining_date, department, designation, qualification) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                           (user_id, f"EMP{dept}{i+1:03d}", fname, lname, dob, 'male', join_date, dept, 'Assistant Professor', 'PhD'))
            teachers_ids.append(cursor.lastrowid)
            
        print(f"teacher created.... ({dept})")

        # Create 5 Students per Dept
        # We only need Sem 1 for this simulation logic mainly, but let's assume they are all Sem 1 for simplicity or mix?
        # Requirement: "for every department we need only 5 students each"
        # Let's put them in Sem 1 to match the "bunking" scenario with Sem 1 subjects.
        students_ids = []
        for i in range(5):
            name = f"{dept} Student {i+1}"
            email = f"student{i+1}.{dept.lower().replace('.', '')}@college.com"
            
            # Create User
            cursor.execute("INSERT INTO users (username, email, password, role, status) VALUES (%s, %s, %s, %s, %s)",
                           (name, email, real_hash, 'student', 'active'))
            user_id = cursor.lastrowid
            
            # Create Student Profile
            # Schema requires: user_id, student_id, first_name, last_name, date_of_birth, gender, enrollment_date, semester, session_id
            fname = f"{dept} Student"
            lname = str(i+1)
            dob = '2000-01-01'
            enroll_date = '2023-08-01'
            
            cursor.execute("INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, enrollment_date, department, semester, session_id, batch_year) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                           (user_id, f"STU{dept}{i+1:03d}", fname, lname, dob, 'male', enroll_date, dept, 1, session_id, 2023))
            students_ids.append(cursor.lastrowid)

        print(f"students created.... ({dept})")

        # 6. Assign Subjects
        # Get Sem 1 subjects for this dept
        cursor.execute("SELECT id FROM subjects WHERE department = %s AND semester = 1 LIMIT 5", (dept,))
        subjects = cursor.fetchall()
        subject_ids = [s[0] for s in subjects]
        
        # Assign 1 subject to each teacher (we have 5 teachers, 5 subjects)
        for idx, teacher_id in enumerate(teachers_ids):
            if idx < len(subject_ids):
                subj_id = subject_ids[idx]
                cursor.execute("INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (%s, %s)",
                               (teacher_id, subj_id))
        
        print(f"subject assigned.... ({dept})")

        # 7. Simulate Attendance for BCA Student 1
        if dept == 'BCA':
            target_student_id = students_ids[0] # BCA Student 1
            
            # Date 1: Present in all 5 subjects
            date1 = '2023-09-01'
            for subj_id in subject_ids:
                cursor.execute("INSERT INTO attendance (student_id, subject_id, session_id, attendance_date, status, marked_by) VALUES (%s, %s, %s, %s, %s, %s)",
                               (target_student_id, subj_id, session_id, date1, 'present', teachers_ids[0])) # Marked by any teacher
            
            # Date 2: Present in 1st subject, Absent in others (Bunking scenario)
            date2 = '2023-09-02'
            # Period 1 (Subject 1) - Present
            cursor.execute("INSERT INTO attendance (student_id, subject_id, session_id, attendance_date, status, marked_by) VALUES (%s, %s, %s, %s, %s, %s)",
                           (target_student_id, subject_ids[0], session_id, date2, 'present', teachers_ids[0]))
            
            # Periods 2-5 (Subjects 2-5) - Absent
            for subj_id in subject_ids[1:]:
                cursor.execute("INSERT INTO attendance (student_id, subject_id, session_id, attendance_date, status, marked_by) VALUES (%s, %s, %s, %s, %s, %s)",
                               (target_student_id, subj_id, session_id, date2, 'absent', teachers_ids[0]))

    conn.commit()
    conn.close()
    print("done...")

if __name__ == "__main__":
    setup_system()
