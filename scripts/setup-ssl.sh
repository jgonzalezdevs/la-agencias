#!/bin/bash

# SSL Setup Script for Production Deployment
# This script helps set up SSL certificates for your domain

set -e

echo "==================================="
echo "SSL Certificate Setup"
echo "==================================="
echo ""

# Check if domain is set
if [ -z "$1" ]; then
    echo "Usage: ./setup-ssl.sh yourdomain.com"
    exit 1
fi

DOMAIN=$1
SSL_DIR="../ssl"

echo "Setting up SSL for domain: $DOMAIN"
echo ""

# Create SSL directory if it doesn't exist
mkdir -p $SSL_DIR

echo "Please choose your SSL certificate setup method:"
echo ""
echo "1) I have existing SSL certificates (from Namecheap, etc.)"
echo "2) I want to use Let's Encrypt (free, auto-renewing)"
echo "3) Generate self-signed certificates (for testing only)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "==================================="
        echo "Option 1: Using Existing Certificates"
        echo "==================================="
        echo ""
        echo "Please copy your SSL certificate files to the ssl/ directory:"
        echo ""
        echo "1. Certificate file → ssl/fullchain.pem"
        echo "2. Private key file → ssl/privkey.pem"
        echo ""
        echo "If you have separate certificate and CA bundle files:"
        echo "  cat certificate.crt ca_bundle.crt > ssl/fullchain.pem"
        echo "  cp private.key ssl/privkey.pem"
        echo ""
        read -p "Press Enter once you've copied the files..."

        # Verify files exist
        if [ ! -f "$SSL_DIR/fullchain.pem" ] || [ ! -f "$SSL_DIR/privkey.pem" ]; then
            echo "Error: SSL certificate files not found!"
            exit 1
        fi

        # Set correct permissions
        chmod 644 $SSL_DIR/fullchain.pem
        chmod 600 $SSL_DIR/privkey.pem

        echo "✓ SSL certificates configured successfully!"
        ;;

    2)
        echo ""
        echo "==================================="
        echo "Option 2: Let's Encrypt Setup"
        echo "==================================="
        echo ""
        echo "Prerequisites:"
        echo "1. Your domain must point to this server's IP address"
        echo "2. Ports 80 and 443 must be open"
        echo ""
        read -p "Press Enter to continue..."

        # Create certbot directory
        mkdir -p ../certbot/www
        mkdir -p ../certbot/conf

        # Create temporary docker-compose for certbot
        cat > ../docker-compose.certbot.yml <<EOF
version: '3.9'

services:
  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: certonly --webroot -w /var/www/certbot --email admin@$DOMAIN -d $DOMAIN -d www.$DOMAIN --agree-tos --no-eff-email --force-renewal
EOF

        echo "Starting temporary nginx for Let's Encrypt validation..."

        # Start nginx temporarily
        docker run -d --name temp_nginx \
            -p 80:80 \
            -v $(pwd)/../certbot/www:/var/www/certbot:ro \
            -v $(pwd)/letsencrypt-nginx.conf:/etc/nginx/nginx.conf:ro \
            nginx:alpine

        # Create temporary nginx config for Let's Encrypt
        cat > letsencrypt-nginx.conf <<EOF
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
    }
}
EOF

        # Reload nginx
        docker exec temp_nginx nginx -s reload

        # Run certbot
        docker-compose -f ../docker-compose.certbot.yml run --rm certbot

        # Copy certificates to ssl directory
        cp ../certbot/conf/live/$DOMAIN/fullchain.pem $SSL_DIR/
        cp ../certbot/conf/live/$DOMAIN/privkey.pem $SSL_DIR/

        # Stop temporary nginx
        docker stop temp_nginx
        docker rm temp_nginx

        # Set correct permissions
        chmod 644 $SSL_DIR/fullchain.pem
        chmod 600 $SSL_DIR/privkey.pem

        echo "✓ Let's Encrypt certificates obtained successfully!"
        echo ""
        echo "Note: Set up auto-renewal with: ./scripts/renew-ssl.sh"
        ;;

    3)
        echo ""
        echo "==================================="
        echo "Option 3: Self-Signed Certificates"
        echo "==================================="
        echo ""
        echo "WARNING: Self-signed certificates should only be used for testing!"
        echo ""
        read -p "Continue? (y/n): " confirm

        if [ "$confirm" != "y" ]; then
            exit 0
        fi

        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout $SSL_DIR/privkey.pem \
            -out $SSL_DIR/fullchain.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

        # Set correct permissions
        chmod 644 $SSL_DIR/fullchain.pem
        chmod 600 $SSL_DIR/privkey.pem

        echo "✓ Self-signed certificate generated!"
        ;;

    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "==================================="
echo "SSL Setup Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Update .env file with your domain: DOMAIN=$DOMAIN"
echo "2. Update nginx/nginx.conf and replace 'yourdomain.com' with '$DOMAIN'"
echo "3. Start the application: docker-compose up -d"
echo ""
