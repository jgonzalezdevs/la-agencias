# Docker Deployment Documentation

## Quick Start

For full deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

### Quick Deploy (3 Steps)

```bash
# 1. Configure environment
cp .env.production .env
nano .env  # Update DOMAIN, passwords, and secrets

# 2. Set up SSL
./scripts/setup-ssl.sh yourdomain.com

# 3. Deploy
./scripts/deploy.sh
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Internet (HTTPS)                      │
└────────────────────┬────────────────────────────────────┘
                     │ Port 443 (SSL)
                     ▼
          ┌──────────────────────┐
          │   Nginx Reverse      │
          │   Proxy Container    │
          │  (SSL Termination)   │
          └──────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐         ┌──────────────┐
│   Frontend   │         │   Backend    │
│   (Angular)  │         │  (FastAPI)   │
│   Container  │         │  Container   │
└──────────────┘         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  PostgreSQL  │
                         │   Database   │
                         │  Container   │
                         └──────────────┘
```

## Docker Services

### 1. Database (PostgreSQL 16)
- **Container**: `boleteria_db`
- **Port**: 5432 (internal only)
- **Volume**: `postgres_data` (persisted data)
- **Health check**: Checks PostgreSQL readiness every 10s

### 2. Backend (FastAPI)
- **Container**: `boleteria_backend`
- **Port**: 8000 (internal only)
- **Dependencies**: Waits for database to be healthy
- **Features**:
  - Auto-runs database migrations on startup
  - Health check endpoint at `/health`
  - Hot reload in development (volume mounted)

### 3. Frontend (Angular + Nginx)
- **Container**: `boleteria_frontend`
- **Port**: 80 (internal only)
- **Features**:
  - Production-optimized Angular build
  - Static file caching
  - Gzip compression
  - SPA routing support

### 4. Nginx Reverse Proxy
- **Container**: `boleteria_nginx`
- **Ports**:
  - 80 (HTTP - redirects to HTTPS)
  - 443 (HTTPS)
- **Features**:
  - SSL/TLS termination
  - HTTP to HTTPS redirect
  - Rate limiting on API and login endpoints
  - Security headers (HSTS, XSS protection, etc.)
  - Static asset caching
  - Gzip compression

## File Structure

```
/home/jligo/leandro/
├── backend/
│   ├── Dockerfile              # Backend Docker image
│   ├── .dockerignore           # Files to exclude from image
│   └── app/                    # FastAPI application
│
├── frontend/
│   ├── Dockerfile              # Frontend Docker image (multi-stage)
│   ├── nginx.conf              # Frontend Nginx config
│   ├── .dockerignore           # Files to exclude from image
│   └── src/                    # Angular application
│
├── nginx/
│   └── nginx.conf              # Reverse proxy configuration
│
├── ssl/                        # SSL certificates (not in git)
│   ├── fullchain.pem           # SSL certificate + CA bundle
│   └── privkey.pem             # Private key
│
├── scripts/                    # Deployment and maintenance scripts
│   ├── deploy.sh               # Main deployment script
│   ├── setup-ssl.sh            # SSL setup wizard
│   ├── update-app.sh           # Update running application
│   ├── backup-db.sh            # Database backup
│   ├── restore-db.sh           # Database restore
│   └── renew-ssl.sh            # SSL renewal (Let's Encrypt)
│
├── docker-compose.yml          # Production orchestration
├── .env                        # Environment variables (not in git)
├── .env.production             # Environment template
└── DEPLOYMENT.md               # Complete deployment guide
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Your domain name | `example.com` |
| `POSTGRES_PASSWORD` | Database password | `strong_password_123` |
| `SECRET_KEY` | JWT secret key | `random_32_char_string` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `boleteria_db` |
| `POSTGRES_USER` | Database user | `postgres` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiration | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token expiration | `7` |
| `DEBUG` | Debug mode | `False` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |

## Docker Commands

### Basic Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Check service status
docker-compose ps

# Restart a service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build
```

### Service Management

```bash
# Scale services (if needed)
docker-compose up -d --scale backend=2

# Execute command in container
docker-compose exec backend python -c "print('Hello')"

# Access backend shell
docker-compose exec backend bash

# Access database shell
docker-compose exec db psql -U postgres -d boleteria_db

# View container resource usage
docker stats
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Rollback migration
docker-compose exec backend alembic downgrade -1

# Database backup
./scripts/backup-db.sh

# Database restore
./scripts/restore-db.sh backups/file.sql.gz
```

### Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune -a

# Remove all unused Docker resources
docker system prune -a

# Remove volumes (WARNING: deletes database!)
docker-compose down -v
```

## Networking

### Docker Network

All services communicate through a private Docker bridge network: `boleteria_network`

Internal service communication:
- Backend → Database: `db:5432`
- Nginx → Backend: `backend:8000`
- Nginx → Frontend: `frontend:80`

### Port Exposure

Only Nginx exposes ports to the host:
- Port 80 (HTTP) → Redirects to HTTPS
- Port 443 (HTTPS) → Public access

## Volumes

### Persistent Volumes

1. **postgres_data**: Database files
   - Location: Docker managed volume
   - Persists across container restarts
   - Backed up via `backup-db.sh`

### Bind Mounts (Development)

```yaml
# Uncomment in docker-compose.yml for development
volumes:
  - ./backend/app:/app/app:ro  # Hot reload for backend
