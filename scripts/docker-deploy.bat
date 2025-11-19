@echo off
REM Docker Deployment Script for ICP (Windows)
REM This script automates the deployment process

echo =========================================
echo   ICP Docker Deployment
echo =========================================
echo.

REM Check Docker
echo Checking prerequisites...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed
    exit /b 1
)
echo [OK] Docker is installed

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed
    exit /b 1
)
echo [OK] Docker Compose is installed

REM Check environment file
if not exist .env (
    echo [WARNING] .env file not found
    if exist .env.production (
        echo Copying .env.production to .env
        copy .env.production .env
        echo [WARNING] Please update .env with your secure credentials
        pause
        exit /b 1
    ) else (
        echo [ERROR] No environment file found
        exit /b 1
    )
)
echo [OK] Environment file exists

REM Build images
echo.
echo Building Docker images...
docker-compose build --no-cache
if errorlevel 1 (
    echo [ERROR] Failed to build images
    exit /b 1
)
echo [OK] Images built successfully

REM Start containers
echo.
echo Starting containers...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start containers
    exit /b 1
)
echo [OK] Containers started

REM Wait for services
echo.
echo Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Show status
echo.
echo Container Status:
docker-compose ps

echo.
echo Access URLs:
echo   Frontend: http://localhost
echo   Backend API: http://localhost/api
echo   Direct Backend: http://localhost:8080

echo.
echo [SUCCESS] Deployment completed successfully!
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause
