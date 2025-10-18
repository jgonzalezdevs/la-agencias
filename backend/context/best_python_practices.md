Markdown

# Mejores Prácticas para Backend con FastAPI: Venta de Boletos de Viaje

Esta guía detalla las mejores prácticas recomendadas para construir un backend robusto, escalable y mantenible para una plataforma de venta de boletos de viaje utilizando **FastAPI** y Python.

---

## 1. Estructura del Proyecto 🏗️

Una estructura modular y clara es fundamental para la escalabilidad. Organiza tu proyecto por funcionalidades (dominios) en lugar de por tipo de archivo.

**Estructura Recomendada:**

boleteria_project/ ├── alembic/ # Migraciones de base de datos ├── app/ │ ├── init.py │ ├── main.py # Punto de entrada de la aplicación FastAPI │ ├── core/ │ │ ├── init.py │ │ ├── config.py # Configuración y variables de entorno │ │ └── security.py # Lógica de JWT, hashing de contraseñas │ ├── db/ │ │ ├── init.py │ │ ├── base.py # Declarative base para SQLAlchemy y modelos base │ │ └── session.py # Gestión de sesiones de base de datos │ ├── apis/ │ │ ├── init.py │ │ ├── api.py # Enrutador principal que une todos los demás │ │ └── endpoints/ │ │ ├── init.py │ │ ├── auth.py # Endpoints de autenticación (/login, /register) │ │ ├── trips.py # Endpoints para viajes, rutas, etc. │ │ ├── bookings.py # Endpoints para reservas y boletos │ │ └── users.py # Endpoints para perfiles de usuario │ ├── models/ # Modelos de SQLAlchemy │ │ ├── init.py │ │ ├── trip.py │ │ ├── booking.py │ │ └── user.py │ ├── schemas/ # Modelos de Pydantic para validación y serialización │ │ ├── init.py │ │ ├── trip.py │ │ ├── booking.py │ │ ├── user.py │ │ └── token.py │ └── services/ # Lógica de negocio (Capa de Servicio) │ ├── init.py │ ├── booking_service.py │ └── payment_service.py ├── tests/ # Pruebas unitarias e de integración ├── .env # Variables de entorno (NO subir a Git) ├── .gitignore ├── alembic.ini # Configuración de Alembic ├── pyproject.toml # Dependencias y configuración del proyecto (con Poetry/PDM) └── README.md


**Ventaja:** Esta separación de responsabilidades (Separation of Concerns) hace que el código sea más fácil de encontrar, mantener y probar a medida que el proyecto crece.

---

## 2. Gestión de Dependencias y Entorno Virtual 📦

Nunca trabajes con el intérprete de Python global. Usa siempre un entorno virtual.

* **Herramientas Modernas:** Utiliza **Poetry** o **PDM** en lugar de `pip` y `requirements.txt`. Estas herramientas gestionan dependencias, entornos virtuales y la construcción de paquetes de forma integrada y determinista.
* **Archivo `pyproject.toml`:** Centraliza la configuración de tu proyecto, dependencias y herramientas de desarrollo (como `pytest`, `black`, `ruff`) en un solo lugar.

---

## 3. Pydantic para Validación de Datos ✅

Pydantic es el corazón de FastAPI. Úsalo extensivamente para definir la "forma" de tus datos.

* **Define Esquemas (Schemas):** Crea modelos Pydantic en `app/schemas/` para cada entidad. Ten esquemas distintos para la creación, actualización y lectura de datos.

    ```python
    # app/schemas/trip.py
    from pydantic import BaseModel
    from datetime import datetime

    # Esquema base con campos compartidos
    class TripBase(BaseModel):
        origin: str
        destination: str
        departure_time: datetime
        price: float

    # Esquema para crear un nuevo viaje (lo que recibe la API)
    class TripCreate(TripBase):
        available_seats: int

    # Esquema para leer un viaje (lo que devuelve la API)
    class Trip(TripBase):
        id: int
        is_active: bool

        class Config:
            from_attributes = True # Permite mapear desde modelos SQLAlchemy
    ```

* **Validación Automática:** FastAPI usará estos esquemas para validar automáticamente los datos de entrada de las peticiones y serializar los datos de salida. Esto te ahorra escribir código de validación repetitivo y te proporciona mensajes de error claros de forma gratuita.

---

## 4. Lógica de Negocio en una Capa de Servicio 🧠

Mantén tus endpoints (funciones de ruta) delgados. Su única responsabilidad debe ser manejar la petición HTTP, llamar a la lógica de negocio y devolver una respuesta.

* **Crea `services.py`:** Encapsula la lógica de negocio compleja en una capa de servicio. Por ejemplo, el proceso de crear una reserva implica verificar la disponibilidad de asientos, procesar un pago y crear el boleto.

    ```python
    # app/services/booking_service.py
    from sqlalchemy.orm import Session
    from .. import models, schemas
    from . import payment_service

    def create_booking(db: Session, booking_data: schemas.BookingCreate, user: models.User):
        # 1. Verificar si hay asientos disponibles
        trip = db.query(models.Trip).filter(models.Trip.id == booking_data.trip_id).first()
        if trip.available_seats < booking_data.seats:
            raise ValueError("No hay suficientes asientos disponibles.")

        # 2. Procesar el pago (llamando a otro servicio)
        total_price = trip.price * booking_data.seats
        payment_successful = payment_service.process_payment(user.id, total_price)
        if not payment_successful:
            raise ValueError("El pago falló.")

        # 3. Actualizar asientos y crear la reserva en la DB
        trip.available_seats -= booking_data.seats
        new_booking = models.Booking(**booking_data.dict(), user_id=user.id)
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        return new_booking
    ```

