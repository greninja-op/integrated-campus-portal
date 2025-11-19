@echo off
REM Setup Windows Task Scheduler for PDF Temp File Cleanup
REM Run this script as Administrator

echo ========================================
echo PDF Temp File Cleanup - Task Setup
echo ========================================
echo.

REM Get current directory
set SCRIPT_DIR=%~dp0
set PHP_PATH=C:\xampp\php\php.exe
set CLEANUP_SCRIPT=%SCRIPT_DIR%includes\cleanup_temp_files.php

echo Checking PHP installation...
if not exist "%PHP_PATH%" (
    echo ERROR: PHP not found at %PHP_PATH%
    echo Please update PHP_PATH in this script to match your PHP installation
    pause
    exit /b 1
)

echo PHP found: %PHP_PATH%
echo.

echo Checking cleanup script...
if not exist "%CLEANUP_SCRIPT%" (
    echo ERROR: Cleanup script not found at %CLEANUP_SCRIPT%
    pause
    exit /b 1
)

echo Cleanup script found: %CLEANUP_SCRIPT%
echo.

echo Creating scheduled task...
schtasks /create /tn "StudentPortal_PDF_Cleanup" /tr "\"%PHP_PATH%\" \"%CLEANUP_SCRIPT%\"" /sc daily /st 02:00 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: Task created successfully!
    echo ========================================
    echo.
    echo Task Name: StudentPortal_PDF_Cleanup
    echo Schedule: Daily at 2:00 AM
    echo Command: "%PHP_PATH%" "%CLEANUP_SCRIPT%"
    echo.
    echo To verify the task:
    echo   schtasks /query /tn "StudentPortal_PDF_Cleanup"
    echo.
    echo To run the task manually:
    echo   schtasks /run /tn "StudentPortal_PDF_Cleanup"
    echo.
    echo To delete the task:
    echo   schtasks /delete /tn "StudentPortal_PDF_Cleanup" /f
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to create task
    echo ========================================
    echo.
    echo Please run this script as Administrator
    echo Right-click and select "Run as administrator"
    echo.
)

pause
