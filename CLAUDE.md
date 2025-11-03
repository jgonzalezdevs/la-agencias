# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **monorepo** containing a full-stack travel ticket sales platform (boletería) with:
- **Frontend**: Angular 20+ with Tailwind CSS v4 admin dashboard
- **Backend**: FastAPI (Python 3.12) REST API with async operations

The platform supports ticket sales for flights and buses, e-commerce features, invoicing, user management, and analytics dashboards.

## Repository Structure

```
/home/jligo/leandro/
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── apis/endpoints/          # API route handlers
│   │   ├── core/                    # Configuration and security
│   │   ├── db/                      # Database session management
│   │   ├── models/                  # SQLAlchemy models
│   │   ├── schemas/                 # Pydantic schemas
│   │   └── services/                # Business logic layer
│   ├── alembic/                     # Database migrations
│   └── tests/
└── frontend/  # Angular frontend
    ├── src/app/
    │   ├── pages/                   # Feature pages
    │   ├── shared/
    │   │   ├── components/          # Reusable components
    │   │   ├── layout/              # Layout components
    │   │   └── services/            # Frontend services
    │   └── app.routes.ts            # Routing configuration
    └── public/i18n/                 # Internationalization files
```

## Development Workflow

### Backend Development (FastAPI)

**Location**: `/home/jligo/leandro/backend/`

**Setup and Run**:
```bash
cd /home/jligo/leandro/backend

# Setup environment (first time)
poetry install && poetry shell
# OR: python -m venv venv && source venv/bin/activate && pip install -e .

# Run development server
uvicorn app.main:app --reload
```
Access API at: `http://localhost:8000/api/v1/docs` (Swagger UI)

**Database Migrations**:
```bash
# Create migration after model changes
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

**Testing**:
```bash
pytest                           # All tests
pytest tests/test_file.py        # Specific file
pytest --cov=app tests/          # With coverage
```

**Code Quality**:
```bash
black .                          # Format code
ruff check .                     # Lint
mypy app/                        # Type check
```

### Frontend Development (Angular)

**Location**: `/home/jligo/leandro/frontend/`

**Setup and Run**:
```bash
cd /home/jligo/leandro/frontend

# Setup (first time)
npm install

# Run development server
npm start
# OR: ng serve
```
Access at: `http://localhost:4200`

**Build**:
```bash
npm run build                    # Production build
npm run watch                    # Development build with watch
```

**Testing**:
```bash
npm test                         # Run tests with Karma
```

## Architecture

### Backend Architecture (FastAPI)

**Pattern**: Domain-driven modular architecture with service layer pattern

**Key Concepts**:
1. **Service Layer**: All business logic in `app/services/`, endpoints are thin HTTP handlers
2. **Async Operations**: Uses SQLAlchemy 2.0+ with `asyncpg` for PostgreSQL
3. **Dependency Injection**: Database sessions and auth via FastAPI dependencies
4. **Authentication**: JWT tokens with OAuth2, managed in `app/core/security.py`

**Data Flow**:
```
Request → Endpoint (apis/endpoints/) → Service (services/) → Repository (models/) → Database
```

**Adding New Features**:
1. Create SQLAlchemy model in `app/models/{entity}.py`
2. Create Pydantic schemas in `app/schemas/{entity}.py` (Base, Create, Response)
3. Create service in `app/services/{entity}_service.py` for business logic
4. Create endpoint in `app/apis/endpoints/{entity}.py`
5. Register endpoint in `app/apis/api.py`
6. Generate migration: `alembic revision --autogenerate -m "add {entity}"`
7. Apply migration: `alembic upgrade head`

**Current API Modules**:
- `auth.py`: Authentication endpoints (/login, /register)
- `users.py`: User management
- `customers.py`: Customer management
- `orders.py`: Order/booking management
- `locations.py`: Location/route management
- `stats.py`: Dashboard statistics

### Frontend Architecture (Angular)

