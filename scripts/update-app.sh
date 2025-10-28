#!/bin/bash

# Application Update Script
# This script pulls latest changes and updates the running application

set -e

echo "==================================="
echo "Application Update"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if git repo
if [ ! -d .git ]; then
    echo -e "${YELLOW}Warning: Not a git repository${NC}"
    read -p "Continue with manual update? (y/n): " continue
    if [ "$continue" != "y" ]; then
        exit 0
    fi
else
    echo "Step 1: Pulling latest changes from git..."
    git pull

    # Check if there are changes
    if [ $? -ne 0 ]; then
        echo "Error: Failed to pull changes"
        exit 1
    fi
fi

echo ""
echo "Step 2: Creating database backup..."
./scripts/backup-db.sh

echo ""
echo "Step 3: Rebuilding Docker images..."
docker-compose build --no-cache

echo ""
echo "Step 4: Restarting services..."
docker-compose up -d

echo ""
echo "Step 5: Running database migrations..."
docker-compose exec backend alembic upgrade head

echo ""
echo "Step 6: Waiting for services to be healthy..."
sleep 10

echo ""
echo "Step 7: Checking service status..."
docker-compose ps

echo ""
echo "==================================="
echo -e "${GREEN}Update Complete!${NC}"
echo "==================================="
echo ""
echo "Check logs with: docker-compose logs -f"
