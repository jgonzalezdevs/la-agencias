# Correcciones Aplicadas - La Agencias

**Fecha**: 2025-11-02
**Versión**: v1.0

## Resumen

Este documento detalla todas las correcciones aplicadas al sistema basadas en el archivo `correçao da web.docx`.

---

## ✅ Correcciones Backend

### 1. **Nuevos campos en el modelo Order** ✅

**Archivo**: `/backend/app/models/order.py`

Se agregaron tres nuevos campos al modelo `Order`:
- `custom_ticket_number` (String 100): Número de ticket personalizado ingresado por el usuario
- `observations` (Text): Notas y observaciones sobre la orden
- `attachment_urls` (Text): URLs de archivos adjuntos (PDFs, imágenes) en formato JSON

```python
custom_ticket_number: Mapped[str | None] = mapped_column(String(100), index=True)
observations: Mapped[str | None] = mapped_column(Text)
attachment_urls: Mapped[str | None] = mapped_column(Text)
```

---

### 2. **Schemas actualizados** ✅

**Archivo**: `/backend/app/schemas/order.py`

Los schemas de Pydantic fueron actualizados para incluir los nuevos campos:
- `OrderBase`: Agregados custom_ticket_number, observations, attachment_urls
- `OrderInDB`: Incluye los nuevos campos en la respuesta

---

### 3. **Servicio de órdenes actualizado** ✅

**Archivo**: `/backend/app/services/order_service.py`

#### Función `create_order`:
- Ahora guarda los nuevos campos al crear una orden

#### Funciones `list_orders` y `list_orders_with_details`:
- **Filtro por número de ticket**: Búsqueda con `ILIKE` por `custom_ticket_number`
- **Filtro por teléfono**: Join con la tabla `customers` y búsqueda con `ILIKE` por `phone`

```python
if ticket_number:
    stmt = stmt.where(Order.custom_ticket_number.ilike(f"%{ticket_number}%"))

if phone_number:
    stmt = stmt.join(Customer).where(Customer.phone.ilike(f"%{phone_number}%"))
```

---

### 4. **Endpoints actualizados** ✅

**Archivo**: `/backend/app/apis/endpoints/orders.py`

Los endpoints ahora aceptan los nuevos query parameters:
- `phone_number`: Filtrar por teléfono del cliente
- `ticket_number`: Filtrar por número de ticket personalizado

```python
@router.get("/", response_model=list[order_schemas.Order])
async def list_orders(
    ...
    phone_number: str | None = Query(None, description="Filter by customer phone number"),
    ticket_number: str | None = Query(None, description="Filter by custom ticket number"),
    ...
)
```

---

### 5. **Servicio de exportación corregido** ✅

**Archivo**: `/backend/app/services/export_service.py`

**Problema corregido**: Los filtros de fecha no se estaban aplicando correctamente.

**Solución**:
- Los filtros de fecha ahora se aplican a `Order.created_at` (fecha de venta) en lugar de `Service.departure_datetime`
- Los filtros de estado y tipo de servicio se aplican **después** de obtener las órdenes, filtrando los servicios dentro de cada orden
- Esto asegura que los reportes de Excel y PDF respeten los filtros aplicados por el usuario

```python
# Filtros por fecha de venta (Order.created_at)
if start_date:
    start_datetime = datetime.combine(start_date, datetime.min.time())
    query = query.where(Order.created_at >= start_datetime)
if end_date:
    end_datetime = datetime.combine(end_date, datetime.max.time())
    query = query.where(Order.created_at <= end_datetime)
```

---

### 6. **Migración de base de datos** ✅

**Archivo**: `/backend/alembic/versions/add_order_custom_fields.py`

Se creó una nueva migración de Alembic que:
- Agrega la columna `custom_ticket_number` con índice
- Agrega la columna `observations`
- Agrega la columna `attachment_urls`

**Para aplicar la migración en el servidor**:
```bash
cd /home/jligo/leandro/backend
alembic upgrade head
```

---

## ✅ Correcciones Frontend

### 7. **Tamaño del ícono del Date Picker** ✅

**Archivo**: `/frontend/src/app/shared/components/form/date-picker/date-picker.component.html`

**Problema**: El ícono del calendario era muy grande (24px).

**Solución**: Reducido de `size-6` (24px) a `size-4` (16px).

