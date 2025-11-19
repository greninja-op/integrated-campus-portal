import mysql.connector
from mysql.connector import Error

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '', # Try empty password first, as per QUICK_START.md (XAMPP default)
    'database': 'studentportal'
}

# Hash for 'admin123' (since we can't generate bcrypt hash for '123' without libraries)
# We will set the password to 'admin123' for all users and inform the user.
PASSWORD_HASH = '$2y$10$du.0smOc08Tu6Bld/2V3A.6iytE/Jcg4KqWt3fk9GHy7gjbSAu5LK'

def create_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        # Try with password 'root' if empty failed
        if e.errno == 1045: # Access denied
            try:
                DB_CONFIG['password'] = 'root'
                connection = mysql.connector.connect(**DB_CONFIG)
                return connection
            except Error as e2:
                print(f"Error connecting to database: {e2}")
                return None
        print(f"Error connecting to database: {e}")
        return None

def reset_users():
    conn = create_connection()
    if not conn:
        return

    cursor = conn.cursor()

    try:
        print("Starting user reset...")

        # 1. Delete existing users
        usernames = ['admin', 'teacher', 'student']
        placeholders = ', '.join(['%s'] * len(usernames))
        cursor.execute(f"DELETE FROM users WHERE username IN ({placeholders})", usernames)
        print(f"Deleted existing users: {', '.join(usernames)}")

        # 2. Ensure a session exists
        cursor.execute("SELECT id FROM sessions LIMIT 1")
        result = cursor.fetchone()
        if result:
            session_id = result[0]
            print(f"Using existing session ID: {session_id}")
        else:
            cursor.execute("INSERT INTO sessions (session_name, start_year, end_year, start_date, end_date, is_active) VALUES (%s, %s, %s, %s, %s, %s)",
                           ('2025-2026', 2025, 2026, '2025-01-01', '2026-12-31', 1))
            session_id = cursor.lastrowid
            print(f"Created new session ID: {session_id}")

        # 3. Create Admin
        cursor.execute("INSERT INTO users (username, password, email, role, status) VALUES (%s, %s, %s, %s, %s)",
                       ('admin', PASSWORD_HASH, 'admin@example.com', 'admin', 'active'))
        user_id = cursor.lastrowid
        
        # Check if admin details exist (unlikely since we deleted user, but good to be safe if schema changed)
        # Actually, with ON DELETE CASCADE, details should be gone.
        cursor.execute("INSERT INTO admins (user_id, admin_id, first_name, last_name, designation) VALUES (%s, %s, %s, %s, %s)",
                       (user_id, 'ADM001', 'System', 'Admin', 'Super Admin'))
        print("Created Admin user (password: admin123)")

        # 4. Create Teacher
        cursor.execute("INSERT INTO users (username, password, email, role, status) VALUES (%s, %s, %s, %s, %s)",
                       ('teacher', PASSWORD_HASH, 'teacher@example.com', 'teacher', 'active'))
        user_id = cursor.lastrowid
        
        cursor.execute("INSERT INTO teachers (user_id, teacher_id, first_name, last_name, date_of_birth, gender, joining_date, department, designation) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                       (user_id, 'TCH001', 'John', 'Doe', '1980-01-01', 'male', '2020-01-01', 'Computer Science', 'Senior Lecturer'))
        print("Created Teacher user (password: admin123)")

        # 5. Create Student
        cursor.execute("INSERT INTO users (username, password, email, role, status) VALUES (%s, %s, %s, %s, %s)",
                       ('student', PASSWORD_HASH, 'student@example.com', 'student', 'active'))
        user_id = cursor.lastrowid
        
        cursor.execute("INSERT INTO students (user_id, student_id, first_name, last_name, date_of_birth, gender, enrollment_date, session_id, semester, department) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                       (user_id, 'STD001', 'Jane', 'Smith', '2000-01-01', 'female', '2025-01-01', session_id, 1, 'Computer Science'))
        print("Created Student user (password: admin123)")

        conn.commit()
        print("User reset complete successfully.")

    except Error as e:
        print(f"Error during reset: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    reset_users()
