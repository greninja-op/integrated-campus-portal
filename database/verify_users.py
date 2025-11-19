import mysql.connector
from mysql.connector import Error

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '', # Try empty password first
    'database': 'studentportal'
}

def verify_users():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
    except Error:
        try:
            DB_CONFIG['password'] = 'root'
            connection = mysql.connector.connect(**DB_CONFIG)
        except Error as e:
            print(f"Error: {e}")
            return

    cursor = connection.cursor()
    cursor.execute("SELECT id, username, role, password FROM users")
    users = cursor.fetchall()
    print("Current Users:")
    for user in users:
        print(f"ID: {user[0]}, Username: {user[1]}, Role: {user[2]}, Password Hash: {user[3][:10]}...")
    
    cursor.close()
    connection.close()

if __name__ == "__main__":
    verify_users()