**Pattern**: Standalone component-based architecture (no NgModules)

**Key Concepts**:
1. **Standalone Components**: All components use `standalone: true`
2. **Nested Layouts**: `AppLayoutComponent` wraps authenticated routes, `AuthPageLayout` for public pages
3. **Service-based State**: `ThemeService` (dark mode), `SidebarService` (navigation), `ModalService` (modals)
4. **Signals**: Uses Angular 20+ signal-based patterns for reactive state

**Layout System**:
```
AppLayoutComponent (sidebar + header)
  ├── Dashboard pages (wrapped by layout)
  └── Main content area with responsive margin

AuthPageLayout (standalone)
  └── Signin/Signup pages
```

**Routing Pattern** (in `app.routes.ts`):
- Base route (`''`): Wraps all dashboard pages with `AppLayoutComponent`
- Auth routes (`/signin`, `/signup`): Standalone with `AuthPageLayout`
- Catch-all (`**`): 404 page

**Adding New Dashboard Pages**:
1. Create component in `src/app/pages/{feature}/`
2. Make it standalone: `standalone: true, imports: [CommonModule, ...]`
3. Add route in `app.routes.ts` as child of base route (AppLayoutComponent wrapper)
4. Update sidebar navigation in `app-sidebar.component.ts` if needed

**Component Organization**:
- `shared/components/ui/`: Reusable UI primitives (button, modal, dropdown, table, etc.)
- `shared/components/form/`: Form components (input, select, date-picker, etc.)
- `shared/components/common/`: Cross-cutting components (theme-toggle, breadcrumb, etc.)
- `shared/components/ecommerce/`: Dashboard-specific components
- `shared/layout/`: Layout components (AppLayoutComponent, AuthPageLayout, sidebar, header)

**Styling**:
- Tailwind CSS v4 with custom theme in `src/styles.css`
- Dark mode via custom variant: `@custom-variant dark (&:is(.dark *))`
- Custom utilities: `menu-item-*`, `no-scrollbar`, `custom-scrollbar`

### Integration Between Frontend and Backend

**API Communication**:
- Backend API base: `http://localhost:8000/api/v1/`
- Frontend should use HttpClient service to connect to backend
- Backend has CORS configured in `app/main.py`

**Data Entities Alignment**:
The backend implements models for users, customers, orders, and locations. The frontend includes UI for:
- E-commerce dashboard (products, transactions)
- Invoice management
- User profiles
- Calendar (for ticket scheduling)
- Charts and analytics

**Authentication Flow**:
1. Frontend sends credentials to `/api/v1/auth/login`
2. Backend returns JWT token
3. Frontend stores token and includes in Authorization header
4. Backend validates token via `get_current_user` dependency

## Key Documentation Files

Each subdirectory has its own detailed CLAUDE.md:
- **Backend**: `/home/jligo/leandro/backend/CLAUDE.md` - FastAPI architecture, service patterns, database migrations
- **Frontend**: `/home/jligo/leandro/frontend/CLAUDE.md` - Angular architecture, component patterns, layout system

Additional important files:
- **Backend Spec**: `/home/jligo/leandro/frontend/BACKEND_SPECIFICATION.md` - Complete backend API specification with entities, endpoints, and use cases
- **Backend API Docs**: `/home/jligo/leandro/backend/API_DOCUMENTATION.md` - API endpoint documentation
- **Frontend README**: `/home/jligo/leandro/frontend/README.md` - La Agencias template information

## Common Development Tasks

### Running Full Stack Locally

```bash
# Terminal 1 - Backend
cd /home/jligo/leandro/backend
poetry shell  # or: source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd /home/jligo/leandro/frontend
npm start
```

Backend: `http://localhost:8000/api/v1/docs`
Frontend: `http://localhost:4200`

### Working with Database

The backend uses PostgreSQL with Alembic migrations:

