# Production Deployment Guide

This guide will help you deploy the Boletería application to production on your Contabo VPS using Docker, Nginx, and SSL certificates.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Server Setup](#initial-server-setup)
- [DNS Configuration](#dns-configuration)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Application Deployment](#application-deployment)
- [Post-Deployment](#post-deployment)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

1. **VPS Server** (Contabo Linux instance)
   - SSH access to your server
   - Root or sudo privileges
   - Minimum 2GB RAM, 2 CPU cores recommended

2. **Domain Name** (from Namecheap)
   - Domain configured and accessible
   - Ability to modify DNS records

3. **SSL Certificates**
   - SSL certificate files from Namecheap, OR
   - Ability to use Let's Encrypt (free)

4. **Application Files**
   - This repository cloned on your server

## Initial Server Setup

### 1. Connect to Your VPS

```bash
ssh root@your-server-ip
# or
ssh your-username@your-server-ip
```

### 2. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Required Software

The deployment script will install Docker automatically, but you can do it manually:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes to take effect
```

### 4. Configure Firewall

```bash
# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## DNS Configuration

### Configure Your Domain on Namecheap

1. Log in to your Namecheap account
2. Go to **Domain List** → Select your domain → **Manage**
3. Go to **Advanced DNS**
4. Add/modify the following records:

```
Type    Host    Value               TTL
A       @       your-server-ip      Automatic
A       www     your-server-ip      Automatic
```

5. Wait for DNS propagation (can take 5 minutes to 48 hours, usually < 1 hour)

### Verify DNS Configuration

```bash
# Check if domain points to your server
dig yourdomain.com
nslookup yourdomain.com
```

## SSL Certificate Setup

You have three options for SSL certificates:

### Option 1: Use Your Namecheap SSL Certificates (Recommended if you already have them)

1. Download your SSL certificate files from Namecheap
2. You should have:
   - Certificate file (e.g., `certificate.crt` or `yourdomain.crt`)
   - Private key file (e.g., `private.key`)
   - CA Bundle file (e.g., `ca_bundle.crt`)

3. Transfer files to your server:

```bash
# On your local machine
scp certificate.crt ca_bundle.crt private.key user@your-server:/home/user/
```

4. On your server, combine certificate and CA bundle:

```bash
cd /home/jligo/leandro
mkdir -p ssl

# Combine certificate and CA bundle into fullchain
cat ~/certificate.crt ~/ca_bundle.crt > ssl/fullchain.pem

# Copy private key
cp ~/private.key ssl/privkey.pem

# Set correct permissions
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem

# Remove original files (for security)
rm ~/certificate.crt ~/ca_bundle.crt ~/private.key
```

### Option 2: Use Let's Encrypt (Free, Auto-Renewing)

```bash
cd /home/jligo/leandro
./scripts/setup-ssl.sh yourdomain.com

# Choose option 2 when prompted
```

This will:
- Obtain free SSL certificates from Let's Encrypt
- Set up automatic renewal
- Configure nginx for HTTPS

### Option 3: Self-Signed Certificates (Testing Only)

```bash
cd /home/jligo/leandro
./scripts/setup-ssl.sh yourdomain.com

# Choose option 3 when prompted
```

**Warning**: Self-signed certificates will show security warnings in browsers. Use only for testing.

## Application Deployment

### 1. Clone Repository

```bash
cd /home/jligo
git clone https://github.com/yourusername/leandro.git
cd leandro
```

### 2. Configure Environment Variables

```bash
# Copy the production environment template
cp .env.production .env

# Edit the .env file with your configuration
nano .env
```

**Required changes in `.env`:**

```bash
# Change this to your actual domain
DOMAIN=yourdomain.com

# Set a strong database password
POSTGRES_PASSWORD=your_strong_database_password_here

# Generate a strong secret key (use the command below)
SECRET_KEY=your_random_secret_key_at_least_32_characters_long

# Optional: Configure Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Generate a secure secret key:**

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy the output to SECRET_KEY in .env
```

### 3. Update Nginx Configuration

Update the nginx configuration with your domain:

```bash
# Edit nginx/nginx.conf
nano nginx/nginx.conf

# Replace 'yourdomain.com' with your actual domain
# Use Find & Replace in nano: Ctrl+\ then type 'yourdomain.com'
```

### 4. Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

### 5. Deploy the Application

```bash
# Run the deployment script
./scripts/deploy.sh
```

The script will:
1. Install Docker and Docker Compose (if needed)
2. Configure firewall rules
3. Build Docker images
4. Start all services (database, backend, frontend, nginx)
5. Run database migrations

### 6. Verify Deployment

```bash
# Check all services are running
docker-compose ps

# All services should show "Up" and "healthy"

# Check logs
docker-compose logs -f

# Press Ctrl+C to exit logs
```

Visit your website:
- https://yourdomain.com (should load your Angular frontend)
- https://yourdomain.com/api/v1/docs (should show API documentation)

## Post-Deployment

### 1. Set Up Automatic Backups

Create a cron job for daily database backups:

```bash
# Open crontab editor
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * cd /home/jligo/leandro && ./scripts/backup-db.sh >> logs/backup.log 2>&1
```

### 2. Set Up SSL Auto-Renewal (Let's Encrypt Only)

If using Let's Encrypt:

```bash
# Open crontab editor
crontab -e

# Add this line to renew SSL monthly
0 0 1 * * cd /home/jligo/leandro && ./scripts/renew-ssl.sh >> logs/ssl-renewal.log 2>&1
```

### 3. Enable HSTS (After Testing)

After verifying SSL works correctly, enable HSTS in `nginx/nginx.conf`:

```nginx
# Uncomment this line in the HTTPS server block
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

Then reload nginx:

```bash
docker-compose exec nginx nginx -s reload
```

### 4. Set Up Monitoring (Optional)

Consider setting up monitoring tools:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Server monitoring**: Netdata, Prometheus + Grafana
- **Error tracking**: Sentry

## Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Update Application

```bash
cd /home/jligo/leandro
./scripts/update-app.sh
```

This will:
1. Pull latest code from git
2. Backup database
3. Rebuild images
4. Restart services
5. Run migrations

### Database Backup

```bash
# Manual backup
./scripts/backup-db.sh

# Backups are stored in ./backups/
```

### Database Restore

```bash
# List available backups
ls -lh backups/

# Restore from backup
./scripts/restore-db.sh backups/boleteria_db_YYYYMMDD_HHMMSS.sql.gz
```

### Access Database

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U postgres -d boleteria_db

# Common commands:
# \dt - List tables
# \d tablename - Describe table
# \q - Quit
```

### Stop Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database!)
docker-compose down -v
```

### Start Application

```bash
# Start all services
docker-compose up -d
```

## Troubleshooting

### Services Not Starting

```bash
# Check service status
docker-compose ps

# Check logs for errors
docker-compose logs backend
docker-compose logs db

# Restart services
docker-compose restart
```

### SSL Certificate Errors

```bash
# Verify certificate files exist
ls -lh ssl/

# Check nginx configuration
docker-compose exec nginx nginx -t

# Reload nginx
docker-compose exec nginx nginx -s reload
```

### Database Connection Errors

```bash
# Check if database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Verify database credentials in .env file
cat .env | grep POSTGRES

# Test database connection
docker-compose exec backend python -c "from app.db.session import engine; print('DB OK')"
```

### Backend API Not Responding

```bash
# Check backend logs
docker-compose logs -f backend

# Check backend health
curl http://localhost:8000/health

# Restart backend
docker-compose restart backend

# Check environment variables
docker-compose exec backend env | grep DATABASE_URL
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs -f frontend

# Check nginx logs
docker-compose logs -f nginx

# Verify nginx is proxying correctly
curl -I http://localhost/

# Restart frontend
docker-compose restart frontend nginx
```

### Cannot Access via Domain

1. Verify DNS is configured:
   ```bash
   dig yourdomain.com
   ```

2. Check if ports are open:
   ```bash
   sudo ufw status
   ```

3. Check nginx is listening:
   ```bash
   docker-compose exec nginx netstat -tlnp
   ```

4. Check firewall on VPS provider (Contabo control panel)

### High Memory/CPU Usage

```bash
# Check resource usage
docker stats

# View system resources
htop

# Optimize Docker if needed
docker system prune -a
```

### Need to Reset Everything

```bash
# Stop and remove everything
docker-compose down -v

# Clean up Docker
docker system prune -a

# Redeploy
./scripts/deploy.sh
```

## Security Best Practices

1. **Change default passwords**: Never use default passwords in production
2. **Keep software updated**: Regularly update Docker images and system packages
3. **Use strong secrets**: Generate random, long secret keys
4. **Enable firewall**: Only allow necessary ports (22, 80, 443)
5. **Regular backups**: Automate database backups
6. **Monitor logs**: Regularly check logs for suspicious activity
7. **HTTPS only**: Ensure all traffic uses HTTPS
8. **Limit SSH access**: Consider using SSH keys only, disable password auth

## Performance Optimization

1. **Enable Nginx caching**: Static assets are already cached in the config
2. **Database indexing**: Add indexes for frequently queried columns
3. **CDN**: Consider using CloudFlare for static assets
4. **Database connection pooling**: Already configured in SQLAlchemy
5. **Horizontal scaling**: Use Docker Swarm or Kubernetes for multiple instances

## Support

For issues related to:
- **Application bugs**: Check application logs and GitHub issues
- **Docker issues**: Check Docker documentation
- **Server issues**: Contact Contabo support
- **Domain issues**: Contact Namecheap support
- **SSL issues**: Check certificate provider documentation

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Angular Documentation](https://angular.io/docs)