```

## Security Features

### Container Security
- ✅ Non-root users in all containers
- ✅ Minimal base images (Alpine Linux)
- ✅ Read-only root filesystems where possible
- ✅ No privileged containers

### Network Security
- ✅ Private Docker network
- ✅ Only Nginx exposed to internet
- ✅ Rate limiting on API endpoints
- ✅ Stricter rate limiting on login

### SSL/TLS Security
- ✅ TLS 1.2 and 1.3 only
- ✅ Strong cipher suites (Mozilla Intermediate)
- ✅ OCSP stapling
- ✅ Optional HSTS with preload

### Application Security
- ✅ Security headers (X-Frame-Options, CSP, etc.)
- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Input validation with Pydantic

## Health Checks

All services have health checks configured:

### Database
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### Backend
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Frontend & Nginx
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost/ || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
```

Check health status:
```bash
docker-compose ps
# Healthy services show "(healthy)" status
```

## Performance Tuning

### Nginx Optimization
- Gzip compression enabled
- Static asset caching (1 year)
- Keep-alive connections
- Worker processes: auto (CPU cores)
- Worker connections: 2048

### Database Optimization
- Connection pooling in SQLAlchemy
- Async operations with asyncpg
- Indexes on frequently queried columns

### Frontend Optimization
- Production build with Angular CLI
- AOT compilation
- Tree shaking
- Minification and bundling

## Scaling Considerations

### Horizontal Scaling

To scale horizontally, you'll need:

1. **Load balancer** in front of Nginx
2. **Shared session storage** (Redis)
3. **External database** (managed PostgreSQL)
4. **Shared file storage** (S3, NFS)

Example scaling:
```bash
# Run multiple backend instances
docker-compose up -d --scale backend=3

# Nginx will load balance automatically (using upstream)
```

### Vertical Scaling

Adjust resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f backend

# Follow new logs only
docker-compose logs -f --since 10m
```

### Resource Usage

```bash
# Real-time stats
docker stats

# Disk usage
docker system df
```

### Health Monitoring

```bash
# Check all services are healthy
docker-compose ps

# Check specific endpoint
curl https://yourdomain.com/health
curl https://yourdomain.com/api/v1/docs
```

## Backup Strategy

### Database Backups

**Automated** (via cron):
```bash
# Daily at 2 AM
0 2 * * * cd /home/jligo/leandro && ./scripts/backup-db.sh >> logs/backup.log 2>&1
```

**Manual**:
```bash
./scripts/backup-db.sh
```

Backups are stored in `./backups/` and automatically cleaned up after 7 days.

### Volume Backups

```bash
# Backup postgres_data volume
docker run --rm -v boleteria_postgres_data:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_volume_$(date +%Y%m%d).tar.gz /data
```

### Configuration Backups

Keep these files in git:
- `docker-compose.yml`
- `nginx/nginx.conf`
- `backend/Dockerfile`
- `frontend/Dockerfile`

Keep these files secure (not in git):
- `.env`
- `ssl/*`

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps db

# Check logs
docker-compose logs db

# Verify connection string
docker-compose exec backend env | grep DATABASE_URL

# Test connection
docker-compose exec backend python -c "
from sqlalchemy import create_engine
from app.core.config import get_settings
engine = create_engine(get_settings().DATABASE_URL)
print('Connected!' if engine else 'Failed')
"
```

### SSL Certificate Issues

```bash
# Verify certificates exist
ls -lh ssl/

# Check nginx config
docker-compose exec nginx nginx -t

# Reload nginx
docker-compose exec nginx nginx -s reload

# View nginx error log
docker-compose logs nginx | grep error
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a --volumes

# Remove old backups
find backups/ -name "*.sql.gz" -mtime +30 -delete
```

## Development vs Production

### Development Setup

```yaml
# docker-compose.dev.yml
services:
  backend:
    command: uvicorn app.main:app --reload --host 0.0.0.0
    volumes:
      - ./backend/app:/app/app  # Hot reload
    environment:
      - DEBUG=True

  frontend:
    command: npm start
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "4200:4200"
```

Run development:
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production Setup

Production uses:
- Optimized builds
- No volume mounts (except data)
- Health checks
- Restart policies
- Security hardening

## Best Practices

1. **Always use `.env` files** - Never hardcode secrets
2. **Regular backups** - Automate database backups
3. **Monitor logs** - Check logs regularly for errors
4. **Keep images updated** - Rebuild periodically for security updates
5. **Test before deploying** - Test in staging environment
6. **Use health checks** - Ensure services are actually working
7. **Limit resources** - Prevent containers from consuming all resources
8. **Version control** - Keep Dockerfiles and configs in git
9. **Document changes** - Update this file when making changes
10. **Security first** - Keep secrets secure, use HTTPS, enable firewall

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PostgreSQL on Docker](https://hub.docker.com/_/postgres)
- [FastAPI in Docker](https://fastapi.tiangolo.com/deployment/docker/)
