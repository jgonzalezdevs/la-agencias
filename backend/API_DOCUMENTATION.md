# API Documentation - Boletería Backend

## Base URL
```
http://localhost:8000/api/v1
```

## Documentación Interactiva
- **Swagger UI**: `http://localhost:8000/api/v1/docs`
- **ReDoc**: `http://localhost:8000/api/v1/redoc`

## Autenticación

La API utiliza **JWT (JSON Web Tokens)** con OAuth2. Para acceder a endpoints protegidos, incluye el token en el header:

```
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints

### POST `/auth/register`
Registrar un nuevo usuario en el sistema.

**Request Body:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "operator",
  "sales_count": 0,
  "is_active": true,
  "is_superuser": false,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

**Errors:**
- `400`: Email already registered

---

### POST `/auth/login`
Iniciar sesión y obtener access token.

**Request Body (form-data):**
```
username: user@example.com  (el campo username contiene el email)
password: securepassword123
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors:**
- `401`: Incorrect email or password
- `400`: Inactive user

---

## 2. Users Endpoints

### GET `/users/me`
Obtener información del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "operator",
  "sales_count": 15,
  "is_active": true,
  "is_superuser": false,
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

---

### PUT `/users/me`
Actualizar información del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "full_name": "Jane Doe",
  "password": "newpassword123"
}
```
*Todos los campos son opcionales*

**Response (200):** Usuario actualizado

**Errors:**
- `400`: Email already in use

---

### GET `/users/`
Listar todos los usuarios (requiere permisos de superuser).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skip` (int, default: 0): Número de registros a saltar
- `limit` (int, default: 100): Máximo de registros a retornar

**Response (200):** Array de usuarios

---

### GET `/users/top-sellers`
Obtener ranking de operadores con más ventas.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (int, default: 10, max: 100): Número de resultados

**Response (200):** Array de usuarios ordenados por `sales_count`

---

### GET `/users/{user_id}`
Obtener usuario por ID (requiere permisos de superuser).

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Usuario

**Errors:**
- `404`: User not found

---

## 3. Customers Endpoints

### POST `/customers/`
Crear un nuevo cliente.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "full_name": "Carlos Pérez",
  "document_id": "12345678",
  "phone_number": "+57 300 123 4567",
  "email": "carlos@example.com",
  "notes": "Cliente frecuente"
}
```
*Solo `full_name` es obligatorio*

**Response (201):**
```json
{
  "id": 1,
  "full_name": "Carlos Pérez",
  "document_id": "12345678",
  "phone_number": "+57 300 123 4567",
  "email": "carlos@example.com",
  "notes": "Cliente frecuente",
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### GET `/customers/search`
Buscar clientes por nombre, email o documento.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` (string): Término de búsqueda (nombre, email o document_id)
- `limit` (int, default: 50, max: 100): Máximo de resultados

**Response (200):** Array de clientes que coinciden con la búsqueda

---

### GET `/customers/{customer_id}`
Obtener detalles de un cliente específico.

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Cliente

**Errors:**
- `404`: Customer not found

---

### PUT `/customers/{customer_id}`
Actualizar información de un cliente.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "full_name": "Carlos Pérez Gómez",
  "phone_number": "+57 300 999 8888"
}
```
*Todos los campos son opcionales*

**Response (200):** Cliente actualizado

**Errors:**
- `404`: Customer not found

---

## 4. Locations Endpoints

### POST `/locations/`
Crear una nueva ubicación.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "country": "Colombia",
  "state": "Cundinamarca",
  "city": "Bogotá",
  "airport_code": "BOG"
}
```

**Response (201):**
```json
{
  "id": 1,
  "country": "Colombia",
  "state": "Cundinamarca",
  "city": "Bogotá",
  "airport_code": "BOG"
}
```

---

### GET `/locations/`
Obtener todas las ubicaciones (para selectores en frontend).

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Array de ubicaciones ordenadas por país y ciudad

---

## 5. Orders & Services Endpoints

### POST `/orders/`
Crear una nueva orden asociada al operador actual y un cliente.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "customer_id": 1
}
```

