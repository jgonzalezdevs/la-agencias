# Import order matters to resolve forward references
from app.schemas.customer import Customer, CustomerCreate, CustomerUpdate
from app.schemas.location import Location, LocationCreate, LocationUpdate
from app.schemas.order import Order, OrderCreate, OrderUpdate, OrderWithDetails
from app.schemas.service import Service, ServiceCreate, ServiceUpdate, ServiceWithDetails
from app.schemas.stats import (
    PopularTrip as PopularTripSchema,
    PopularTripWithDetails,
    ProfitStats,
    ProfitStatsResponse,
)
from app.schemas.token import Token, TokenData
from app.schemas.user import User, UserCreate, UserUpdate

# Rebuild models with forward references after all imports are complete
ServiceWithDetails.model_rebuild()
OrderWithDetails.model_rebuild()

__all__ = [
    "User",
    "UserCreate",
    "UserUpdate",
    "Customer",
    "CustomerCreate",
    "CustomerUpdate",
    "Location",
    "LocationCreate",
    "LocationUpdate",
    "Order",
    "OrderCreate",
    "OrderUpdate",
    "OrderWithDetails",
    "Service",
    "ServiceCreate",
    "ServiceUpdate",
    "ServiceWithDetails",
    "Token",
    "TokenData",
    "PopularTripSchema",
    "PopularTripWithDetails",
    "ProfitStats",
    "ProfitStatsResponse",
]
