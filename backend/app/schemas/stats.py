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


class DashboardMetrics(BaseModel):
    """Dashboard summary metrics."""

    total_customers: int
    total_orders: int
    total_paid_orders: int
    total_profit: Decimal
    customers_growth: float  # Percentage growth
    orders_growth: float  # Percentage growth


class MonthlySales(BaseModel):
    """Monthly sales data."""

    month: int
    month_name: str
    total_sales: int
    total_revenue: Decimal


class YearlySalesData(BaseModel):
    """Yearly sales aggregated data."""

    year: int
    sales: list[int]  # 12 months of sales counts
    total_sales: str
    growth: str


class TargetData(BaseModel):
    """Target progress data (daily, monthly, annual)."""

    title: str
    subtitle: str
    percentage: float
    percentage_change: str
    message: str
    target: str
    profit: str  # Current period profit
    current: str
    current_label: str
    target_direction: str  # 'up' or 'down'
    profit_direction: str  # 'up' or 'down'
    current_direction: str  # 'up' or 'down'


class StatisticsChartData(BaseModel):
    """Statistics chart data for sales and profit."""

    year: int
    sales: list[int]  # 12 months of sales counts
    profit: list[float]  # 12 months of profit amounts (in hundreds)
