# 🎫 Implementación de Estado en Servicios y Vista Previa de Archivos

## 📋 Resumen de Cambios

Se ha modificado el sistema para que:
1. ✅ **El estado está asociado a cada servicio/ticket** (no a la orden/pago)
2. ✅ **Estados disponibles**: `activo`, `cancelado`, `postpuesto`
3. ✅ **Eliminado el control de pagos** (todas las órdenes se consideran pagadas)
4. ✅ **Soporte para archivos** asociados a servicios (imágenes, documentos)
5. ⏳ **Pendiente**: Vista previa de archivos en el frontend

---

## 🔧 Cambios en el Backend

### 1. Modelo Service (`backend/app/models/service.py`)

**Agregado:**
```python
class ServiceStatus(str, enum.Enum):
    """Service status enumeration."""
    ACTIVO = "activo"
    CANCELADO = "cancelado"
    POSTPUESTO = "postpuesto"

class Service(Base):
    # ... otros campos
    status: Mapped[ServiceStatus] = mapped_column(
        Enum(ServiceStatus, native_enum=False),
        default=ServiceStatus.ACTIVO,
        nullable=False
    )
```

**Características:**
- Estado por defecto: `ACTIVO`
- Cada servicio tiene su propio estado independiente
- Relación con `ServiceImage` para archivos adjuntos

### 2. Modelo Order (`backend/app/models/order.py`)

**Removido:**
```python
class OrderStatus(str, enum.Enum):  # ❌ ELIMINADO
    PENDIENTE = "pendiente"
    PAGADA = "pagada"
    CANCELADA = "cancelada"

# Campo removido del modelo Order:
status: Mapped[OrderStatus]  # ❌ ELIMINADO
```

**Campos actuales:**
```python
class Order(Base):
    id: Mapped[int]
    order_number: Mapped[str]
    user_id: Mapped[int | None]
    customer_id: Mapped[int]
    total_cost_price: Mapped[Decimal]
    total_sale_price: Mapped[Decimal]
    created_at: Mapped[datetime]
    # total_profit es calculado en tiempo de ejecución
```

### 3. Schemas Actualizados

**`backend/app/schemas/service.py`:**
```python
from app.models.service import ServiceStatus

class ServiceBase(BaseModel):
    service_type: ServiceType
    status: ServiceStatus = ServiceStatus.ACTIVO  # ✅ NUEVO
    name: str
    # ... otros campos

class ServiceUpdate(BaseModel):
    status: ServiceStatus | None = None  # ✅ Permite actualizar estado
    # ... otros campos

class ServiceWithDetails(Service):
    images: list[ServiceImage] = []  # ✅ Incluye imágenes
```

**`backend/app/schemas/order.py`:**
```python
# OrderStatus eliminado ❌

class OrderUpdate(BaseModel):
    pass  # Orders son inmutables después de creación

class OrderInDB(OrderBase):
    id: int
    order_number: str
    user_id: int | None
    total_cost_price: Decimal
    total_sale_price: Decimal
    total_profit: Decimal  # Calculado
    created_at: datetime
    # ❌ status removido
```

### 4. Migración de Base de Datos

**Archivo:** `backend/alembic/versions/add_status_to_services_remove_from_orders.py`

```python
def upgrade() -> None:
    # Agregar columna status a services
    op.add_column('services',
        sa.Column('status', sa.String(length=20),
                  nullable=False, server_default='activo'))

    # Eliminar columna status de orders
    op.drop_column('orders', 'status')

def downgrade() -> None:
    # Revertir cambios
    op.add_column('orders',
        sa.Column('status', sa.String(length=20),
                  nullable=False, server_default='pendiente'))
    op.drop_column('services', 'status')
```

**Para aplicar la migración:**
```bash
cd /home/jligo/leandro/backend
alembic upgrade head
```

---

## 🎨 Cambios en el Frontend

### 1. Servicio de Órdenes (`frontend/src/app/shared/services/orders.service.ts`)

**Tipos actualizados:**
```typescript
// ✅ NUEVO: Estado de servicios
export type ServiceStatus = 'activo' | 'cancelado' | 'postpuesto';

// ❌ REMOVIDO: OrderStatus
// export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Service {
  id: number;
  order_id: number;
  service_type: ServiceType;
  status: ServiceStatus;  // ✅ NUEVO
  name: string;
  // ... otros campos
  images?: ServiceImage[];  // ✅ NUEVO: soporte para archivos
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  user_id?: number;
  total_cost_price: string;  // ✅ Cambiado de total_amount
  total_sale_price: string;  // ✅ NUEVO
  total_profit: string;       // ✅ NUEVO
  created_at: string;
  // ❌ order_status removido
  // ❌ payment_method removido
  // ❌ notes removido
}

export interface OrderCreate {
  customer_id: number;
  // ❌ notes, payment_method, order_status removidos
}

export interface ServiceCreate {
  status?: ServiceStatus;  // ✅ NUEVO (opcional, default: activo)
  // ... otros campos
}
```

