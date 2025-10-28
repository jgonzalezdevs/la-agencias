# 🔧 Solución al Problema de Login en Frontend

## ✅ Cambios Realizados en el Frontend

He corregido la integración del frontend con el backend actualizado:

### 1. **Modelo TokenResponse Actualizado**
**Archivo**: `frontend/src/app/shared/models/auth.model.ts`

✅ Agregado campo `refresh_token` a las interfaces:
- `TokenResponse` ahora incluye: `access_token`, `refresh_token`, `token_type`
- `GoogleAuthResponse` ahora incluye: `access_token`, `refresh_token`, `token_type`

### 2. **AuthService Actualizado**
**Archivo**: `frontend/src/app/shared/services/auth.service.ts`

✅ **Almacenamiento de Refresh Token**:
- Agregada propiedad `refreshTokenKey = 'refresh_token'`
- Método `getRefreshToken()` para obtener el refresh token del localStorage
- `handleAuthSuccess()` ahora guarda ambos tokens (access y refresh)
- `logout()` ahora elimina ambos tokens

✅ **Método refreshToken() Corregido**:
```typescript
// ANTES (incorrecto):
refreshToken(): Observable<TokenResponse> {
  return this.http.post<TokenResponse>(`${this.apiUrl}/auth/refresh`, {})
}

// AHORA (correcto):
refreshToken(): Observable<TokenResponse> {
  const refreshToken = this.getRefreshToken();
  return this.http.post<TokenResponse>(`${this.apiUrl}/auth/refresh`, {
    refresh_token: refreshToken  // Envía el refresh token en el body
  }).pipe(
    tap(response => {
      // Guarda ambos tokens (rotación de tokens)
      localStorage.setItem(this.tokenKey, response.access_token);
      localStorage.setItem(this.refreshTokenKey, response.refresh_token);
    })
  );
}
```

### 3. **Interceptor de Autenticación**
**Archivo**: `frontend/src/app/shared/interceptors/auth.interceptor.ts`

✓ Ya estaba correctamente implementado
✓ Maneja automáticamente errores 401
✓ Intenta refrescar el token cuando expira
✓ Hace logout si el refresh falla

---

## 🔍 Problemas Identificados y Soluciones

### Problema 1: TokenResponse sin refresh_token
**Síntoma**: El backend retorna `refresh_token` pero el frontend no lo procesa.

**Causa**: La interfaz `TokenResponse` solo definía `access_token` y `token_type`.

**Solución**: ✅ Agregado campo `refresh_token` a la interfaz.

---

### Problema 2: Refresh Token no se envía correctamente
**Síntoma**: El endpoint `/auth/refresh` falla con error 401 o 422.

**Causa**:
- Frontend enviaba body vacío: `{}`
- Backend espera: `{refresh_token: "..."}`

**Solución**: ✅ Actualizado método `refreshToken()` para enviar el refresh token en el body.

---

### Problema 3: Refresh Token no se guarda en localStorage
**Síntoma**: No se puede refrescar el token porque no está disponible.

**Causa**: El método `handleAuthSuccess()` solo guardaba el `access_token`.

**Solución**: ✅ Ahora guarda ambos tokens en localStorage.

---

## 🚀 Cómo Probar el Login

### Paso 1: Verificar que el Backend esté Corriendo

```bash
cd /home/jligo/leandro/backend

# Verificar que las dependencias estén instaladas
# Si usas Poetry:
poetry install
poetry shell

# Si usas venv:
source venv/bin/activate
pip install -r requirements.txt  # si tienes requirements.txt

# Iniciar el servidor en el puerto 5050
uvicorn app.main:app --reload --host 0.0.0.0 --port 5050
```

Deberías ver:
```
INFO:     Uvicorn running on http://0.0.0.0:5050 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

### Paso 2: Verificar la Base de Datos

```bash
# Asegúrate de que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Si no está corriendo:
sudo systemctl start postgresql

# Ejecutar migraciones
cd /home/jligo/leandro/backend
alembic upgrade head
```

### Paso 3: Iniciar el Frontend

```bash
cd /home/jligo/leandro/frontend