**Ventajas:** El código es más fácil de probar, reutilizar y razonar.

---

## 5. Base de Datos Asíncrona y ORM 💾

FastAPI brilla con operaciones asíncronas. Aprovecha esto para la base de datos.

* **SQLAlchemy Asíncrono:** Usa SQLAlchemy 2.0+ con un driver `async` como `asyncpg` para PostgreSQL.
* **Gestión de Sesiones:** Utiliza el sistema de inyección de dependencias de FastAPI para gestionar las sesiones de base de datos.

    ```python
    # app/db/session.py
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from ..core.config import settings

    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Dependency para obtener la sesión en los endpoints
    async def get_db() -> AsyncSession:
        async with AsyncSessionLocal() as session:
            yield session
    ```

* **Migraciones con Alembic:** Nunca modifiques la base de datos manualmente. Usa **Alembic** para gestionar las migraciones del esquema de tu base de datos de forma versionada y reproducible.

---

## 6. Autenticación y Seguridad 🔐

* **OAuth2 y JWT:** Utiliza el esquema `OAuth2PasswordBearer` de FastAPI para manejar la autenticación. Emite tokens **JWT (JSON Web Tokens)** que contengan el ID del usuario y su rol.
* **Contraseñas con Hash:** **Nunca** guardes contraseñas en texto plano. Usa una biblioteca como `passlib` para aplicarles un hash seguro (ej. Bcrypt).
* **Inyección de Dependencias para Seguridad:** Crea dependencias para obtener el usuario actual y verificar roles.

    ```python
    # app/apis/endpoints/bookings.py
    from fastapi import APIRouter, Depends
    from ..dependencies import get_current_active_user, get_db

    router = APIRouter()

    @router.post("/")
    async def create_new_booking(
        booking: schemas.BookingCreate,
        db: AsyncSession = Depends(get_db),
        current_user: models.User = Depends(get_current_active_user)
    ):
        # La dependencia 'get_current_active_user' ya ha validado el token
        # y nos entrega el objeto del usuario.
        return booking_service.create_booking(db=db, booking_data=booking, user=current_user)
    ```

* **Variables de Entorno:** Usa Pydantic's `BaseSettings` en `app/core/config.py` para cargar configuraciones (claves secretas, URL de la base de datos) desde variables de entorno. **NUNCA** guardes secretos en el código.

---

## 7. Tareas en Segundo Plano (Background Tasks) ⏳

Para operaciones que toman tiempo y no necesitan bloquear la respuesta al usuario (como enviar un email de confirmación de compra), usa tareas en segundo plano.

* **Opción Sencilla:** Para tareas simples, usa `BackgroundTasks` de FastAPI.
* **Opción Robusta:** Para tareas críticas, programadas o que requieren reintentos, integra un sistema de colas de tareas como **Celery** con RabbitMQ o Redis.

    ```python
    # app/apis/endpoints/bookings.py
    from fastapi import BackgroundTasks

    @router.post("/")
    async def create_new_booking(
        booking: schemas.BookingCreate,
        background_tasks: BackgroundTasks,
        ...
    ):
        new_booking = booking_service.create_booking(...)
        # La respuesta se envía al usuario inmediatamente
        # y el email se envía en segundo plano.
        background_tasks.add_task(
            email_service.send_booking_confirmation,
            email_to=current_user.email,
            booking_details=new_booking
        )
        return new_booking
    ```

---

## 8. Pruebas (Testing) 🧪

Escribir pruebas no es opcional. Te da la confianza para refactorizar y añadir nuevas funcionalidades sin romper lo existente.

* **Pytest:** Es el estándar de facto para pruebas en Python.
* **TestClient:** FastAPI proporciona un `TestClient` que te permite llamar a tus endpoints directamente en las pruebas sin necesidad de un servidor en ejecución.
* **Base de Datos de Prueba:** Configura tus pruebas para que se ejecuten contra una base de datos separada (y preferiblemente en memoria como SQLite para pruebas unitarias rápidas) para aislar los entornos.

---

## 9. Calidad del Código y Linting ✨

Un código consistente y limpio es más fácil de mantener.

* **Formateador:** Usa **Black** para formatear tu código automáticamente. Esto elimina las discusiones sobre el estilo.
* **Linter:** Usa **Ruff**. Es una herramienta extremadamente rápida que reemplaza a `flake8`, `isort` y muchas otras, ayudándote a detectar errores y a seguir las buenas prácticas.
* **Type Hinting:** Usa `mypy` para realizar un análisis estático de tipos. Esto te ayuda a encontrar errores antes de ejecutar el código.

Integra estas herramientas en tu editor y en tu pipeline de CI/CD para garantizar
