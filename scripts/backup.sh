#!/bin/bash

# Backup script for ICP Docker deployment

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="icp_backup_${TIMESTAMP}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "Starting backup: ${BACKUP_NAME}"

# Backup database
echo "Backing up database..."
docker-compose exec -T db mysqldump -u root -p${DB_ROOT_PASSWORD} studentportal > "${BACKUP_DIR}/${BACKUP_NAME}_db.sql"

# Backup uploads
echo "Backing up uploads..."
docker run --rm -v icp_backend_uploads:/data -v $(pwd)/${BACKUP_DIR}:/backup alpine tar czf /backup/${BACKUP_NAME}_uploads.tar.gz /data

# Backup logs
echo "Backing up logs..."
docker run --rm -v icp_backend_logs:/data -v $(pwd)/${BACKUP_DIR}:/backup alpine tar czf /backup/${BACKUP_NAME}_logs.tar.gz /data

# Create backup info file
cat > "${BACKUP_DIR}/${BACKUP_NAME}_info.txt" << EOF
Backup Information
==================
Date: $(date)
Database: studentportal
Files:
  - ${BACKUP_NAME}_db.sql
  - ${BACKUP_NAME}_uploads.tar.gz
  - ${BACKUP_NAME}_logs.tar.gz
EOF

echo "Backup completed: ${BACKUP_DIR}/${BACKUP_NAME}"
echo "Files created:"
ls -lh "${BACKUP_DIR}/${BACKUP_NAME}"*
