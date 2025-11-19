@echo off
title Student Portal - Export Database
color 0B
cls

echo ========================================
echo   Exporting Current Database
echo ========================================
echo.
echo This will save your current database state to 'full_backup.sql'
echo.

set MYSQLDUMP_PATH="mysqldump"

REM Check if mysqldump is in PATH, otherwise try common XAMPP path
where mysqldump >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\xampp\mysql\bin\mysqldump.exe" (
        set MYSQLDUMP_PATH="C:\xampp\mysql\bin\mysqldump.exe"
    ) else (
        echo Error: mysqldump not found. Please ensure MySQL/XAMPP is installed.
        pause
        exit /b
    )
)

echo Exporting to full_backup.sql...
%MYSQLDUMP_PATH% -u root -p studentportal > full_backup.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Export Successful!
    echo ========================================
    echo.
    echo File created: full_backup.sql
    echo.
    echo Copy this file along with your project folder to the new PC.
) else (
    echo.
    echo Export Failed! Please check your password.
)
pause
