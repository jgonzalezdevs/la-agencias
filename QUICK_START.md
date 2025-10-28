# Quick Start Guide - Production Deployment

This is a condensed guide for deploying the Boletería application to production. For detailed instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Prerequisites Checklist

- [ ] VPS Server (Contabo) with SSH access
- [ ] Domain name (Namecheap) with access to DNS settings
- [ ] SSL certificates OR ability to use Let's Encrypt

## 5-Minute Setup

### Step 1: Connect to Server & Clone Repository

```bash
ssh root@your-server-ip
cd /home/jligo
git clone <your-repo-url> leandro
cd leandro
```

### Step 2: Configure DNS (Namecheap)

1. Go to Namecheap → Domain List → Your Domain → Advanced DNS
2. Add A records:
   - Host: `@` → Value: `your-server-ip`
   - Host: `www` → Value: `your-server-ip`
3. Wait 5-30 minutes for DNS propagation

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.production .env

# Edit configuration
nano .env
```

**Required changes:**
```bash
DOMAIN=yourdomain.com
POSTGRES_PASSWORD=your_strong_password_here
SECRET_KEY=your_random_32_character_secret_key_here
```

**Generate secret key:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 4: Update Nginx Configuration

```bash
nano nginx/nginx.conf
# Replace all instances of 'yourdomain.com' with your actual domain
# Save and exit (Ctrl+X, Y, Enter)
```

### Step 5: Setup SSL Certificates

**Option A: If you have SSL certificates from Namecheap**

```bash
# Transfer your certificate files to the server, then:
mkdir -p ssl
cat certificate.crt ca_bundle.crt > ssl/fullchain.pem
cp private.key ssl/privkey.pem
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem
```

**Option B: Use Let's Encrypt (free)**

```bash
./scripts/setup-ssl.sh yourdomain.com
# Choose option 2
```

### Step 6: Deploy

```bash
./scripts/deploy.sh
```

That's it! Your application should now be running at:
- **Frontend**: https://yourdomain.com
- **API Docs**: https://yourdomain.com/api/v1/docs

## Verification

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f

# Test website
curl https://yourdomain.com
```

## Common Commands

```bash
# View logs
./scripts/logs.sh              # All services
./scripts/logs.sh backend      # Backend only

# Backup database
./scripts/backup-db.sh

# Restart services
docker-compose restart

# Stop everything
docker-compose down

# Update application
./scripts/update-app.sh
```

## Post-Deployment Tasks

### 1. Enable Automatic Backups

```bash
crontab -e
# Add this line for daily backup at 2 AM:
0 2 * * * cd /home/jligo/leandro && ./scripts/backup-db.sh >> logs/backup.log 2>&1
```

### 2. Enable SSL Auto-Renewal (Let's Encrypt only)

```bash
crontab -e
# Add this line for monthly renewal:
0 0 1 * * cd /home/jligo/leandro && ./scripts/renew-ssl.sh >> logs/ssl-renewal.log 2>&1
```

### 3. Enable HSTS (After Testing SSL)

Once you confirm SSL is working:

```bash
nano nginx/nginx.conf
# Uncomment this line in the HTTPS server block:
# add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Reload nginx
docker-compose exec nginx nginx -s reload
```

## Troubleshooting Quick Fixes

### Services not healthy

```bash
docker-compose ps
docker-compose logs [service-name]
docker-compose restart [service-name]
```

### SSL certificate errors

```bash
ls -lh ssl/
docker-compose exec nginx nginx -t
docker-compose restart nginx
```

### Database connection errors

```bash
docker-compose logs db
docker-compose restart db backend
```

### Cannot access via domain

```bash
# Check DNS
dig yourdomain.com

# Check firewall
sudo ufw status

# Check if nginx is listening
docker-compose ps nginx
```

## Need Help?

- **Full deployment guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Docker documentation**: [README_DOCKER.md](README_DOCKER.md)
- **View logs**: `./scripts/logs.sh`
- **Check service status**: `docker-compose ps`

## Security Reminders

- ✅ Use strong passwords in `.env`
- ✅ Never commit `.env` to git
- ✅ Keep SSL certificates secure
- ✅ Enable firewall (ports 22, 80, 443 only)
- ✅ Set up automatic backups
- ✅ Monitor logs regularly

## Architecture

```
Internet (HTTPS)
      ↓
Nginx (Port 443) - SSL Termination
      ↓
   ┌──┴──┐
   ↓     ↓
Frontend  Backend (Port 8000)
(Angular)    ↓
          Database
        (PostgreSQL)
```

All services run in isolated Docker containers on a private network. Only Nginx is exposed to the internet.
