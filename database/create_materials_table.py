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

def create_materials_table():
    conn = create_connection()
    if not conn:
        return

    cursor = conn.cursor()

    try:
        print("Creating study_materials table...")
        
        # Drop table if exists
        cursor.execute("DROP TABLE IF EXISTS study_materials")

        create_table_query = """
        CREATE TABLE study_materials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            department VARCHAR(100) NOT NULL,
            semester INT NOT NULL,
            subject VARCHAR(100) NOT NULL,
            material_type ENUM('notes', 'question_paper', 'lab_manual', 'assignment') NOT NULL,
            unit VARCHAR(50),
            year INT,
            description TEXT,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            file_url VARCHAR(255) NOT NULL,
            file_size INT,
            uploaded_by INT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
            
            INDEX idx_department (department),
            INDEX idx_semester (semester),
            INDEX idx_subject (subject),
            INDEX idx_type (material_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        
        cursor.execute(create_table_query)
        print("Study materials table created successfully.")
        
        conn.commit()

    except Error as e:
        print(f"Error creating study_materials table: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_materials_table()
