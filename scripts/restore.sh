#!/bin/bash

# Restore script for ICP Docker deployment

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_name>"
    echo "Example: $0 icp_backup_20241119_120000"
    exit 1
fi

BACKUP_DIR="./backups"
BACKUP_NAME="$1"

# Check if backup exists
if [ ! -f "${BACKUP_DIR}/${BACKUP_NAME}_db.sql" ]; then
    echo "Error: Backup not found: ${BACKUP_NAME}"
    exit 1
fi

echo "WARNING: This will overwrite current data!"
read -p "Are you sure you want to restore ${BACKUP_NAME}? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Restore database
echo "Restoring database..."
docker-compose exec -T db mysql -u root -p${DB_ROOT_PASSWORD} studentportal < "${BACKUP_DIR}/${BACKUP_NAME}_db.sql"

# Restore uploads
if [ -f "${BACKUP_DIR}/${BACKUP_NAME}_uploads.tar.gz" ]; then
    echo "Restoring uploads..."
    docker run --rm -v icp_backend_uploads:/data -v $(pwd)/${BACKUP_DIR}:/backup alpine tar xzf /backup/${BACKUP_NAME}_uploads.tar.gz -C /
fi

# Restore logs
if [ -f "${BACKUP_DIR}/${BACKUP_NAME}_logs.tar.gz" ]; then
    echo "Restoring logs..."
    docker run --rm -v icp_backend_logs:/data -v $(pwd)/${BACKUP_DIR}:/backup alpine tar xzf /backup/${BACKUP_NAME}_logs.tar.gz -C /
fi

echo "Restore completed successfully!"
