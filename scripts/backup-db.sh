#!/bin/bash

# Database Backup Script
# This script creates backups of the PostgreSQL database

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found!"
    exit 1
fi

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/boleteria_db_$DATE.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "==================================="
echo "Database Backup"
echo "==================================="
echo ""
echo "Creating backup: $BACKUP_FILE"

# Create backup
docker-compose exec -T db pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_FILE

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✓ Backup created successfully!"
    echo "File size: $(du -h $BACKUP_FILE | cut -f1)"

    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "boleteria_db_*.sql.gz" -mtime +7 -delete
    echo "✓ Old backups cleaned up (kept last 7 days)"
else
    echo "✗ Backup failed!"
    exit 1
fi

echo ""
echo "Backup location: $BACKUP_FILE"
