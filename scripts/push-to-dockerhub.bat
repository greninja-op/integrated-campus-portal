@echo off
REM Script to create private repos and push ICP images to Docker Hub
REM Usage: push-to-dockerhub.bat <your-dockerhub-username> <your-dockerhub-password>

if "%1"=="" (
    echo Error: Docker Hub username required
    echo Usage: push-to-dockerhub.bat ^<username^> ^<password^>
    exit /b 1
)

if "%2"=="" (
    echo Error: Docker Hub password required
    echo Usage: push-to-dockerhub.bat ^<username^> ^<password^>
    exit /b 1
)

set DOCKERHUB_USER=%1
set DOCKERHUB_PASS=%2
set VERSION=dev

echo ========================================
echo Creating Private Repos and Pushing ICP Images
echo ========================================
echo Username: %DOCKERHUB_USER%
echo Version: %VERSION%
echo ========================================

REM Login to Docker Hub
echo.
echo Step 1: Logging in to Docker Hub...
echo %DOCKERHUB_PASS% | docker login -u %DOCKERHUB_USER% --password-stdin

if %ERRORLEVEL% NEQ 0 (
    echo Failed to login to Docker Hub
    exit /b 1
)

REM Get Docker Hub token for API calls
echo.
echo Step 2: Getting Docker Hub API token...
for /f "delims=" %%i in ('curl -s -X POST https://hub.docker.com/v2/users/login/ -H "Content-Type: application/json" -d "{\"username\":\"%DOCKERHUB_USER%\",\"password\":\"%DOCKERHUB_PASS%\"}" ^| findstr /C:"token"') do set TOKEN_LINE=%%i
for /f "tokens=2 delims=:," %%a in ("%TOKEN_LINE%") do set TOKEN=%%a
set TOKEN=%TOKEN:"=%
set TOKEN=%TOKEN: =%

if "%TOKEN%"=="" (
    echo Failed to get API token
    exit /b 1
)

echo Token obtained successfully

REM Create private repositories
echo.
echo Step 3: Creating private repositories...

curl -s -X POST https://hub.docker.com/v2/repositories/ ^
  -H "Authorization: JWT %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"namespace\":\"%DOCKERHUB_USER%\",\"name\":\"icp-backend\",\"description\":\"ICP Backend - PHP API\",\"is_private\":true}"

curl -s -X POST https://hub.docker.com/v2/repositories/ ^
  -H "Authorization: JWT %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"namespace\":\"%DOCKERHUB_USER%\",\"name\":\"icp-frontend\",\"description\":\"ICP Frontend - React SPA\",\"is_private\":true}"

echo Repositories created (or already exist)

REM Tag images
echo.
echo Step 4: Tagging images...
docker tag icp-backend:latest %DOCKERHUB_USER%/icp-backend:%VERSION%
docker tag icp-frontend:latest %DOCKERHUB_USER%/icp-frontend:%VERSION%

echo Tagged: %DOCKERHUB_USER%/icp-backend:%VERSION%
echo Tagged: %DOCKERHUB_USER%/icp-frontend:%VERSION%

REM Push images
echo.
echo Step 5: Pushing backend image...
docker push %DOCKERHUB_USER%/icp-backend:%VERSION%

if %ERRORLEVEL% NEQ 0 (
    echo Failed to push backend image
    exit /b 1
)

echo.
echo Step 6: Pushing frontend image...
docker push %DOCKERHUB_USER%/icp-frontend:%VERSION%

if %ERRORLEVEL% NEQ 0 (
    echo Failed to push frontend image
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Private repos created and images pushed
echo ========================================
echo Backend: %DOCKERHUB_USER%/icp-backend:%VERSION%
echo Frontend: %DOCKERHUB_USER%/icp-frontend:%VERSION%
echo ========================================
echo.
echo Verify at: https://hub.docker.com/repositories
echo ========================================

pause
