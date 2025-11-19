import mysql.connector
from mysql.connector import Error

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '', # Try empty password first
    'database': 'studentportal'
}

def create_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
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

def create_notices_table():
    conn = create_connection()
    if not conn:
        return

    cursor = conn.cursor()

    try:
        print("Creating notices table...")
        
        # Drop table if exists to ensure clean state
        cursor.execute("DROP TABLE IF EXISTS notices")

        create_table_query = """
        CREATE TABLE notices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            target_role ENUM('all', 'student', 'teacher', 'admin') DEFAULT 'all',
            expiry_date DATE,
            is_active BOOLEAN DEFAULT TRUE,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            
            INDEX idx_target_role (target_role),
            INDEX idx_active (is_active),
            INDEX idx_expiry (expiry_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        
        cursor.execute(create_table_query)
        print("Notices table created successfully.")
        
        # Get admin ID
        cursor.execute("SELECT id FROM users WHERE role='admin' LIMIT 1")
        admin_row = cursor.fetchone()
        admin_id = admin_row[0] if admin_row else None
        
        # Insert some sample notices
        print("Inserting sample notices...")
        sample_notices = [
            ('Welcome to the new portal', 'We are excited to launch the new student portal. Please explore the features.', 'all', None, 1, admin_id),
            ('Exam Schedule Released', 'The final exam schedule has been released. Check the exams section.', 'student', '2025-12-31', 1, admin_id),
            ('Faculty Meeting', 'There will be a faculty meeting on Friday at 2 PM.', 'teacher', '2025-12-31', 1, admin_id),
            ('System Maintenance', 'The system will be down for maintenance on Sunday.', 'all', '2025-12-31', 1, admin_id)
        ]
        
        cursor.executemany("""
            INSERT INTO notices (title, content, target_role, expiry_date, is_active, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, sample_notices)
        
        conn.commit()
        print("Sample notices inserted.")

    except Error as e:
        print(f"Error creating notices table: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_notices_table()
