# Boletería Backend API

FastAPI backend for a travel ticket sales platform (boletería) with Python 3.12.

## Features

- **User Authentication**: JWT-based authentication with OAuth2
- **Trip Management**: Create, read, update, and delete travel trips
- **Booking System**: Reserve tickets with seat availability tracking
- **Payment Processing**: Placeholder for payment gateway integration
- **Database Migrations**: Alembic for database schema management
- **Async Operations**: Full async/await support with SQLAlchemy 2.0+

## Project Structure

```
backend/
├── app/
│   ├── apis/              # API endpoints
│   │   ├── endpoints/     # Route handlers
│   │   │   ├── auth.py    # Authentication endpoints
│   │   │   ├── users.py   # User management
│   │   │   ├── trips.py   # Trip management
│   │   │   └── bookings.py # Booking management
│   │   └── api.py         # Main API router
│   ├── core/              # Core configuration
│   │   ├── config.py      # Settings management
│   │   └── security.py    # JWT and password hashing
│   ├── db/                # Database configuration
│   │   ├── base.py        # SQLAlchemy base
│   │   └── session.py     # Session management
│   ├── models/            # SQLAlchemy models
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic layer
│   └── main.py            # Application entry point
├── alembic/               # Database migrations
├── tests/                 # Test suite
└── pyproject.toml         # Dependencies and configuration
```

## Setup

### 1. Install Dependencies

Using Poetry (recommended):
```bash
poetry install
poetry shell
```

Using pip:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .
```

### 2. Configure Environment

Copy the example environment file and update with your settings:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: Your PostgreSQL connection string
- `SECRET_KEY`: A secure secret key for JWT tokens
- Other configuration as needed

### 3. Set Up Database

Make sure PostgreSQL is running and create the database:
```bash
createdb boleteria_db
```

Run migrations:
```bash
alembic upgrade head
```

### 4. Run the Application

Development server with auto-reload:
```bash
uvicorn app.main:app --reload
```

Production:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc

## Database Migrations

### Create a new migration:
```bash
alembic revision --autogenerate -m "description of changes"
```

### Apply migrations:
```bash
alembic upgrade head
```

### Rollback one migration:
```bash
alembic downgrade -1
```

## Testing

Run all tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app tests/
```

Run specific test file:
```bash
pytest tests/test_main.py
```

## Code Quality

### Format code:
```bash
black .
```

### Lint code:
```bash
ruff check .
```

### Type checking:
```bash
mypy app/
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Users
- `GET /api/v1/users/me` - Get current user info
- `PUT /api/v1/users/me` - Update current user
- `GET /api/v1/users/` - List all users (superuser only)
- `GET /api/v1/users/{id}` - Get user by ID (superuser only)

### Trips
- `GET /api/v1/trips/` - List all trips (with filters)
- `GET /api/v1/trips/{id}` - Get trip details
- `POST /api/v1/trips/` - Create trip (superuser only)
- `PUT /api/v1/trips/{id}` - Update trip (superuser only)
- `DELETE /api/v1/trips/{id}` - Delete trip (superuser only)

### Bookings
- `GET /api/v1/bookings/` - List user's bookings
- `GET /api/v1/bookings/{id}` - Get booking details
- `POST /api/v1/bookings/` - Create new booking
- `DELETE /api/v1/bookings/{id}` - Cancel booking

## Development

This project follows a domain-driven modular architecture with:

- **Service Layer Pattern**: Business logic separated from HTTP handlers
- **Dependency Injection**: FastAPI's dependency system for database sessions and auth
- **Async Operations**: Full async/await support throughout the stack
- **Type Safety**: Pydantic for validation, type hints everywhere

## License

MIT
