@echo off
REM Quick Start Script for ICP Docker Deployment (Windows)

echo =========================================
echo   ICP Quick Start
echo =========================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    if exist .env.production (
        copy .env.production .env
        echo.
        echo [IMPORTANT] Please edit .env file with your credentials
        echo Press any key after updating .env file...
        pause >nul
    ) else (
        echo [ERROR] .env.production template not found
        exit /b 1
    )
)

echo Starting ICP in production mode...
echo.

REM Start containers
docker-compose up -d --build

if errorlevel 1 (
    echo [ERROR] Failed to start containers
    exit /b 1
)

echo.
echo Waiting for services to start...
timeout /t 15 /nobreak >nul

echo.
echo =========================================
echo   ICP is now running!
echo =========================================
echo.
echo Access URLs:
echo   Frontend: http://localhost
echo   Backend API: http://localhost/api
echo   Direct Backend: http://localhost:8080
echo.
echo Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop: docker-compose down
echo   Restart: docker-compose restart
echo   Status: docker-compose ps
echo.
echo For monitoring (optional):
echo   docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
echo   Grafana: http://localhost:3001 (admin/admin)
echo   Prometheus: http://localhost:9090
echo.
pause
