#!/bin/bash
# Setup cron job for PDF Temp File Cleanup
# Usage: bash backend/setup_cleanup_cron.sh

echo "========================================"
echo "PDF Temp File Cleanup - Cron Setup"
echo "========================================"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CLEANUP_SCRIPT="$SCRIPT_DIR/includes/cleanup_temp_files.php"

# Find PHP
PHP_PATH=$(which php)
if [ -z "$PHP_PATH" ]; then
    echo "ERROR: PHP not found in PATH"
    echo "Please install PHP or add it to your PATH"
    exit 1
fi

echo "PHP found: $PHP_PATH"
echo ""

# Check cleanup script
if [ ! -f "$CLEANUP_SCRIPT" ]; then
    echo "ERROR: Cleanup script not found at $CLEANUP_SCRIPT"
    exit 1
fi

echo "Cleanup script found: $CLEANUP_SCRIPT"
echo ""

# Create cron job entry
CRON_JOB="0 2 * * * $PHP_PATH $CLEANUP_SCRIPT >> $SCRIPT_DIR/logs/cleanup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$CLEANUP_SCRIPT"; then
    echo "Cron job already exists!"
    echo ""
    echo "Current cron jobs:"
    crontab -l | grep "$CLEANUP_SCRIPT"
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    
    # Remove old cron job
    crontab -l | grep -v "$CLEANUP_SCRIPT" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "SUCCESS: Cron job created!"
    echo "========================================"
    echo ""
    echo "Schedule: Daily at 2:00 AM"
    echo "Command: $PHP_PATH $CLEANUP_SCRIPT"
    echo "Log: $SCRIPT_DIR/logs/cleanup.log"
    echo ""
    echo "To verify the cron job:"
    echo "  crontab -l"
    echo ""
    echo "To test the cleanup script manually:"
    echo "  php $CLEANUP_SCRIPT"
    echo ""
    echo "To remove the cron job:"
    echo "  crontab -e"
    echo "  (then delete the line containing cleanup_temp_files.php)"
    echo ""
else
    echo ""
    echo "========================================"
    echo "ERROR: Failed to create cron job"
    echo "========================================"
    echo ""
    echo "Please check your crontab permissions"
    echo ""
    exit 1
fi