```bash
cd /home/jligo/leandro/backend

# After modifying models in app/models/
alembic revision --autogenerate -m "description"
alembic upgrade head

# View migration history
alembic history

# Rollback
alembic downgrade -1
```

### Adding a New API Endpoint

1. **Define Model** (`backend/app/models/{entity}.py`):
   ```python
   from app.db.base import Base
   from sqlalchemy import Column, Integer, String

   class Entity(Base):
       __tablename__ = "entities"
       id = Column(Integer, primary_key=True)
       name = Column(String, nullable=False)
   ```

2. **Define Schemas** (`backend/app/schemas/{entity}.py`):
   ```python
   from pydantic import BaseModel

   class EntityBase(BaseModel):
       name: str

   class EntityCreate(EntityBase):
       pass

   class Entity(EntityBase):
       id: int

       model_config = {"from_attributes": True}
   ```

3. **Create Service** (`backend/app/services/{entity}_service.py`):
   ```python
   from sqlalchemy.ext.asyncio import AsyncSession

   async def create_entity(db: AsyncSession, entity_data: schemas.EntityCreate):
       # Business logic here
       pass
   ```

4. **Create Endpoint** (`backend/app/apis/endpoints/{entity}.py`):
   ```python
   from fastapi import APIRouter, Depends
   from sqlalchemy.ext.asyncio import AsyncSession
   from app.db.session import get_db

   router = APIRouter()

   @router.post("/", response_model=schemas.Entity)
   async def create_entity(
       entity: schemas.EntityCreate,
       db: AsyncSession = Depends(get_db)
   ):
       return await entity_service.create_entity(db, entity)
   ```

5. **Register in API** (`backend/app/apis/api.py`):
   ```python
   from app.apis.endpoints import entity
   api_router.include_router(entity.router, prefix="/entities", tags=["entities"])
   ```

6. **Create and Run Migration**:
   ```bash
   alembic revision --autogenerate -m "add entity table"
   alembic upgrade head
   ```

### Adding a New Frontend Page

1. **Create Component**:
   ```bash
   cd /home/jligo/leandro/frontend
   ng generate component pages/my-feature --standalone
   ```

2. **Make it Standalone** (if not already):
   ```typescript
   @Component({
     selector: 'app-my-feature',
     standalone: true,
     imports: [CommonModule, RouterModule, ...],
     templateUrl: './my-feature.component.html'
   })
   ```

3. **Add Route** (`src/app/app.routes.ts`):
   ```typescript
   {
     path: '',
     component: AppLayoutComponent,
     children: [
       // ... existing routes
       { path: 'my-feature', component: MyFeatureComponent }
     ]
   }
   ```

4. **Update Sidebar** (`src/app/shared/layout/app-sidebar/app-sidebar.component.ts`):
   Add menu item linking to `/my-feature`

## Environment Configuration

### Backend `.env`
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/boleteria_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend
Environment variables can be set in Angular environment files (if configured) or directly in code for API base URL.

## Testing Strategy

### Backend Tests
- **Location**: `backend/tests/`
- **Framework**: pytest with FastAPI TestClient
- Use separate test database (configure in conftest.py)
- Test service layer independently from endpoints

### Frontend Tests
- **Framework**: Karma + Jasmine
- Test components, services, and integration
- Run with `npm test`

## Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.12)
- **Database**: PostgreSQL with asyncpg driver
- **ORM**: SQLAlchemy 2.0+ (async)
- **Migrations**: Alembic
- **Auth**: JWT with OAuth2 + Passlib (Bcrypt)
- **Validation**: Pydantic
- **Tools**: Poetry/PDM (dependency management), Black (formatting), Ruff (linting), MyPy (type checking)

### Frontend
- **Framework**: Angular 20+
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Build**: Angular CLI with Vite
- **Charts**: ApexCharts, amCharts5, D3.js
- **UI Libraries**: FullCalendar, Flatpickr, Swiper, Prism.js
- **i18n**: ngx-translate (supports en, es, pt)
