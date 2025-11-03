# Progreso de Despliegue - La Agencias

**Fecha**: 28 de Octubre 2025
**Dominio**: la-agencias.com
**Servidor**: Contabo VPS (147.93.184.102)

---

## ✅ Completado

### 1. Configuración del Servidor
- ✅ Ubuntu 24.04 LTS instalado
- ✅ Sistema actualizado (`apt update && apt upgrade`)
- ✅ Docker instalado (v28.5.1)
- ✅ Docker Compose instalado (v2.40.2)

### 2. Configuración de Red y Seguridad
- ✅ Firewall configurado (UFW)
  - Puerto 22 (SSH)
  - Puerto 80 (HTTP)
  - Puerto 443 (HTTPS)
- ✅ DNS configurado en Namecheap
  - A Record: @ → 147.93.184.102
  - A Record: www → 147.93.184.102
  - ✅ DNS propagado correctamente

### 3. Código de la Aplicación
- ✅ Repositorio clonado desde GitHub
  - URL: https://github.com/jgonzalezdevs/la-agencias
  - Ubicación: `/root/la-agencias`

### 4. Configuración de la Aplicación
- ✅ Archivo `.env` creado y configurado
  - Dominio: la-agencias.com
  - Contraseña de base de datos configurada
  - Secret key generado
- ✅ Nginx configurado con el dominio (la-agencias.com)
- ✅ Scripts ejecutables (`chmod +x scripts/*.sh`)

### 5. SSL/TLS
- ✅ Certificados Let's Encrypt obtenidos exitosamente
  - Certificado: `/root/la-agencias/ssl/fullchain.pem`
  - Clave privada: `/root/la-agencias/ssl/privkey.pem`
  - Expira: 25 de Enero 2026
  - Incluye: la-agencias.com y www.la-agencias.com

### 6. Docker
- ✅ Dockerfile del backend listo
- ✅ Dockerfile del frontend corregido
  - Cambio aplicado: `npm ci` → `npm install`
- ✅ Docker Compose configurado

---

## ⏳ Pendiente para Mañana

### 1. Construcción de Imágenes Docker (10-15 minutos)

**Ubicación**: `/root/la-agencias`

**Comando a ejecutar**:
```bash
cd /root/la-agencias
docker-compose build --no-cache
```

**Qué esperar**:
- Construcción del backend (FastAPI) - 2-3 minutos
- Construcción del frontend (Angular) - 10-12 minutos
  - Descargará muchas dependencias npm
  - Compilará la aplicación Angular

**Posibles problemas**:
- Si falla por memoria: Agregar swap (ver sección "Troubleshooting")
- Si falla alguna dependencia: Verificar logs y ajustar

---

### 2. Iniciar los Servicios (5 minutos)

**Comando**:
```bash
docker-compose up -d
```

**Esto iniciará**:
- PostgreSQL (base de datos)
- Backend (FastAPI)
- Frontend (Angular)
- Nginx (reverse proxy con SSL)

**Verificar estado**:
```bash
docker-compose ps
```

Todos los servicios deben mostrar "Up" y "(healthy)".

---

### 3. Verificar Logs (2-3 minutos)

**Ver logs de todos los servicios**:
```bash
docker-compose logs -f
```

