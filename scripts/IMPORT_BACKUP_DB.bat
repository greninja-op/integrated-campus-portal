@echo off
title Student Portal - Import Database Backup
color 0B
cls

echo ========================================
echo   Importing Database Backup
echo ========================================
echo.
echo This will overwrite the database on this PC with 'full_backup.sql'
echo.

if not exist "full_backup.sql" (
    echo Error: full_backup.sql not found!
    echo Please place the backup file in this folder.
    pause
    exit /b
)

set MYSQL_PATH="mysql"

REM Check if mysql is in PATH, otherwise try common XAMPP path
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\xampp\mysql\bin\mysql.exe" (
        set MYSQL_PATH="C:\xampp\mysql\bin\mysql.exe"
    ) else (
        echo Error: mysql not found. Please ensure MySQL/XAMPP is installed.
        pause
        exit /b
    )
)

echo Creating database if not exists...
%MYSQL_PATH% -u root -p -e "CREATE DATABASE IF NOT EXISTS studentportal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo.
echo Importing full_backup.sql...
%MYSQL_PATH% -u root -p studentportal < full_backup.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Import Successful!
    echo ========================================
    echo.
    echo Your database is now exactly the same as the source PC.
) else (
    echo.
    echo Import Failed!
)
pause
