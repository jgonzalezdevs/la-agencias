from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.apis.api import api_router
from app.core.config import settings

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for serving uploaded avatars
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Boletería API",
        "docs": f"{settings.API_V1_PREFIX}/docs",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
