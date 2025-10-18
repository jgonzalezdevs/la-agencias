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
) -> list[PopularTrip]:
    """
    Get ranking of most sold routes.

    Args:
        db: Database session
        limit: Maximum number of results

    Returns:
        List of popular trips with location details
    """
    stmt = (
        select(PopularTrip)
        .options(
            selectinload(PopularTrip.origin_location),
            selectinload(PopularTrip.destination_location)
        )
        .order_by(PopularTrip.sales_count.desc())
        .limit(limit)
    )

    result = await db.execute(stmt)
    return list(result.scalars().all())


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