**Response (201):**
```json
{
  "id": 1,
  "order_number": "ORD-20250115-0001",
  "customer_id": 1,
  "user_id": 1,
  "status": "pendiente",
  "total_cost_price": "0.00",
  "total_sale_price": "0.00",
  "total_profit": "0.00",
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Errors:**
- `400`: Invalid customer_id

---

### GET `/orders/`
Listar órdenes con filtros opcionales.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `user_id` (int): Filtrar por operador
- `customer_id` (int): Filtrar por cliente
- `order_status` (string): `pendiente` | `pagada`
- `start_date` (datetime): Fecha inicial
- `end_date` (datetime): Fecha final
- `limit` (int, default: 100, max: 500): Máximo de resultados

**Response (200):** Array de órdenes

---

### GET `/orders/{order_id}`
Obtener detalles completos de una orden (incluye servicios, cliente, operador).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "order_number": "ORD-20250115-0001",
  "customer_id": 1,
  "user_id": 1,
  "status": "pagada",
  "total_cost_price": "800.00",
  "total_sale_price": "1200.00",
  "total_profit": "400.00",
  "created_at": "2025-01-15T10:00:00Z",
  "user": {
    "id": 1,
    "email": "operator@example.com",
    "full_name": "John Doe"
  },
  "customer": {
    "id": 1,
    "full_name": "Carlos Pérez",
    "document_id": "12345678"
  },
  "services": [
    {
      "id": 1,
      "order_id": 1,
      "service_type": "FLIGHT",
      "name": "Vuelo Bogotá - Medellín",
      "cost_price": "400.00",
      "sale_price": "600.00",
      "origin_location_id": 1,
      "destination_location_id": 2,
      "pnr_code": "ABC123",
      "company": "Avianca",
      "departure_datetime": "2025-02-01T08:00:00Z",
      "arrival_datetime": "2025-02-01T09:30:00Z"
    }
  ]
}
```

**Errors:**
- `404`: Order not found

---

### PUT `/orders/{order_id}`
Actualizar una orden (principalmente para cambiar estado).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "pagada"
}
```

**Response (200):** Orden actualizada

**Errors:**
- `404`: Order not found

---

### POST `/orders/{order_id}/services`
Agregar un nuevo servicio a una orden.

**Headers:** `Authorization: Bearer <token>`

**Request Body (ejemplo FLIGHT/BUS):**
```json
{
  "service_type": "FLIGHT",
  "name": "Vuelo Bogotá - Medellín",
  "description": "Vuelo directo mañana",
  "cost_price": 400.00,
  "sale_price": 600.00,
  "event_start_date": "2025-02-01T08:00:00Z",
  "event_end_date": "2025-02-01T09:30:00Z",
  "calendar_color": "#FF5733",
  "calendar_icon": "flight",
  "origin_location_id": 1,
  "destination_location_id": 2,
  "pnr_code": "ABC123",
  "company": "Avianca",
  "departure_datetime": "2025-02-01T08:00:00Z",
  "arrival_datetime": "2025-02-01T09:30:00Z"
}
```

**Request Body (ejemplo HOTEL):**
```json
{
  "service_type": "HOTEL",
  "name": "Hotel Tequendama",
  "description": "Habitación doble",
  "cost_price": 200.00,
  "sale_price": 350.00,
  "event_start_date": "2025-02-01T15:00:00Z",
  "event_end_date": "2025-02-03T12:00:00Z",
  "hotel_name": "Hotel Tequendama",
  "reservation_number": "RES-12345",
  "check_in_datetime": "2025-02-01T15:00:00Z",
  "check_out_datetime": "2025-02-03T12:00:00Z"
}
```

**Request Body (ejemplo LUGGAGE):**
```json
{
  "service_type": "LUGGAGE",
  "name": "Equipaje adicional",
  "description": "Maleta 23kg",
  "cost_price": 50.00,
  "sale_price": 80.00,
  "weight_kg": 23.00,
  "associated_service_id": 1
}
```

**Response (201):** Servicio creado

**Errors:**
- `400`: Invalid data or order not found

**Notas:**
- Al agregar un servicio, se recalculan automáticamente los totales de la orden
- Para FLIGHT/BUS, se incrementa `sales_count` del operador

---

### PUT `/orders/services/{service_id}`
Actualizar un servicio existente.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (todos los campos son opcionales)
```json
{
  "name": "Vuelo Bogotá - Cali",
  "cost_price": 450.00,
  "sale_price": 650.00,
  "pnr_code": "XYZ789"
}
```

**Response (200):** Servicio actualizado

**Errors:**
- `404`: Service not found
- `400`: Invalid data

**Notas:**
- Se recalculan los totales de la orden padre

---

### DELETE `/orders/services/{service_id}`
Eliminar un servicio de una orden.

**Headers:** `Authorization: Bearer <token>`

**Response (204):** No content

**Errors:**
- `404`: Service not found

**Notas:**
- Se recalculan los totales de la orden padre

---

### POST `/orders/services/{service_id}/images`
Agregar una o múltiples imágenes a un servicio.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
[
  "https://example.com/ticket1.jpg",
  "https://example.com/ticket2.jpg"
]
```

**Response (201):**
```json
[
  {
    "id": 1,
    "service_id": 1,
    "image_url": "https://example.com/ticket1.jpg"
  },
  {
    "id": 2,
    "service_id": 1,
    "image_url": "https://example.com/ticket2.jpg"
  }
]
```

**Errors:**
- `400`: Service not found

---

## 6. Statistics Endpoints

