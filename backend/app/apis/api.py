from fastapi import APIRouter

from app.apis.endpoints import auth, customers, exports, locations, orders, stats, upload, users

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders & Services"])
api_router.include_router(stats.router, prefix="/stats", tags=["Statistics"])
api_router.include_router(upload.router, prefix="/upload", tags=["File Upload"], redirect_slashes=False)
api_router.include_router(exports.router, prefix="/exports", tags=["Exports"])
