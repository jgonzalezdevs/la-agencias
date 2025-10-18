"""Statistics and analytics endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.apis.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.stats import PopularTripWithDetails
from app.services import stats_service

router = APIRouter()


@router.get("/profits")
async def get_profit_statistics(
    start_date: datetime | None = Query(None, description="Start date for filtering"),
    end_date: datetime | None = Query(None, description="End date for filtering"),
    group_by: str = Query("month", regex="^(day|week|month|year)$", description="Grouping period"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get profit statistics grouped by time period.

    Uses SQL aggregation with GROUP BY DATE_TRUNC to calculate:
    - Total cost
    - Total sales
    - Total profit
    - Order count

    Example: GET /stats/profits?start_date=2025-01-01&group_by=month

    Requires authentication.
    """
    stats = await stats_service.get_profit_stats(
        db,
        start_date=start_date,
        end_date=end_date,
        group_by=group_by
    )
    return stats


@router.get("/popular-trips", response_model=list[PopularTripWithDetails])
async def get_popular_trips(
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get ranking of the most sold routes.

    Returns popular trips with origin/destination location details.

    Requires authentication.
    """
    popular_trips = await stats_service.get_popular_trips(db, limit=limit)
    return popular_trips
