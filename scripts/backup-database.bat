@echo off
echo Creating database backup...

set BACKUP_DIR=database\backups
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\backup_%TIMESTAMP%.sql

echo Backing up to %BACKUP_FILE%...
docker exec icp_dev_db mysqldump -uroot -proot studentportal > %BACKUP_FILE%

echo Backup completed: %BACKUP_FILE%
echo.
pause
