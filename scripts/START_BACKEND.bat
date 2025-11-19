@echo off
title Student Portal - Backend Server
color 0A
cls

echo ========================================
echo   Student Portal - Backend Server
echo ========================================
echo.
echo Starting backend at http://localhost:8000/
echo.
echo IMPORTANT:
echo   - Keep this window OPEN while developing
echo   - Frontend will connect to this server
echo   - Press Ctrl+C to stop server
echo.
echo ========================================
echo.

cd backend
"C:\xampp\php\php.exe" -S localhost:8000

pause