# Instalar dependencias (si es necesario)
npm install

# Iniciar el servidor de desarrollo
npm start
```

El frontend debería estar en: `http://localhost:4200`

### Paso 4: Probar el Login

#### Opción A: Crear Usuario desde el Frontend

1. Abrir `http://localhost:4200/signup`
2. Llenar el formulario:
   - **First Name**: Test
   - **Last Name**: User
   - **Email**: test@example.com
   - **Password**: test123
   - Marcar "I agree to the Terms and Conditions"
3. Click en "Create Account"
4. Deberías ser redirigido automáticamente al dashboard

#### Opción B: Crear Usuario desde el Backend

```bash
# Usando curl
curl -X POST "http://localhost:5050/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "password": "test123"
  }'
```

O usando Swagger UI:
1. Abrir: `http://localhost:5050/api/v1/docs`
2. Ir a `POST /api/v1/auth/register`
3. Click en "Try it out"
4. Llenar el JSON y ejecutar

#### Opción C: Hacer Login

1. Abrir `http://localhost:4200/signin`
2. Ingresar credenciales:
   - **Email**: test@example.com
   - **Password**: test123
3. Click en "Sign in"
4. Deberías ser redirigido al dashboard

---

## 🔍 Solución de Problemas

### Error: "Login failed. Please check your credentials."

**Posibles causas**:

1. **Backend no está corriendo en el puerto 5050**
   ```bash
   # Verificar:
   curl http://localhost:5050/health

   # Debería retornar:
   {"status":"healthy"}
   ```

2. **Usuario no existe en la base de datos**
   ```bash
   # Conectarse a PostgreSQL y verificar
   sudo -u postgres psql boleteria_db
   SELECT email, is_active FROM users;
   ```

3. **Contraseña incorrecta**
   - Asegúrate de usar la contraseña correcta
   - Las contraseñas son case-sensitive

4. **CORS bloqueado**
   - Verificar la configuración en `backend/.env`:
   ```
   ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:8080
   ```
   - Verificar en la consola del navegador si hay errores CORS

### Error: "Could not validate credentials" después de login exitoso

**Causa**: El token es válido pero el endpoint `/users/me` falla.

**Solución**:
```bash
# Verificar que el endpoint existe
curl -X GET "http://localhost:5050/api/v1/users/me" \
  -H "Authorization: Bearer <TOKEN_AQUI>"
```

### Error de Red: "Http failure response for http://localhost:5050..."

**Causa**: El backend no está accesible.

**Verificar**:
1. Backend está corriendo: `ps aux | grep uvicorn`
2. Puerto 5050 está abierto: `netstat -tuln | grep 5050`
3. No hay firewall bloqueando: `sudo ufw status`

### Error: "Refresh token failed"

**Causa**: El refresh token no está siendo enviado correctamente.

**Verificar en consola del navegador**:
1. Abrir DevTools (F12)
2. Ir a Network tab
3. Buscar la petición a `/auth/refresh`
4. Verificar el Request Payload debe tener: `{"refresh_token": "..."}`
5. Verificar el Response debe tener: `{"access_token": "...", "refresh_token": "...", "token_type": "bearer"}`

---

## 🧪 Pruebas Manuales

### 1. Login Básico
```bash
# Desde consola del navegador (F12)
# En la página de login, ejecutar:
localStorage.clear()  // Limpiar storage
# Luego hacer login y verificar:
localStorage.getItem('access_token')    // Debe tener valor
localStorage.getItem('refresh_token')   // Debe tener valor
localStorage.getItem('current_user')    // Debe tener datos del usuario
```

### 2. Refresh Token
```typescript
// Desde consola del navegador
// 1. Obtener el refresh token
const refreshToken = localStorage.getItem('refresh_token');

// 2. Hacer petición manual
fetch('http://localhost:5050/api/v1/auth/refresh', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({refresh_token: refreshToken})
})
.then(r => r.json())
.then(console.log)

// Debería retornar:
// {
//   "access_token": "nuevo_token...",
//   "refresh_token": "nuevo_refresh_token...",
//   "token_type": "bearer"
// }
```

