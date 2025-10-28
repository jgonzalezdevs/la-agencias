"""Statistics and analytics service."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order
from app.models.user import User
from app.models.popular_trip import PopularTrip
from app.models.location import Location


async def get_profit_stats(
    db: AsyncSession,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    group_by: str = "month"
) -> dict:
    """
    Get profit statistics grouped by time period.

    Args:
        db: Database session
        start_date: Start date filter
        end_date: End date filter
        group_by: Grouping period ('day', 'week', 'month', 'year')

    Returns:
        Dictionary with stats and summary
    """
    # Map group_by to PostgreSQL date_trunc format
    trunc_format = {
        "day": "day",
        "week": "week",
        "month": "month",
        "year": "year"
    }.get(group_by, "month")

    # Build base query
    stmt = select(
        func.date_trunc(trunc_format, Order.created_at).label("period"),
        func.sum(Order.total_cost_price).label("total_cost"),
        func.sum(Order.total_sale_price).label("total_sales"),
        func.sum(Order.total_sale_price - Order.total_cost_price).label("total_profit"),
        func.count(Order.id).label("order_count")
    )

    # Apply date filters
    if start_date:
        stmt = stmt.where(Order.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Order.created_at <= end_date)

    # Group and order
    stmt = stmt.group_by("period").order_by("period")

    # Execute query
    result = await db.execute(stmt)
    rows = result.all()

    # Format results
    stats = []
    for row in rows:
        stats.append({
            "period": row.period.isoformat() if row.period else None,
            "total_cost": float(row.total_cost or 0),
            "total_sales": float(row.total_sales or 0),
            "total_profit": float(row.total_profit or 0),
            "order_count": row.order_count or 0
        })

    # Calculate summary totals
    summary_stmt = select(
        func.sum(Order.total_cost_price).label("total_cost"),
        func.sum(Order.total_sale_price).label("total_sales"),
        func.sum(Order.total_sale_price - Order.total_cost_price).label("total_profit"),
        func.count(Order.id).label("order_count")
    )

    if start_date:
        summary_stmt = summary_stmt.where(Order.created_at >= start_date)
    if end_date:
        summary_stmt = summary_stmt.where(Order.created_at <= end_date)

    summary_result = await db.execute(summary_stmt)
    summary_row = summary_result.one()

    summary = {
        "total_cost": float(summary_row.total_cost or 0),
        "total_sales": float(summary_row.total_sales or 0),
        "total_profit": float(summary_row.total_profit or 0),
        "order_count": summary_row.order_count or 0
    }

    return {
        "stats": stats,
        "summary": summary
    }


async def get_popular_trips(
    db: AsyncSession,
    limit: int = 10
) -> list[dict]:
    """
    Get ranking of most sold routes based on actual services sold.
    Calculates dynamically from services table (FLIGHT and BUS types).

    Args:
        db: Database session
        limit: Maximum number of results

    Returns:
        List of popular trips with location details and sales count
    """
    from app.models.service import Service, ServiceType

    # Query to count services by route (origin -> destination)
    # Only count FLIGHT and BUS services from paid orders
    stmt = (
        select(
            Service.origin_location_id,
            Service.destination_location_id,
            func.count(Service.id).label("sales_count")
        )
        .join(Order, Service.order_id == Order.id)
        .where(
            Service.service_type.in_([ServiceType.FLIGHT, ServiceType.BUS]),
            Service.origin_location_id.is_not(None),
            Service.destination_location_id.is_not(None),
        )
        .group_by(Service.origin_location_id, Service.destination_location_id)
        .order_by(func.count(Service.id).desc())
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()

    # Fetch location details for each route
    popular_trips = []
    for row in rows:
        # Get origin location
        origin_stmt = select(Location).where(Location.id == row.origin_location_id)
        origin_result = await db.execute(origin_stmt)
        origin_location = origin_result.scalar_one_or_none()

        # Get destination location
        dest_stmt = select(Location).where(Location.id == row.destination_location_id)
        dest_result = await db.execute(dest_stmt)
        dest_location = dest_result.scalar_one_or_none()

        if origin_location and dest_location:
            popular_trips.append({
                "id": row.origin_location_id * 1000 + row.destination_location_id,  # Generate unique ID
                "origin_location": origin_location,
                "destination_location": dest_location,
                "sales_count": row.sales_count
            })

    return popular_trips


async def get_top_sellers(
    db: AsyncSession,
    limit: int = 10
) -> list[User]:
    """
    Get ranking of operators with most sales.

    Args:
        db: Database session
        limit: Maximum number of results

    Returns:
        List of users ordered by sales_count
    """
    stmt = (
        select(User)
        .where(User.is_active == True)
        .order_by(User.sales_count.desc())
        .limit(limit)
    )

    result = await db.execute(stmt)
    return list(result.scalars().all())
