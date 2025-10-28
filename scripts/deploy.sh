#!/bin/bash

# Production Deployment Script
# This script deploys the application to production

set -e

echo "==================================="
echo "Boletería Production Deployment"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file from .env.production template"
    exit 1
fi

# Source environment variables
source .env

# Check if domain is configured
if [ "$DOMAIN" = "yourdomain.com" ]; then
    echo -e "${RED}Error: Please configure your domain in .env file${NC}"
    exit 1
fi

# Check if SSL certificates exist
if [ ! -f ssl/fullchain.pem ] || [ ! -f ssl/privkey.pem ]; then
    echo -e "${YELLOW}Warning: SSL certificates not found${NC}"
    echo "Please run: ./scripts/setup-ssl.sh $DOMAIN"
    read -p "Continue without SSL? (y/n): " continue_without_ssl
    if [ "$continue_without_ssl" != "y" ]; then
        exit 1
    fi
fi

echo "Deployment Configuration:"
echo "- Domain: $DOMAIN"
echo "- Database: $POSTGRES_DB"
echo "- Debug Mode: $DEBUG"
echo ""

read -p "Continue with deployment? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Step 1: Updating system packages..."
sudo apt-get update

echo ""
echo "Step 2: Installing Docker and Docker Compose (if not installed)..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed. You may need to log out and back in for group changes to take effect."
fi

if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo ""
echo "Step 3: Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    echo "Firewall rules added (SSH, HTTP, HTTPS)"
fi

echo ""
echo "Step 4: Creating necessary directories..."
mkdir -p ssl
mkdir -p logs
mkdir -p certbot/www

echo ""
echo "Step 5: Building Docker images..."
docker-compose build --no-cache

echo ""
echo "Step 6: Starting services..."
docker-compose up -d

echo ""
echo "Step 7: Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "Checking service status..."
docker-compose ps

echo ""
echo "==================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "==================================="
echo ""
echo "Your application should now be running at:"
echo "- https://$DOMAIN"
echo ""
echo "Useful commands:"
echo "- View logs: docker-compose logs -f"
echo "- Stop services: docker-compose down"
echo "- Restart services: docker-compose restart"
echo "- View backend logs: docker-compose logs -f backend"
echo "- View database: docker-compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB"
echo ""
echo "Next steps:"
echo "1. Test your application"
echo "2. Set up SSL auto-renewal (if using Let's Encrypt)"
echo "3. Configure backups for database"
echo "4. Set up monitoring"
echo ""
