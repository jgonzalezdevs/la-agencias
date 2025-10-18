# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a FastAPI backend for a travel ticket sales platform (boletería). The project follows a domain-driven modular architecture with async database operations and a clear separation of concerns.

## Project Structure

```
boleteria_project/
├── alembic/                    # Database migrations
├── app/
│   ├── main.py                # FastAPI application entry point
│   ├── core/
│   │   ├── config.py          # Environment variables and settings
│   │   └── security.py        # JWT and password hashing logic
│   ├── db/
│   │   ├── base.py            # SQLAlchemy declarative base
│   │   └── session.py         # Database session management
│   ├── apis/
│   │   ├── api.py             # Main router that aggregates all endpoints
│   │   └── endpoints/
│   │       ├── auth.py        # /login, /register
│   │       ├── trips.py       # Trip and route management
│   │       ├── bookings.py    # Reservations and tickets
│   │       └── users.py       # User profiles
│   ├── models/                # SQLAlchemy models
│   │   ├── trip.py
│   │   ├── booking.py
│   │   └── user.py
│   ├── schemas/               # Pydantic models for validation/serialization
│   │   ├── trip.py
│   │   ├── booking.py
│   │   ├── user.py
│   │   └── token.py
│   └── services/              # Business logic layer
│       ├── booking_service.py
│       └── payment_service.py
├── tests/
├── .env
├── alembic.ini
└── pyproject.toml
```

## Core Architecture Patterns

### Service Layer Pattern

All business logic lives in the `app/services/` directory, not in endpoint handlers. Endpoints should be thin and only handle HTTP concerns.

Example service structure:
```python
# app/services/booking_service.py
def create_booking(db: Session, booking_data: schemas.BookingCreate, user: models.User):
    # 1. Check seat availability
    # 2. Process payment (call payment_service)
    # 3. Update seats and create booking in DB
```

### Pydantic Schema Pattern

Define separate schemas for different operations:
- `{Entity}Base`: Shared fields
- `{Entity}Create`: Fields accepted for creation
- `{Entity}`: Fields returned by API (includes id, computed fields)

Use `from_attributes = True` in `Config` class to map from SQLAlchemy models.

### Async Database Operations

The project uses SQLAlchemy 2.0+ with async support:
- Use `asyncpg` driver for PostgreSQL
- Database sessions are injected via FastAPI's dependency system
- Session management in `app/db/session.py` using `AsyncSession`

Example dependency injection:
```python
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

### Authentication & Authorization

- Uses OAuth2 with JWT tokens (`OAuth2PasswordBearer`)
- Password hashing with `passlib` (Bcrypt)
- User authentication injected via dependencies (`get_current_active_user`)
- Configuration loaded from environment using Pydantic's `BaseSettings` in `app/core/config.py`

## Development Commands

### Environment Setup
```bash
# Using Poetry (recommended)
poetry install
poetry shell

# Using PDM
pdm install
pdm run python

# Traditional venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Running the Application
```bash
# Development server with auto-reload
uvicorn app.main:app --reload

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Database Migrations
```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

### Testing
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_booking_service.py

# Run with coverage
pytest --cov=app tests/

# Run specific test function
pytest tests/test_booking_service.py::test_create_booking
```

### Code Quality
```bash
# Format code
black .

# Lint and check style
ruff check .

# Type checking
mypy app/
```

## Key Implementation Guidelines

### Background Tasks

For operations that shouldn't block the response:
- Simple tasks: Use FastAPI's `BackgroundTasks`
- Complex/critical tasks: Use Celery with RabbitMQ or Redis

Example:
```python
@router.post("/")
async def create_new_booking(
    booking: schemas.BookingCreate,
    background_tasks: BackgroundTasks,
    ...
):
    new_booking = booking_service.create_booking(...)
    background_tasks.add_task(email_service.send_booking_confirmation, ...)
    return new_booking
```

### Dependency Injection

Use FastAPI's dependency system for:
- Database sessions (`db: AsyncSession = Depends(get_db)`)
- Current user (`current_user: models.User = Depends(get_current_active_user)`)
- Role-based permissions

### Testing Strategy

- Use `pytest` as the test framework
- Use FastAPI's `TestClient` for API endpoint testing
- Use a separate test database (preferably in-memory SQLite for unit tests)
- Test service layer functions independently from endpoints

### Configuration Management

- Store all secrets and configuration in `.env` file
- Load configuration using Pydantic's `BaseSettings` in `app/core/config.py`
- Never commit `.env` to version control

## Dependency Management

The project uses `pyproject.toml` to centralize configuration for:
- Project dependencies
- Development tools (pytest, black, ruff, mypy)
- Package metadata

Prefer Poetry or PDM over traditional pip + requirements.txt for deterministic dependency resolution.