```html
<!-- Antes: class="size-6" -->
<!-- Ahora: class="size-4" -->
<svg ... class="size-4">...</svg>
```

---

### 8. **Calendario usa fecha de vuelo correctamente** ✅

**Archivo**: `/frontend/src/app/pages/calender/calender.component.ts`

**Verificación**: El calendario ya está implementado correctamente:
- Prioriza `departure_datetime` de los servicios para mostrar eventos
- Solo usa `created_at` (fecha de venta) como fallback cuando no hay fecha de vuelo
- **Líneas 584-596**: Lógica que verifica y usa `departure_datetime` primero

**No se requieren cambios adicionales** - el código ya está funcionando como se esperaba.

---

## ⚠️ Pendientes para el Frontend

Estos cambios requieren actualización del formulario de creación/edición de órdenes en el frontend:

### 9. **Agregar campos al componente Calendar** ⏳

**Archivo a modificar**: `/frontend/src/app/pages/calender/calender.component.ts` y su HTML

Se debe agregar:
1. Campo de entrada para `custom_ticket_number` (número de ticket personalizado)
2. Área de texto para `observations` (observaciones)
3. Sistema de carga de archivos para `attachment_urls` (PDFs, imágenes)

**Esto se puede hacer después de conectarse al servidor y probar los cambios del backend.**

---

## 📋 Cambios por Archivo

### Backend
```
✅ backend/app/models/order.py
✅ backend/app/schemas/order.py
✅ backend/app/services/order_service.py
✅ backend/app/services/export_service.py
✅ backend/app/apis/endpoints/orders.py
✅ backend/alembic/versions/add_order_custom_fields.py
```

### Frontend
```
✅ frontend/src/app/shared/components/form/date-picker/date-picker.component.html
⏳ frontend/src/app/pages/calender/calender.component.ts (pendiente: agregar campos)
⏳ frontend/src/app/pages/calender/calender.component.html (pendiente: agregar campos)
```

---

## 🚀 Pasos para Deployment en el Servidor

### 1. Hacer commit de los cambios locales
```bash
cd /home/jligo/leandro
git add .
git commit -m "feat: add custom ticket fields, fix filters and exports

- Add custom_ticket_number, observations, attachment_urls to Order model
- Fix search filters by phone and ticket number
- Fix export service to respect date filters
- Reduce date picker icon size
- Create migration for new order fields"
git push origin main
```

### 2. En el servidor (Contabo)
```bash
# Navegar al proyecto
cd /ruta/del/proyecto/backend

# Hacer pull de los cambios
git pull origin main

# Aplicar migración de base de datos
alembic upgrade head

# Reiniciar backend (si usa systemd/docker)
sudo systemctl restart backend  # O docker-compose restart backend

# Para el frontend
cd ../frontend
git pull origin main
npm run build
# Copiar dist a nginx o reiniciar contenedor frontend
```

---

## 🧪 Testing Recomendado

### Backend
1. ✅ Verificar que la migración se aplique sin errores
2. ✅ Crear una orden con custom_ticket_number y observations
3. ✅ Buscar órdenes por teléfono del cliente
4. ✅ Buscar órdenes por número de ticket personalizado
5. ✅ Exportar reporte Excel/PDF con filtros de fecha y verificar que se respeten

### Frontend
1. ✅ Verificar que el ícono del date picker sea más pequeño
2. ✅ Verificar que el calendario muestre eventos por fecha de vuelo
3. ⏳ Agregar campos de ticket y observaciones al formulario (pendiente)
4. ⏳ Probar carga de archivos adjuntos (pendiente)

---

## 📝 Notas Adicionales

- **Seguridad de datos**: Los PDFs y archivos se guardan como URLs, no como binarios en la base de datos
- **Búsqueda flexible**: Los filtros de teléfono y ticket usan `ILIKE` para búsquedas case-insensitive y parciales
- **Compatibilidad**: Todos los cambios son retrocompatibles - las órdenes existentes funcionarán sin problemas

---

## 🐛 Problemas Conocidos

1. **Calendario - duplicación**: Se verificó el código y no debería haber duplicación. Si persiste en el servidor, revisar los datos en la base de datos.
2. **Subida de archivos**: La funcionalidad de subida de PDFs requiere que el endpoint `/api/v1/upload` esté funcionando correctamente en el servidor.

---

**Fin del documento**
