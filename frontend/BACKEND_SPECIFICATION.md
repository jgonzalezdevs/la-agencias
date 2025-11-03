# Especificación de Backend - La Agencias Dashboard

## Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Entidades de Datos](#entidades-de-datos)
3. [API Endpoints](#api-endpoints)
4. [Casos de Uso](#casos-de-uso)
5. [Arquitectura Recomendada](#arquitectura-recomendada)
6. [Seguridad y Autenticación](#seguridad-y-autenticación)

---

## Resumen Ejecutivo

Basado en el análisis del frontend La Agencias Angular, se requiere un backend que soporte un **sistema multi-propósito** que incluye:

- **Gestión de venta de tickets** (vuelos y buses)
- **E-commerce** (productos y transacciones)
- **Facturación** (invoices)
- **Gestión de usuarios** (perfiles y autenticación)
- **Dashboard de métricas** (KPIs y analytics)
- **Calendario de eventos**

---

## Entidades de Datos

### 1. **Usuario (User)**

```typescript
interface User {
  id: string;
  email: string;
  password: string; // Hash
  firstName: string;
  lastName: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  role: 'admin' | 'agent' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  social?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  // Datos de agente (si role === 'agent')
  totalSales?: number;
  rating?: number;
  commission?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relaciones:**
- 1:N con Tickets (como vendedor)
- 1:N con Tickets (como comprador)
- 1:N con Transactions

---

### 2. **Producto (Product)**

```typescript
interface Product {
  id: string;
  name: string;
  description?: string;
  image: string;
  images?: string[];
  category: string;
  brand: string;
  price: number;
  stock: number;
  stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock';
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relaciones:**
- 1:N con InvoiceItems
- 1:N con TransactionItems

---

### 3. **Transacción (Transaction)**

```typescript
interface Transaction {
  id: string;
  orderId: string; // ID único visible al usuario
  customerId: string;
  amount: number;
  currency: string; // 'USD', 'EUR', etc.
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  paymentDetails?: object; // Metadata del pago
  dueDate?: Date;
  paidAt?: Date;
  items?: TransactionItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionItem {
  id: string;
  transactionId: string;
  productId?: string;
  ticketId?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}
```

**Relaciones:**
- N:1 con User (customer)
- 1:N con TransactionItems
- 1:1 con Invoice (opcional)

---

### 4. **Ticket de Viaje (Ticket)**

```typescript
interface Ticket {
  id: string;
  ticketNumber: string; // TKT-XXXXX
  travelType: 'flight' | 'bus';
  travelNumber: string; // Número de vuelo o bus

  // Información de viaje
  origin: string;
  destination: string;
  travelDate: Date;
  departureTime: string;
  arrivalTime: string;
  carrier: string; // Aerolínea o empresa de bus

  // Información de pasajero
  buyerId: string; // User ID del comprador
  passengerName: string;
  passengerDocument: string;
  passengerPhone: string;
  passengerEmail: string;

  // Información de asiento y clase
  seatNumber?: string;
  class: 'economy' | 'business' | 'first_class';

  // Información comercial
  sellerId: string; // User ID del agente vendedor
  quantity: number;
  price: number;
  commission: number;
  totalAmount: number;

  // Estado y pago
  status: 'confirmed' | 'pending' | 'cancelled';
  paymentMethod: string;
  saleDate: Date;

  // Servicios adicionales
  additionalServices?: AdditionalService[];

  // Metadata
  notes?: string;
  images?: TicketImage[];

  createdAt: Date;
  updatedAt: Date;
}

interface AdditionalService {
  id: string;
  type: 'hotel' | 'car_rental' | 'luggage' | 'insurance';
  name: string;
  details: string;
  price: number;
}

interface TicketImage {
  id: string;
  url: string;
  type: 'ticket' | 'boarding_pass' | 'receipt';
  uploadedAt: Date;
}
```

**Relaciones:**
- N:1 con User (seller)
- N:1 con User (buyer)
- 1:N con AdditionalServices
- 1:N con TicketImages
- 1:1 con CalendarEvent

---

### 5. **Evento de Calendario (CalendarEvent)**

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;

  // Relación con ticket
  ticketId?: string;

  // Información extendida
  type: 'ticket' | 'meeting' | 'reminder' | 'other';
  description?: string;
  location?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

**Relaciones:**
- 1:1 con Ticket (opcional)

---

### 6. **Factura (Invoice)**

```typescript
interface Invoice {
  id: string;
  invoiceNumber: string; // INV-XXXXX
  customerId: string;
  transactionId?: string;

  // Items de factura
  items: InvoiceItem[];

  // Montos
  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  // Estado y fechas
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;

  // Notas
  notes?: string;
  terms?: string;

  createdAt: Date;
  updatedAt: Date;
}

interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitCost: number;
  discount: number;
  total: number;
}
```

**Relaciones:**
- N:1 con User (customer)
- 1:1 con Transaction (opcional)
- 1:N con InvoiceItems

---

### 7. **Categoría de Producto (Category)**

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string; // Para categorías anidadas
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relaciones:**
- 1:N con Products
- 1:N con Categories (auto-referencia para subcategorías)

---

### 8. **Marca (Brand)**

```typescript
interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relaciones:**
- 1:N con Products

---

### 9. **Métricas de Dashboard (DashboardMetrics)**

```typescript
interface DashboardMetrics {
  date: Date;
  totalCustomers: number;
  newCustomers: number;
  customerGrowth: number; // Porcentaje

  totalOrders: number;
  newOrders: number;
  orderGrowth: number;

  totalSales: number;
  salesGrowth: number;

  totalRevenue: number;
  revenueGrowth: number;

  // Métricas adicionales
  averageOrderValue: number;
  conversionRate: number;
}
```

---

## API Endpoints

### Autenticación

```
POST   /api/auth/register          - Registro de usuario
POST   /api/auth/login             - Login
POST   /api/auth/logout            - Logout
POST   /api/auth/refresh-token     - Renovar token
POST   /api/auth/forgot-password   - Recuperar contraseña
POST   /api/auth/reset-password    - Reset contraseña
GET    /api/auth/me                - Obtener usuario autenticado
```

---

### Usuarios

```
GET    /api/users                  - Listar usuarios (admin)
GET    /api/users/:id              - Obtener usuario por ID
PUT    /api/users/:id              - Actualizar usuario
DELETE /api/users/:id              - Eliminar usuario (admin)
GET    /api/users/:id/sales        - Ventas de un agente
GET    /api/users/:id/purchases    - Compras de un cliente
```

**Query params para GET /api/users:**
- `role`: admin | agent | customer
- `status`: active | inactive | suspended
- `search`: búsqueda por nombre o email
- `page`: número de página
- `limit`: items por página
- `sortBy`: firstName | lastName | createdAt | totalSales
- `order`: asc | desc

---

### Productos

```
GET    /api/products               - Listar productos
GET    /api/products/:id           - Obtener producto
POST   /api/products               - Crear producto (admin)
PUT    /api/products/:id           - Actualizar producto (admin)
DELETE /api/products/:id           - Eliminar producto (admin)
GET    /api/products/categories    - Listar categorías
GET    /api/products/brands        - Listar marcas
```

**Query params para GET /api/products:**
- `category`: filtrar por categoría
- `brand`: filtrar por marca
- `stockStatus`: in_stock | out_of_stock | low_stock
- `minPrice`: precio mínimo
- `maxPrice`: precio máximo
- `search`: búsqueda por nombre
- `page`: número de página
- `limit`: items por página
- `sortBy`: name | price | createdAt | stock
- `order`: asc | desc

---

### Transacciones

```
GET    /api/transactions           - Listar transacciones
GET    /api/transactions/:id       - Obtener transacción
POST   /api/transactions           - Crear transacción
PUT    /api/transactions/:id       - Actualizar transacción
DELETE /api/transactions/:id       - Eliminar transacción (admin)
POST   /api/transactions/:id/refund - Reembolsar transacción
```

**Query params para GET /api/transactions:**
- `status`: completed | pending | failed | refunded
- `customerId`: filtrar por cliente
- `startDate`: fecha inicio
- `endDate`: fecha fin
- `minAmount`: monto mínimo
- `maxAmount`: monto máximo
- `paymentMethod`: método de pago
- `search`: búsqueda por orderId o customer
- `page`: número de página
- `limit`: items por página
- `sortBy`: createdAt | amount | status
- `order`: asc | desc

---

### Tickets

```
GET    /api/tickets                - Listar tickets
GET    /api/tickets/:id            - Obtener ticket
POST   /api/tickets                - Crear ticket
PUT    /api/tickets/:id            - Actualizar ticket
DELETE /api/tickets/:id            - Eliminar ticket
PATCH  /api/tickets/:id/cancel     - Cancelar ticket
POST   /api/tickets/:id/images     - Subir imágenes de ticket
```

**Query params para GET /api/tickets:**
- `travelType`: flight | bus
- `origin`: ciudad de origen
- `destination`: ciudad de destino
- `status`: confirmed | pending | cancelled
- `sellerId`: filtrar por vendedor
- `buyerId`: filtrar por comprador
- `startDate`: fecha inicio de viaje
- `endDate`: fecha fin de viaje
- `carrier`: aerolínea/empresa
- `search`: búsqueda por ticketNumber o passengerName
- `page`: número de página
- `limit`: items por página
- `sortBy`: travelDate | saleDate | price
- `order`: asc | desc

---

### Facturas

```
GET    /api/invoices               - Listar facturas
GET    /api/invoices/:id           - Obtener factura
POST   /api/invoices               - Crear factura
PUT    /api/invoices/:id           - Actualizar factura
DELETE /api/invoices/:id           - Eliminar factura
PATCH  /api/invoices/:id/send      - Enviar factura por email
PATCH  /api/invoices/:id/pay       - Marcar como pagada
GET    /api/invoices/:id/pdf       - Generar PDF
```

**Query params para GET /api/invoices:**
- `status`: draft | sent | paid | overdue | cancelled
- `customerId`: filtrar por cliente
- `startDate`: fecha inicio
- `endDate`: fecha fin
- `search`: búsqueda por invoiceNumber
- `page`: número de página
- `limit`: items por página
- `sortBy`: issueDate | dueDate | total
- `order`: asc | desc

---

### Calendario

```
GET    /api/calendar/events        - Listar eventos
GET    /api/calendar/events/:id    - Obtener evento
POST   /api/calendar/events        - Crear evento
PUT    /api/calendar/events/:id    - Actualizar evento
DELETE /api/calendar/events/:id    - Eliminar evento
```

**Query params para GET /api/calendar/events:**
- `start`: fecha inicio del rango
- `end`: fecha fin del rango
- `type`: ticket | meeting | reminder | other
- `ticketId`: filtrar por ticket asociado

---

### Dashboard

```
GET    /api/dashboard/metrics      - KPIs principales
GET    /api/dashboard/sales-chart  - Datos para gráfica de ventas
GET    /api/dashboard/recent-orders - Órdenes recientes
GET    /api/dashboard/top-products - Productos más vendidos
GET    /api/dashboard/sales-by-category - Ventas por categoría
GET    /api/dashboard/revenue-trend - Tendencia de ingresos
```

**Query params:**
- `period`: today | week | month | year | custom
- `startDate`: fecha inicio (para custom)
- `endDate`: fecha fin (para custom)

---

### Categorías

```
GET    /api/categories             - Listar categorías
GET    /api/categories/:id         - Obtener categoría
POST   /api/categories             - Crear categoría (admin)
PUT    /api/categories/:id         - Actualizar categoría (admin)
DELETE /api/categories/:id         - Eliminar categoría (admin)
```

---

### Marcas

```
GET    /api/brands                 - Listar marcas
GET    /api/brands/:id             - Obtener marca
POST   /api/brands                 - Crear marca (admin)
PUT    /api/brands/:id             - Actualizar marca (admin)
DELETE /api/brands/:id             - Eliminar marca (admin)
```

---

## Casos de Uso

### 1. **Gestión de Usuarios**

#### UC-001: Registro de Usuario
**Actor:** Usuario no autenticado
**Precondiciones:** Ninguna
**Flujo Principal:**
1. Usuario accede a la página de registro
2. Usuario ingresa: email, nombre, apellido, contraseña
3. Sistema valida datos
4. Sistema crea cuenta con role='customer' y status='active'
5. Sistema envía email de confirmación
6. Sistema retorna token JWT

**Postcondiciones:** Usuario creado y autenticado

---

#### UC-002: Login de Usuario
**Actor:** Usuario registrado
**Precondiciones:** Usuario tiene cuenta activa
**Flujo Principal:**
1. Usuario accede a la página de login
2. Usuario ingresa email y contraseña
3. Sistema valida credenciales
4. Sistema genera token JWT
5. Sistema retorna datos de usuario y token

**Postcondiciones:** Usuario autenticado

---

#### UC-003: Actualizar Perfil
**Actor:** Usuario autenticado
**Precondiciones:** Usuario logueado
**Flujo Principal:**
1. Usuario accede a su perfil
2. Usuario modifica: nombre, teléfono, bio, redes sociales
3. Usuario sube nueva foto de perfil (opcional)
4. Usuario guarda cambios
5. Sistema valida y actualiza datos

**Postcondiciones:** Perfil actualizado

---

### 2. **Gestión de Productos (E-commerce)**

#### UC-004: Listar Productos
**Actor:** Usuario (cualquier rol)
**Precondiciones:** Ninguna
**Flujo Principal:**
1. Usuario accede al listado de productos
2. Usuario aplica filtros (categoría, marca, precio, stock)
3. Sistema retorna productos paginados
4. Usuario ordena por criterio (nombre, precio, fecha)
5. Sistema actualiza listado

**Postcondiciones:** Productos mostrados según filtros

---

#### UC-005: Crear Producto
**Actor:** Administrador
**Precondiciones:** Usuario con role='admin'
**Flujo Principal:**
1. Admin accede a formulario de nuevo producto
2. Admin ingresa: nombre, categoría, marca, precio, stock, imágenes
3. Admin marca producto como activo
4. Sistema valida datos
5. Sistema crea producto
6. Sistema retorna al listado

**Postcondiciones:** Producto creado

---

#### UC-006: Actualizar Stock de Producto
**Actor:** Administrador
**Precondiciones:** Producto existe
**Flujo Principal:**
1. Admin selecciona producto
2. Admin modifica cantidad en stock
3. Sistema actualiza stockStatus automáticamente:
   - stock > 10: 'in_stock'
   - stock 1-10: 'low_stock'
   - stock = 0: 'out_of_stock'
4. Sistema guarda cambios

**Postcondiciones:** Stock actualizado

---

### 3. **Gestión de Tickets de Viaje**

#### UC-007: Crear Venta de Ticket
**Actor:** Agente de ventas
**Precondiciones:** Usuario con role='agent'
**Flujo Principal:**
1. Agente accede a formulario de nuevo ticket
2. Agente selecciona tipo de viaje (vuelo/bus)
3. Agente ingresa:
   - Información de viaje (origen, destino, fechas, carrier)
   - Información de pasajero (nombre, documento, contacto)
   - Clase y asiento
   - Precio y comisión
4. Agente agrega servicios adicionales (hotel, auto, equipaje)
5. Agente selecciona método de pago
6. Sistema valida disponibilidad
7. Sistema crea ticket con status='pending'
8. Sistema crea evento en calendario
9. Sistema procesa pago
10. Sistema actualiza status a 'confirmed'
11. Sistema envía confirmación por email

**Postcondiciones:** Ticket creado, pago procesado, confirmación enviada

---

#### UC-008: Buscar Tickets
**Actor:** Agente o Administrador
**Precondiciones:** Usuario autenticado
**Flujo Principal:**
1. Usuario accede a listado de tickets
2. Usuario aplica filtros:
   - Tipo de viaje
   - Origen/destino
   - Rango de fechas
   - Estado
   - Vendedor/comprador
3. Sistema retorna tickets paginados
4. Usuario visualiza detalles de ticket específico

**Postcondiciones:** Tickets mostrados según filtros

---

#### UC-009: Cancelar Ticket
**Actor:** Agente o Cliente
**Precondiciones:** Ticket existe con status='confirmed' o 'pending'
**Flujo Principal:**
1. Usuario selecciona ticket
2. Usuario solicita cancelación
3. Sistema verifica políticas de cancelación
4. Sistema calcula penalidad (si aplica)
5. Usuario confirma cancelación
6. Sistema actualiza status a 'cancelled'
7. Sistema procesa reembolso (si aplica)
8. Sistema actualiza evento de calendario
9. Sistema envía notificación de cancelación

**Postcondiciones:** Ticket cancelado, reembolso procesado

---

#### UC-010: Ver Calendario de Tickets
**Actor:** Agente o Administrador
**Precondiciones:** Usuario autenticado
**Flujo Principal:**
1. Usuario accede al calendario
2. Sistema muestra eventos de tickets del mes actual
3. Usuario cambia vista (mes/semana/día)
4. Usuario hace clic en evento
5. Sistema muestra modal con detalles completos del ticket
6. Usuario puede editar o cancelar desde el modal

**Postcondiciones:** Calendario visualizado

---

### 4. **Gestión de Transacciones**

#### UC-011: Registrar Transacción
**Actor:** Sistema (automático) o Administrador
**Precondiciones:** Cliente existe
**Flujo Principal:**
1. Sistema recibe solicitud de pago (desde venta de ticket o producto)
2. Sistema crea transacción con status='pending'
3. Sistema procesa pago con gateway (Stripe, PayPal, etc.)
4. Gateway retorna resultado
5. Si exitoso: Sistema actualiza status a 'completed'
6. Si falla: Sistema actualiza status a 'failed'
7. Sistema registra detalles de pago
8. Sistema notifica resultado al cliente

**Postcondiciones:** Transacción registrada

---

#### UC-012: Listar Transacciones
**Actor:** Administrador
**Precondiciones:** Usuario con role='admin'
**Flujo Principal:**
1. Admin accede a listado de transacciones
2. Admin aplica filtros:
   - Estado (completed, pending, failed)
   - Rango de fechas
   - Rango de montos
   - Cliente
   - Método de pago
3. Sistema retorna transacciones paginadas (10 por página)
4. Admin ordena por fecha, monto o estado
5. Sistema actualiza listado

**Postcondiciones:** Transacciones mostradas

---

#### UC-013: Reembolsar Transacción
**Actor:** Administrador
**Precondiciones:** Transacción con status='completed'
**Flujo Principal:**
1. Admin selecciona transacción
2. Admin solicita reembolso
3. Sistema verifica elegibilidad
4. Admin confirma reembolso
5. Sistema procesa reembolso con gateway
6. Sistema actualiza status a 'refunded'
7. Sistema registra fecha de reembolso
8. Sistema notifica al cliente

**Postcondiciones:** Transacción reembolsada

---

### 5. **Gestión de Facturas**

#### UC-014: Generar Factura desde Transacción
**Actor:** Sistema (automático) o Administrador
**Precondiciones:** Transacción completada
**Flujo Principal:**
1. Sistema crea factura automáticamente al completar transacción
2. Sistema asigna invoiceNumber único
3. Sistema copia items de transacción a InvoiceItems
4. Sistema calcula subtotal, descuentos, impuestos
5. Sistema establece status='sent' y fechas
6. Sistema genera PDF
7. Sistema envía factura por email al cliente

**Postcondiciones:** Factura generada y enviada

---

#### UC-015: Crear Factura Manual
**Actor:** Administrador
**Precondiciones:** Cliente existe
**Flujo Principal:**
1. Admin accede a formulario de nueva factura
2. Admin selecciona cliente
3. Admin agrega items (productos o descripciones custom)
4. Admin ingresa cantidad, precio unitario, descuento
5. Sistema calcula totales automáticamente
6. Admin establece fecha de vencimiento
7. Admin guarda como borrador o envía
8. Si envía: Sistema genera PDF y envía email

**Postcondiciones:** Factura creada

---

#### UC-016: Marcar Factura como Pagada
**Actor:** Administrador
**Precondiciones:** Factura existe con status='sent' o 'overdue'
**Flujo Principal:**
1. Admin selecciona factura
2. Admin marca como pagada
3. Sistema actualiza status a 'paid'
4. Sistema registra paidDate
5. Sistema envía notificación de recibo al cliente

**Postcondiciones:** Factura pagada

---

### 6. **Dashboard y Reportes**

#### UC-017: Ver Métricas del Dashboard
**Actor:** Administrador o Agente
**Precondiciones:** Usuario autenticado
**Flujo Principal:**
1. Usuario accede al dashboard
2. Usuario selecciona período (hoy, semana, mes, año, custom)
3. Sistema calcula métricas:
   - Total de clientes y crecimiento
   - Total de órdenes y crecimiento
   - Total de ventas y tendencia
   - Ingresos totales
4. Sistema muestra gráficas:
   - Ventas mensuales (últimos 12 meses)
   - Órdenes recientes
   - Top productos vendidos
   - Ventas por categoría
5. Usuario visualiza datos actualizados

**Postcondiciones:** Dashboard mostrado

---

#### UC-018: Ver Reportes de Ventas de Agente
**Actor:** Agente
**Precondiciones:** Usuario con role='agent'
**Flujo Principal:**
1. Agente accede a su perfil
2. Sistema muestra:
   - Total de ventas realizadas
   - Comisiones ganadas
   - Rating promedio
   - Tickets vendidos (últimos 30 días)
3. Agente filtra por período
4. Sistema actualiza reporte

**Postcondiciones:** Reporte de agente mostrado

---

#### UC-019: Exportar Datos
**Actor:** Administrador
**Precondiciones:** Usuario con role='admin'
**Flujo Principal:**
1. Admin accede a sección de reportes
2. Admin selecciona tipo de datos (productos, tickets, transacciones)
3. Admin aplica filtros
4. Admin selecciona formato (CSV, Excel, PDF)
5. Sistema genera archivo
6. Sistema descarga archivo

**Postcondiciones:** Datos exportados

---

## Arquitectura Recomendada

### Stack Tecnológico Sugerido

#### Backend
- **Framework:** Node.js + Express.js / NestJS (TypeScript)
  - Alternativas: Django (Python), Spring Boot (Java), Laravel (PHP)
- **Base de Datos:** PostgreSQL (relacional)
  - Alternativa NoSQL: MongoDB (para flexibilidad)
- **ORM:** Prisma / TypeORM
- **Autenticación:** JWT + Passport.js / NextAuth
- **Validación:** Zod / Joi
- **File Upload:** Multer + AWS S3 / Cloudinary
- **Email:** Nodemailer + SendGrid / AWS SES
- **PDF Generation:** PDFKit / Puppeteer
- **Payment Gateway:** Stripe / PayPal SDK

#### Infraestructura
- **Hosting:** AWS / Google Cloud / DigitalOcean
- **Contenedores:** Docker + Docker Compose
- **CI/CD:** GitHub Actions / GitLab CI
- **Monitoreo:** Sentry + CloudWatch / Grafana

---

### Arquitectura de Capas

```
┌─────────────────────────────────────┐
│         API REST / GraphQL          │
│         (Express / NestJS)          │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      Controllers / Resolvers        │
│   (Manejo de requests/responses)    │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         Services Layer              │
│     (Lógica de negocio)             │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      Repository Layer               │
│   (Acceso a datos - ORM)            │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         PostgreSQL Database         │
└─────────────────────────────────────┘
```

---

### Estructura de Proyecto Recomendada

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── email.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── strategies/
│   │   │       ├── jwt.strategy.ts
│   │   │       └── local.strategy.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   └── users.validation.ts
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.repository.ts
│   │   │   └── products.validation.ts
│   │   ├── tickets/
│   │   │   ├── tickets.controller.ts
│   │   │   ├── tickets.service.ts
│   │   │   ├── tickets.repository.ts
│   │   │   └── tickets.validation.ts
│   │   ├── transactions/
│   │   │   ├── transactions.controller.ts
│   │   │   ├── transactions.service.ts
│   │   │   ├── transactions.repository.ts
│   │   │   └── transactions.validation.ts
│   │   ├── invoices/
│   │   │   ├── invoices.controller.ts
│   │   │   ├── invoices.service.ts
│   │   │   ├── invoices.repository.ts
│   │   │   └── invoices.validation.ts
│   │   ├── calendar/
│   │   │   ├── calendar.controller.ts
│   │   │   ├── calendar.service.ts
│   │   │   └── calendar.repository.ts
│   │   └── dashboard/
│   │       ├── dashboard.controller.ts
│   │       └── dashboard.service.ts
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validation.middleware.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   └── roles.guard.ts
│   │   ├── utils/
│   │   │   ├── pagination.ts
│   │   │   ├── response.ts
│   │   │   └── file-upload.ts
│   │   └── types/
│   │       └── index.ts
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── schema.prisma
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── unit/
│   └── integration/
├── .env
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## Seguridad y Autenticación

### 1. **Autenticación JWT**

```typescript
// Token payload
interface JWTPayload {
  sub: string;      // User ID
  email: string;
  role: string;
  iat: number;      // Issued at
  exp: number;      // Expiration
}

// Access token: 15 minutos
// Refresh token: 7 días
```

---

### 2. **Roles y Permisos**

| Rol       | Permisos                                                                 |
|-----------|--------------------------------------------------------------------------|
| admin     | Acceso total: CRUD en todas las entidades, reportes, configuración      |
| agent     | Crear/editar tickets, ver sus ventas, ver productos, crear transacciones|
| customer  | Ver/editar su perfil, ver sus compras, ver sus tickets, pagar facturas  |

---

### 3. **Middleware de Autenticación**

```typescript
// Proteger rutas
app.use('/api/*', authMiddleware);

// Proteger por rol
app.use('/api/admin/*', rolesGuard(['admin']));
app.use('/api/tickets', rolesGuard(['admin', 'agent']));
```

---

### 4. **Validación de Datos**

Validar todos los inputs con esquemas (Zod ejemplo):

```typescript
const createProductSchema = z.object({
  name: z.string().min(3).max(255),
  category: z.string(),
  brand: z.string(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  image: z.string().url()
});
```

---

### 5. **Rate Limiting**

- Login: 5 intentos por IP cada 15 minutos
- API general: 100 requests por IP cada 15 minutos
- File upload: 10 uploads por usuario cada hora

---

### 6. **CORS**

Permitir solo el origen del frontend:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

### 7. **Sanitización**

- Escapar inputs para prevenir XSS
- Usar prepared statements (ORM) para prevenir SQL injection
- Validar y sanitizar file uploads

---

## Consideraciones Adicionales

### 1. **Paginación Estándar**

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

### 2. **Formato de Respuesta**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

Errores:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

### 3. **Logs y Auditoría**

- Registrar todas las acciones críticas (creación, edición, eliminación)
- Mantener audit trail para transacciones y tickets
- Logs centralizados con timestamp, userId, action, entity

---

### 4. **Backup y Recuperación**

- Backup diario de base de datos
- Backup de archivos subidos (imágenes, PDFs)
- Plan de disaster recovery

---

### 5. **Escalabilidad**

- Usar cache (Redis) para datos frecuentemente accedidos:
  - Métricas de dashboard
  - Listados de productos
  - Información de usuario
- Queue system (Bull/RabbitMQ) para:
  - Envío de emails
  - Generación de PDFs
  - Procesamiento de pagos
- CDN para assets estáticos

---

## Próximos Pasos

1. **Definir prioridades**: Identificar qué módulos implementar primero
2. **Setup inicial**: Configurar proyecto, base de datos, autenticación
3. **Desarrollo iterativo**: Implementar módulo por módulo
4. **Testing**: Unit tests, integration tests, E2E tests
5. **Deployment**: Configurar CI/CD y desplegar a producción
6. **Monitoreo**: Implementar logging, alertas, métricas

---

## Contacto y Soporte

Para preguntas sobre esta especificación o el proyecto, por favor contactar al equipo de desarrollo.

**Versión:** 1.0
**Fecha:** 2025-10-15
**Autor:** Claude Code