**Métodos actualizados:**
```typescript
// ❌ REMOVIDO
// updateOrder(orderId: number, status: OrderStatus)

// Los métodos de servicio permanecen igual
updateService(serviceId: number, serviceData: Partial<Service>)
addServiceImages(serviceId: number, imageUrls: string[])
```

### 2. Modelo ServiceImage

**Ya existe en el backend:**
```python
class ServiceImage(Base):
    id: Mapped[int]
    service_id: Mapped[int]
    image_url: Mapped[str]  # URL o path del archivo
```

**Métodos disponibles:**
```typescript
// Frontend
addServiceImages(serviceId: number, imageUrls: string[]): Observable<ServiceImage[]>
```

---

## 🎯 Cómo Usar el Nuevo Sistema

### 1. Crear una Orden con Servicio

```typescript
// Crear orden
const orderData: OrderCreate = {
  customer_id: 123
};

this.ordersService.createOrder(orderData).subscribe(order => {
  // Agregar servicio a la orden
  const serviceData: ServiceCreate = {
    order_id: order.id,
    service_type: 'FLIGHT',
    status: 'activo',  // Opcional, default es 'activo'
    name: 'Vuelo Bogotá - Madrid',
    cost_price: '500.00',
    sale_price: '750.00',
    origin_location_id: 1,
    destination_location_id: 2,
    departure_datetime: '2025-11-01T10:00:00Z',
    arrival_datetime: '2025-11-01T23:00:00Z',
    company: 'Avianca',
    pnr_code: 'ABC123'
  };

  this.ordersService.addServiceToOrder(order.id, serviceData).subscribe();
});
```

### 2. Actualizar el Estado de un Servicio

```typescript
// Cambiar estado de un servicio
this.ordersService.updateService(serviceId, {
  status: 'cancelado'  // o 'postpuesto', 'activo'
}).subscribe(updatedService => {
  console.log('Estado actualizado:', updatedService.status);
});
```

### 3. Agregar Archivos a un Servicio

```typescript
// Agregar imágenes/documentos al servicio
const imageUrls = [
  '/uploads/services/ticket_12345.pdf',
  '/uploads/services/boarding_pass.jpg'
];

this.ordersService.addServiceImages(serviceId, imageUrls).subscribe(images => {
  console.log('Archivos agregados:', images);
});
```

### 4. Obtener Detalles de Orden con Servicios e Imágenes

```typescript
this.ordersService.getOrderDetails(orderId).subscribe(order => {
  console.log('Orden:', order.order_number);
  console.log('Cliente:', order.customer.full_name);

  order.services.forEach(service => {
    console.log(`Servicio: ${service.name}`);
    console.log(`Estado: ${service.status}`);
    console.log(`Archivos: ${service.images?.length || 0}`);

    // Mostrar archivos
    service.images?.forEach(img => {
      console.log(`- ${img.image_url}`);
    });
  });
});
```

---

## 🎨 Componente de Badge de Estado (Ejemplo)

### Crear `service-status-badge.component.ts`

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceStatus } from '../../services/orders.service';

