import mysql.connector
from mysql.connector import Error

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'studentportal'
}

def execute_sql_file(file_path):
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            cursor = conn.cursor()
            with open(file_path, 'r') as f:
                sql = f.read()
            
            # Basic split by semicolon (not robust for complex stored procedures but fine for CREATE TABLE)
            commands = sql.split(';')
            for command in commands:
                if command.strip():
                    try:
                        cursor.execute(command)
                    except Error as e:
                        print(f"Warning: {e}")
            
            conn.commit()
            print(f"[OK] Executed {file_path}")
            cursor.close()
            conn.close()
    except Error as e:
        print(f"[ERROR] Database connection failed: {e}")

if __name__ == "__main__":
    execute_sql_file('database/migrations/03_fix_notices_schema.sql')
