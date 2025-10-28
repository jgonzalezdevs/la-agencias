#!/bin/bash

# Database Restore Script
# This script restores the PostgreSQL database from a backup

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found!"
    exit 1
fi

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: ./restore-db.sh <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "==================================="
echo "Database Restore"
echo "==================================="
echo ""
echo "WARNING: This will replace the current database!"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

echo ""
echo "Restoring database..."

# Drop and recreate database
docker-compose exec -T db psql -U $POSTGRES_USER -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"
docker-compose exec -T db psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB;"

# Restore from backup
gunzip < $BACKUP_FILE | docker-compose exec -T db psql -U $POSTGRES_USER $POSTGRES_DB

if [ $? -eq 0 ]; then
    echo "✓ Database restored successfully!"
else
    echo "✗ Restore failed!"
    exit 1
fi