@Component({
  selector: 'app-service-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="getBadgeClass()">
      {{ getStatusLabel() }}
    </span>
  `
})
export class ServiceStatusBadgeComponent {
  @Input() status!: ServiceStatus;

  getBadgeClass(): string {
    const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

    switch (this.status) {
      case 'activo':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'cancelado':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      case 'postpuesto':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
    }
  }

  getStatusLabel(): string {
    switch (this.status) {
      case 'activo':
        return 'Activo';
      case 'cancelado':
        return 'Cancelado';
      case 'postpuesto':
        return 'Postpuesto';
      default:
        return this.status;
    }
  }
}
```

**Uso:**
```html
<app-service-status-badge [status]="service.status" />
```

---

## 📂 Componente de Vista Previa de Archivos (Ejemplo)

### Crear `service-files-preview.component.ts`

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceImage } from '../../services/orders.service';

@Component({
  selector: 'app-service-files-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white">
        Archivos Adjuntos
      </h4>

      <div *ngIf="!images || images.length === 0"
           class="text-sm text-gray-500 dark:text-gray-400">
        No hay archivos adjuntos
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div *ngFor="let image of images"
             class="relative group cursor-pointer">

          <!-- Vista previa de imagen -->
          <div *ngIf="isImage(image.image_url)"
               class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img [src]="image.image_url"
                 [alt]="'Archivo ' + image.id"
                 class="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                 (click)="openFile(image.image_url)">
          </div>

          <!-- Vista previa de PDF/documento -->
          <div *ngIf="!isImage(image.image_url)"
               class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
               (click)="openFile(image.image_url)">
            <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
            </svg>
          </div>

          <!-- Nombre del archivo -->
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ getFileName(image.image_url) }}
          </p>
        </div>
      </div>
    </div>
  `
})
export class ServiceFilesPreviewComponent {
  @Input() images: ServiceImage[] = [];

  isImage(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  getFileName(url: string): string {
    return url.split('/').pop() || 'archivo';
  }

  openFile(url: string): void {
    window.open(url, '_blank');
  }
}
```

**Uso:**
```html
<app-service-files-preview [images]="service.images || []" />
```

---

## 🔄 Actualizar Componentes Existentes

### 1. Order Details Table

```typescript
// order-details-table.component.ts
import { ServiceStatusBadgeComponent } from '../service-status-badge/service-status-badge.component';
import { ServiceFilesPreviewComponent } from '../service-files-preview/service-files-preview.component';

@Component({
  imports: [
    // ... otros imports
    ServiceStatusBadgeComponent,
    ServiceFilesPreviewComponent
  ]
})
```

```html
<!-- order-details-table.component.html -->
<tr *ngFor="let service of order.services">
  <td>{{ service.name }}</td>
  <td>
    <app-service-status-badge [status]="service.status" />
  </td>
  <td>{{ service.sale_price | currency }}</td>
  <td>
    <button (click)="showFiles(service)">
      Ver archivos ({{ service.images?.length || 0 }})
    </button>
  </td>
</tr>

<!-- Modal para mostrar archivos -->
<div *ngIf="selectedService" class="modal">
  <app-service-files-preview [images]="selectedService.images || []" />
</div>
```

### 2. Recent Orders Component

```html
<!-- recent-orders.component.html -->
<div *ngFor="let order of orders">
  <div *ngFor="let service of order.services">
    <span>{{ service.name }}</span>
    <app-service-status-badge [status]="service.status" />
    <span class="text-gray-500">
      {{ service.images?.length || 0 }} archivos
    </span>
  </div>
</div>
```

---

## 📝 Checklist de Implementación

### Backend ✅
- [x] Agregar `ServiceStatus` enum al modelo Service
- [x] Agregar campo `status` al modelo Service
- [x] Remover `OrderStatus` enum del modelo Order
- [x] Remover campo `status` del modelo Order
- [x] Actualizar schemas de Service con status
- [x] Actualizar schemas de Order (remover status)
- [x] Crear migración de base de datos
- [ ] Aplicar migración: `alembic upgrade head`

### Frontend ✅
- [x] Actualizar `ServiceStatus` type en orders.service.ts
- [x] Remover `OrderStatus` type
- [x] Agregar campo `status` a interface Service
- [x] Agregar campo `images` a interface Service
- [x] Actualizar interface Order (remover status, agregar profit)
- [x] Actualizar OrderCreate (remover campos de pago)
- [x] Actualizar ServiceCreate (agregar status)
- [x] Remover método `updateOrder(status)`
- [ ] Crear componente `ServiceStatusBadgeComponent`
- [ ] Crear componente `ServiceFilesPreviewComponent`
- [ ] Actualizar order-details-table para mostrar status
- [ ] Actualizar order-details-table para mostrar archivos
- [ ] Actualizar recent-orders para mostrar status
- [ ] Remover referencias a payment/order status en UI

---

## 🚀 Próximos Pasos

1. **Aplicar Migración de Base de Datos**
   ```bash
   cd /home/jligo/leandro/backend
   alembic upgrade head
   ```

2. **Crear Componentes de UI**
   - Badge de estado de servicio
   - Vista previa de archivos adjuntos
   - Modal para ver archivos en detalle

3. **Actualizar Componentes Existentes**
   - Order Details: agregar columna de estado y archivos
   - Recent Orders: mostrar badge de estado
   - Order Form: remover campos de pago/estado

4. **Probar el Flujo Completo**
   - Crear orden
   - Agregar servicio con estado
   - Subir archivos al servicio
   - Cambiar estado del servicio
   - Visualizar archivos en la UI

---

## 📄 Archivos Modificados

### Backend
1. ✅ `backend/app/models/service.py`
2. ✅ `backend/app/models/order.py`
3. ✅ `backend/app/schemas/service.py`
4. ✅ `backend/app/schemas/order.py`
5. ✅ `backend/alembic/versions/add_status_to_services_remove_from_orders.py`

### Frontend
6. ✅ `frontend/src/app/shared/services/orders.service.ts`

### Por Crear
7. ⏳ `frontend/src/app/shared/components/service-status-badge/service-status-badge.component.ts`
8. ⏳ `frontend/src/app/shared/components/service-files-preview/service-files-preview.component.ts`

---

## 💡 Notas Importantes

1. **Estado por defecto**: Todos los servicios nuevos se crean con estado `activo`
2. **Pagos**: Ya no se controlan estados de pago - toda orden se considera pagada
3. **Archivos**: Usar `ServiceImage` para asociar archivos (URLs o paths)
4. **Profit**: Calculado automáticamente como `sale_price - cost_price`
5. **Backward compatibility**: La migración maneja la transición de datos existentes

---

Este documento contiene toda la implementación necesaria para el nuevo sistema de estados en servicios y visualización de archivos adjuntos.
