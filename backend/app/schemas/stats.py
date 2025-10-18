from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.location import Location


class PopularTripBase(BaseModel):
    """Base popular trip schema."""

    origin_location_id: int
    destination_location_id: int
    sales_count: int = 1


class PopularTripInDB(PopularTripBase):
    """Popular trip schema as stored in database."""

    id: int

    model_config = {"from_attributes": True}


class PopularTrip(PopularTripInDB):
    """Popular trip schema for API responses."""

    pass


class PopularTripWithDetails(BaseModel):
    """Popular trip with location details for ranking."""

    id: int
    origin_location: Location
    destination_location: Location
    sales_count: int

    model_config = {"from_attributes": True}


class ProfitStats(BaseModel):
    """Schema for profit statistics."""

    period: str  # Date string like "2025-01", "2025-01-15", etc.
    total_cost: Decimal
    total_sales: Decimal
    total_profit: Decimal
    order_count: int


class ProfitStatsResponse(BaseModel):
    """Response schema for profit statistics endpoint."""

    stats: list[ProfitStats]
    summary: dict[str, Decimal | int]  # Overall totals
