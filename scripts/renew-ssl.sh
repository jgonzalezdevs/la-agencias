#!/bin/bash

# SSL Certificate Renewal Script (for Let's Encrypt)
# Add this to cron for automatic renewal: 0 0 1 * * /path/to/renew-ssl.sh

set -e

echo "==================================="
echo "SSL Certificate Renewal"
echo "==================================="
echo ""

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found!"
    exit 1
fi

SSL_DIR="./ssl"
CERTBOT_DIR="./certbot"

# Check if using Let's Encrypt
if [ ! -d "$CERTBOT_DIR/conf" ]; then
    echo "Not using Let's Encrypt certificates. Skipping renewal."
    exit 0
fi

echo "Renewing certificates for: $DOMAIN"

# Renew certificates
docker run --rm \
    -v $(pwd)/certbot/conf:/etc/letsencrypt \
    -v $(pwd)/certbot/www:/var/www/certbot \
    certbot/certbot renew --webroot -w /var/www/certbot

# Copy renewed certificates
if [ -f "$CERTBOT_DIR/conf/live/$DOMAIN/fullchain.pem" ]; then
    cp $CERTBOT_DIR/conf/live/$DOMAIN/fullchain.pem $SSL_DIR/
    cp $CERTBOT_DIR/conf/live/$DOMAIN/privkey.pem $SSL_DIR/

    # Set correct permissions
    chmod 644 $SSL_DIR/fullchain.pem
    chmod 600 $SSL_DIR/privkey.pem

    echo "✓ Certificates renewed successfully!"

    # Reload nginx
    docker-compose exec nginx nginx -s reload
    echo "✓ Nginx reloaded"
else
    echo "✗ Certificate renewal failed!"
    exit 1
fi

echo ""
echo "Next renewal check: $(date -d '+60 days' '+%Y-%m-%d')"
