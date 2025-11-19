@echo off
title Student Portal - Database Setup
color 0B
cls

echo ========================================
echo   Student Portal - Database Setup
echo ========================================
echo.
echo This will create and populate the database
echo.
echo Make sure MySQL is running!
echo.
pause

echo.
echo Creating database...
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS studentportal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo.
echo Importing schema...
mysql -u root -p studentportal < database/schema.sql

echo.
echo Importing seed data...
mysql -u root -p studentportal < database/seeds/01_sessions.sql
mysql -u root -p studentportal < database/seeds/02_admin.sql
mysql -u root -p studentportal < database/seeds/03_teachers.sql
mysql -u root -p studentportal < database/seeds/04_students.sql
mysql -u root -p studentportal < database/seeds/05_subjects.sql
mysql -u root -p studentportal < database/seeds/06_fees.sql
mysql -u root -p studentportal < database/seeds/07_marks.sql
mysql -u root -p studentportal < database/seeds/08_attendance.sql
mysql -u root -p studentportal < database/seeds/09_notices.sql

echo.
echo ========================================
echo   Database Setup Complete!
echo ========================================
echo.
echo You can now start the backend server
echo Run: START_BACKEND.bat
echo.
pause