**Ver logs específicos**:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
docker-compose logs -f nginx
```

O usar el script:
```bash
./scripts/logs.sh backend
./scripts/logs.sh frontend
```

**Qué buscar**:
- Backend: "Uvicorn running on http://0.0.0.0:8000"
- Database: "database system is ready to accept connections"
- Nginx: Sin errores de SSL

---

### 4. Ejecutar Migraciones de Base de Datos (1 minuto)

**Comando**:
```bash
docker-compose exec backend alembic upgrade head
```

**Qué hace**:
- Crea todas las tablas en la base de datos
- Aplica el esquema definido en los modelos

---

### 5. Verificar Funcionamiento (5 minutos)

**Probar desde el servidor**:
```bash
curl https://la-agencias.com
curl https://la-agencias.com/api/v1/docs
```

**Probar desde el navegador**:
1. Abrir: https://la-agencias.com
   - Debería cargar el frontend Angular
2. Abrir: https://la-agencias.com/api/v1/docs
   - Debería mostrar la documentación de la API (Swagger)

**Health checks**:
```bash
curl https://la-agencias.com/health
curl http://localhost:8000/health
```

---

### 6. Configurar Auto-Renovación SSL (2 minutos)

**Agregar cron job para renovación automática**:
```bash
crontab -e
```

**Agregar esta línea** (renueva el primer día de cada mes):
```
0 0 1 * * cd /root/la-agencias && ./scripts/renew-ssl.sh >> logs/ssl-renewal.log 2>&1
```

---

### 7. Configurar Backups Automáticos (2 minutos)

**Agregar cron job para backups diarios**:
```bash
crontab -e
```

**Agregar esta línea** (backup diario a las 2 AM):
```
0 2 * * * cd /root/la-agencias && ./scripts/backup-db.sh >> logs/backup.log 2>&1
```

**Crear directorio de logs**:
```bash
mkdir -p /root/la-agencias/logs
```

---

### 8. (Opcional) Habilitar HSTS

**Después de confirmar que SSL funciona correctamente**, editar nginx:

```bash
nano nginx/nginx.conf
```

Buscar esta línea (está comentada):
```nginx
# add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

