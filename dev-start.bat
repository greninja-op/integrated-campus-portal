@echo off
REM Quick Development Start Script

echo ========================================
echo   ICP Development Environment
echo ========================================
echo.
echo Starting development containers with hot reload...
echo.

docker-compose up -d --build

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   Development Environment Ready!
echo ========================================
echo.
echo Access URLs:
echo   Frontend (Hot Reload): http://localhost:5173
echo   Backend API:           http://localhost:8080
echo   Database:              localhost:3306
echo.
echo Features:
echo   - Hot reload enabled for frontend
echo   - Live code changes for backend
echo   - Error display enabled
echo   - Debug mode active
echo.
echo View logs: docker-compose logs -f
echo Stop: docker-compose down
echo.
pause