### 3. Verificar Token en JWT.io
1. Copiar el `access_token` de localStorage
2. Ir a: https://jwt.io/
3. Pegar el token en el campo "Encoded"
4. Verificar el payload:
   ```json
   {
     "sub": "test@example.com",
     "exp": 1234567890,
     "type": "access"
   }
   ```

---

## 📊 Flujo Completo de Autenticación

```
┌──────────────┐
│ Usuario      │
│ hace login   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Frontend: signin-form.component.ts   │
│ - Valida email y password            │
│ - Llama authService.login()          │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Frontend: auth.service.ts            │
│ - POST /auth/login con FormData      │
│   username=email, password=password  │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Backend: auth.py - login()           │
│ - Busca usuario por email            │
│ - Verifica password con bcrypt       │
│ - Crea access_token (30 min)         │
│ - Crea refresh_token (7 días)        │
│ - Retorna ambos tokens               │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Frontend: auth.service.ts            │
│ - Guarda access_token en localStorage│
│ - Guarda refresh_token en localStorage│
│ - Llama GET /users/me                │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Backend: users.py - get_current_user()│
│ - Valida access_token (tipo="access")│
│ - Retorna datos del usuario          │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Frontend: auth.service.ts            │
│ - Guarda usuario en localStorage     │
│ - Redirige a dashboard               │
└──────────────────────────────────────┘

// Cuando el access token expira (después de 30 min):

┌──────────────────────────────────────┐
│ Frontend: cualquier petición HTTP    │
│ - Interceptor detecta 401            │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Frontend: auth.interceptor.ts        │
│ - Llama authService.refreshToken()   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Frontend: auth.service.ts            │
│ - POST /auth/refresh                 │
│   body: {refresh_token: "..."}       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Backend: auth.py - refresh_token()   │
│ - Valida refresh_token (tipo="refresh")│
│ - Crea nuevo access_token            │
│ - Crea nuevo refresh_token (rotación)│
│ - Retorna ambos tokens               │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Frontend: auth.service.ts            │
│ - Actualiza ambos tokens en storage  │
│ - Interceptor reintenta petición     │
└──────────────────────────────────────┘
```

---

## 📝 Resumen de Archivos Modificados

### Frontend
1. ✅ `frontend/src/app/shared/models/auth.model.ts` - Agregado `refresh_token`
2. ✅ `frontend/src/app/shared/services/auth.service.ts` - Manejo completo de refresh tokens

### Backend (cambios previos)
1. ✅ `backend/app/schemas/token.py` - Schema Token con refresh_token
2. ✅ `backend/app/core/security.py` - Función create_refresh_token()
3. ✅ `backend/app/apis/endpoints/auth.py` - Endpoints actualizados
4. ✅ `backend/app/apis/dependencies.py` - Validación de tipo de token
5. ✅ `backend/.env` - Variable REFRESH_TOKEN_EXPIRE_DAYS

---

## ✅ Checklist de Verificación

- [ ] Backend corriendo en puerto 5050
- [ ] Base de datos PostgreSQL activa
- [ ] Migraciones ejecutadas (`alembic upgrade head`)
- [ ] Frontend corriendo en puerto 4200
- [ ] Usuario creado (vía /signup o /register)
- [ ] Login funciona y redirige al dashboard
- [ ] Tokens guardados en localStorage (access y refresh)
- [ ] Refresh token funciona automáticamente
- [ ] Sin errores CORS en consola del navegador

---

## 🎯 Conclusión

El sistema de autenticación frontend-backend ahora está **completamente integrado** con:

✅ Tokens JWT con access y refresh tokens separados
✅ Rotación automática de tokens por seguridad
✅ Refresh automático cuando el access token expira
✅ Logout automático cuando el refresh falla
✅ Manejo correcto de errores
✅ Redirección con returnUrl preservada

**El login debería funcionar correctamente ahora.** Si aún tienes problemas, revisa la sección de Solución de Problemas o comparte el error específico que ves en la consola del navegador.