Descomentarla (quitar el #):
```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

Recargar nginx:
```bash
docker-compose exec nginx nginx -s reload
```

---

## 📝 Resumen de Comandos para Mañana

```bash
# 1. Conectarse al servidor
ssh root@147.93.184.102

# 2. Ir al directorio del proyecto
cd /root/la-agencias

# 3. Construir las imágenes
docker-compose build --no-cache

# 4. Iniciar los servicios
docker-compose up -d

# 5. Ver logs
docker-compose logs -f

# 6. Verificar estado
docker-compose ps

# 7. Ejecutar migraciones
docker-compose exec backend alembic upgrade head

# 8. Probar la aplicación
curl https://la-agencias.com
curl https://la-agencias.com/api/v1/docs

# 9. Configurar backups y SSL renewal
crontab -e
# (agregar las líneas mencionadas arriba)
```

---

## 🔧 Troubleshooting

### Si falla el build por falta de memoria

**Agregar swap de 2GB**:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
```

### Si el backend no inicia

**Verificar logs**:
```bash
docker-compose logs backend
```

**Verificar conexión a base de datos**:
```bash
docker-compose exec backend python -c "from app.db.session import engine; print('DB OK')"
```

### Si el frontend no carga

**Verificar logs**:
```bash
docker-compose logs frontend
docker-compose logs nginx
```

**Reconstruir solo frontend**:
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Si hay error de SSL

**Verificar certificados**:
```bash
ls -la ssl/
```

**Verificar configuración nginx**:
```bash
docker-compose exec nginx nginx -t
```

**Recargar nginx**:
```bash
docker-compose restart nginx
```

### Si la base de datos no inicia

**Ver logs**:
```bash
docker-compose logs db
```

**Recrear contenedor de base de datos**:
```bash
docker-compose down
docker-compose up -d db
docker-compose logs -f db
```

---

## 📊 Arquitectura Desplegada

```
Internet (HTTPS)
      ↓
 Port 443 (SSL)
      ↓
┌─────────────────┐
│  Nginx Proxy    │  (SSL Termination)
│  (Container)    │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌──────────┐
│Frontend │ │ Backend  │
│Angular  │ │ FastAPI  │
│(Port 80)│ │(Port 8000)│
└─────────┘ └────┬─────┘
                 │
                 ↓
          ┌─────────────┐
          │ PostgreSQL  │
          │  Database   │
          │ (Port 5432) │
          └─────────────┘
```

**Red interna Docker**: `boleteria_network`
**Expuesto al exterior**: Solo Nginx en puertos 80 y 443

---

## 📋 Información del Sistema

| Item | Detalle |
|------|---------|
| **Servidor** | Contabo VPS |
| **OS** | Ubuntu 24.04.3 LTS |
| **IP** | 147.93.184.102 |
| **Dominio** | la-agencias.com |
| **SSL** | Let's Encrypt (expira 2026-01-25) |
| **Docker** | v28.5.1 |
| **Docker Compose** | v2.40.2 |
| **Ubicación código** | /root/la-agencias |

---

## 🔐 Archivos Importantes

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| Variables de entorno | `/root/la-agencias/.env` | Contraseñas, secrets, configuración |
| SSL Certificate | `/root/la-agencias/ssl/fullchain.pem` | Certificado SSL público |
| SSL Private Key | `/root/la-agencias/ssl/privkey.pem` | Clave privada SSL |
| Nginx Config | `/root/la-agencias/nginx/nginx.conf` | Configuración del proxy |
| Docker Compose | `/root/la-agencias/docker-compose.yml` | Orquestación de servicios |
| Scripts | `/root/la-agencias/scripts/` | Scripts de mantenimiento |

---

## 🎯 Tiempo Estimado Total para Mañana

- Construcción de imágenes: **10-15 minutos**
- Inicio de servicios: **5 minutos**
- Verificación: **5 minutos**
- Configuración final: **5 minutos**

**Total: ~30 minutos**

---

## 📞 Comandos Útiles

```bash
# Ver todos los contenedores
docker ps -a

# Ver uso de recursos
docker stats

# Reiniciar un servicio
docker-compose restart backend

# Parar todo
docker-compose down

# Ver logs en tiempo real
./scripts/logs.sh

# Backup manual
./scripts/backup-db.sh

# Estado de servicios
docker-compose ps
```

---

## ✅ Checklist Final

Una vez todo funcione, verificar:

- [ ] Frontend carga en https://la-agencias.com
- [ ] API docs en https://la-agencias.com/api/v1/docs
- [ ] SSL válido (candado verde en navegador)
- [ ] Todos los servicios "healthy": `docker-compose ps`
- [ ] Backups automáticos configurados
- [ ] SSL auto-renewal configurado
- [ ] Sin errores en logs: `docker-compose logs`

---

**¡Mañana continuamos desde el paso de construcción de imágenes!** 🚀

Cualquier duda, consulta este documento y los otros:
- `DEPLOYMENT.md` - Guía completa
- `README_DOCKER.md` - Detalles técnicos de Docker
- `QUICK_START.md` - Referencia rápida

---

## 🔧 FIX: Error de Bcrypt en Docker (29 Octubre 2025)

### Problema Identificado
Error al registrar usuarios en el backend de Docker:
```
ValueError: password cannot be longer than 72 bytes, truncate manually if necessary
```

**Causa**: La imagen de Docker no tenía las dependencias necesarias para compilar la extensión C de bcrypt, haciendo que use una implementación Python pura más estricta.

### Solución Aplicada
Se modificó el `Dockerfile` del backend para incluir:

**Builder stage** - Dependencias de compilación:
```dockerfile
gcc
g++
libffi-dev
```

**Production stage** - Dependencias de runtime:
```dockerfile
libffi8
```

### Cómo Reconstruir la Imagen

**Si estás usando docker-compose (RECOMENDADO)**:
```bash
# Detener servicios
docker-compose down

# Reconstruir SOLO el backend sin caché
docker-compose build --no-cache backend

# Levantar servicios
docker-compose up -d

# Verificar logs
docker-compose logs -f backend
```

**Si usas Docker directamente**:
```bash
# Detener y eliminar contenedor viejo
docker stop boleteria_backend
docker rm boleteria_backend

# Reconstruir imagen
cd /root/la-agencias
docker build --no-cache -t boleteria-backend:latest ./backend

# Reiniciar servicios
docker-compose up -d
```

### Verificación
Después de reconstruir, prueba el registro:
```bash
curl -X POST https://la-agencias.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "full_name": "Test User"
  }'
```

Debe responder exitosamente sin el error de bcrypt.

### Archivos Modificados
- `backend/Dockerfile` - Líneas 11-16 (builder) y 39-42 (production)
