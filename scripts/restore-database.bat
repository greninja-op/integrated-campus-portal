@echo off
echo Available backups:
echo.
dir /b database\backups\*.sql
echo.
set /p BACKUP_FILE="Enter backup filename (or 'latest' for most recent): "

if "%BACKUP_FILE%"=="latest" (
    for /f "delims=" %%i in ('dir /b /o-d database\backups\*.sql') do (
        set BACKUP_FILE=%%i
        goto :restore
    )
)

:restore
set FULL_PATH=database\backups\%BACKUP_FILE%

if not exist %FULL_PATH% (
    echo Error: Backup file not found!
    pause
    exit /b 1
)

echo Restoring from %FULL_PATH%...
type %FULL_PATH% | docker exec -i icp_dev_db mysql -uroot -proot studentportal

echo Database restored successfully!
echo.
pause