### GET `/stats/profits`
Obtener estadísticas de ganancias agrupadas por período.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `start_date` (datetime): Fecha inicial
- `end_date` (datetime): Fecha final
- `group_by` (string): `day` | `week` | `month` | `year` (default: `month`)

**Example Request:**
```
GET /api/v1/stats/profits?start_date=2025-01-01&group_by=month
```

**Response (200):**
```json
[
  {
    "period": "2025-01-01T00:00:00Z",
    "total_cost": "15000.00",
    "total_sales": "22000.00",
    "total_profit": "7000.00",
    "order_count": 45
  },
  {
    "period": "2025-02-01T00:00:00Z",
    "total_cost": "18000.00",
    "total_sales": "27000.00",
    "total_profit": "9000.00",
    "order_count": 52
  }
]
```

---

### GET `/stats/popular-trips`
Obtener ranking de las rutas más vendidas.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (int, default: 10, max: 100): Número de resultados

**Response (200):**
```json
[
  {
    "origin_location_id": 1,
    "destination_location_id": 2,
    "sales_count": 125,
    "total_revenue": "75000.00",
    "origin_location": {
      "id": 1,
      "country": "Colombia",
      "city": "Bogotá",
      "airport_code": "BOG"
    },
    "destination_location": {
      "id": 2,
      "country": "Colombia",
      "city": "Medellín",
      "airport_code": "MDE"
    }
  }
]
```

---

## Data Types & Enums

### OrderStatus
```typescript
type OrderStatus = "pendiente" | "pagada";
```

### ServiceType
```typescript
type ServiceType = "FLIGHT" | "BUS" | "HOTEL" | "LUGGAGE" | "OTHER";
```

---

## Error Responses

Todos los endpoints pueden retornar los siguientes errores:

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Frontend Integration Examples

### Axios Setup (React/Vue)
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Login Example
```javascript
async function login(email, password) {
  const formData = new FormData();
  formData.append('username', email);
  formData.append('password', password);

  const response = await api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  localStorage.setItem('access_token', response.data.access_token);
  return response.data;
}
```

### Create Order with Services
```javascript
async function createOrderWithServices(customerId, services) {
  // 1. Create order
  const order = await api.post('/orders/', { customer_id: customerId });

  // 2. Add services
  for (const service of services) {
    await api.post(`/orders/${order.data.id}/services`, service);
  }

  // 3. Get complete order with details
  const completeOrder = await api.get(`/orders/${order.data.id}`);
  return completeOrder.data;
}
```

### Fetch Statistics
```javascript
async function getMonthlyProfits(year) {
  const response = await api.get('/stats/profits', {
    params: {
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
      group_by: 'month'
    }
  });
  return response.data;
}
```

---

## TypeScript Types

```typescript
// User
interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  sales_count: number;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

// Customer
interface Customer {
  id: number;
  full_name: string;
  document_id?: string;
  phone_number?: string;
  email?: string;
  notes?: string;
  created_at: string;
}

// Location
interface Location {
  id: number;
  country: string;
  state?: string;
  city: string;
  airport_code?: string;
}

// Order
interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  user_id?: number;
  status: OrderStatus;
  total_cost_price: string;
  total_sale_price: string;
  total_profit: string;
  created_at: string;
}

interface OrderWithDetails extends Order {
  user?: User;
  customer: Customer;
  services: Service[];
}

// Service
interface Service {
  id: number;
  order_id: number;
  service_type: ServiceType;
  name: string;
  description?: string;
  cost_price: string;
  sale_price: string;

  // Calendar fields
  event_start_date?: string;
  event_end_date?: string;
  calendar_color?: string;
  calendar_icon?: string;

  // FLIGHT/BUS fields
  origin_location_id?: number;
  destination_location_id?: number;
  pnr_code?: string;
  company?: string;
  departure_datetime?: string;
  arrival_datetime?: string;

  // HOTEL fields
  hotel_name?: string;
  reservation_number?: string;
  check_in_datetime?: string;
  check_out_datetime?: string;

  // LUGGAGE fields
  weight_kg?: string;
  associated_service_id?: number;
}

// Service Image
interface ServiceImage {
  id: number;
  service_id: number;
  image_url: string;
}
```

---

## Notes

1. **Autenticación**: Todos los endpoints excepto `/auth/register` y `/auth/login` requieren autenticación
2. **Permisos**: Algunos endpoints requieren rol de superuser
3. **Fechas**: Usa formato ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
4. **Decimales**: Los precios se retornan como strings para mantener precisión
5. **Paginación**: Usa `skip` y `limit` para endpoints con listas grandes
6. **CORS**: Configurado para aceptar requests desde el frontend
7. **Recalculo automático**: Al modificar servicios, los totales de la orden se recalculan automáticamente
8. **Contadores de ventas**: Se incrementan automáticamente al crear servicios tipo FLIGHT o BUS
