"""Statistics and analytics endpoints."""

from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, extract, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.apis.dependencies import get_current_active_user, get_current_superuser
from app.db.session import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.order import Order
from app.models.service import Service, ServiceType
from app.schemas.stats import (
    PopularTripWithDetails,
    DashboardMetrics,
    YearlySalesData,
    TargetData,
    StatisticsChartData,
)
from app.services import stats_service

router = APIRouter()


@router.get("/available-years")
async def get_available_years(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)  # Operators need this for calendar
):
    """
    Get list of available years for calendar filtering based on service dates.

    Queries the earliest and latest departure_datetime from FLIGHT/BUS services,
    then returns all years in that range (including years without data).

    Returns years in descending order (most recent first).
    Used for filtering calendar events by year.

    Requires authentication.
    """
    # Query min and max departure dates from services
    result = await db.execute(
        select(
            func.min(Service.departure_datetime).label("min_date"),
            func.max(Service.departure_datetime).label("max_date")
        )
        .where(
            and_(
                Service.departure_datetime.is_not(None),
                or_(
                    Service.service_type == ServiceType.FLIGHT,
                    Service.service_type == ServiceType.BUS
                )
            )
        )
    )

    row = result.first()

    if row and row.min_date and row.max_date:
        # Extract years from min and max dates
        min_year = row.min_date.year
        max_year = row.max_date.year

        # Generate all years in range (descending order)
        years = list(range(max_year, min_year - 1, -1))
    else:
        # No services found, return current year as fallback
        current_year = datetime.now().year
        years = [current_year]

    return {"years": years}


@router.get("/profits")
async def get_profit_statistics(
    start_date: datetime | None = Query(None, description="Start date for filtering"),
    end_date: datetime | None = Query(None, description="End date for filtering"),
    group_by: str = Query("month", regex="^(day|week|month|year)$", description="Grouping period"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser)  # Admin only
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
    _: User = Depends(get_current_superuser)  # Admin only
):
    """
    Get ranking of the most sold routes.

    Returns popular trips with origin/destination location details.

    Requires authentication.
    """
    popular_trips = await stats_service.get_popular_trips(db, limit=limit)
    return popular_trips


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),  # Admin only
):
    """
    Get dashboard summary metrics.
    Shows total customers, orders, and growth percentages.
    """
    # Get total customers
    result = await db.execute(select(func.count(Customer.id)))
    total_customers = result.scalar()

    # Get total orders
    result = await db.execute(select(func.count(Order.id)))
    total_orders = result.scalar()

    # Get total paid orders (all orders are considered paid)
    total_paid_orders = total_orders

    # Get total profit (sum of profit margin from all orders)
    result = await db.execute(
        select(func.sum(Order.total_sale_price - Order.total_cost_price))
    )
    total_profit = result.scalar() or Decimal("0")

    # Calculate growth percentages (comparing last 30 days vs previous 30 days)
    now = datetime.now()
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)

    # Customers growth
    result = await db.execute(
        select(func.count(Customer.id)).where(Customer.created_at >= thirty_days_ago)
    )
    recent_customers = result.scalar()

    result = await db.execute(
        select(func.count(Customer.id)).where(
            and_(
                Customer.created_at >= sixty_days_ago,
                Customer.created_at < thirty_days_ago,
            )
        )
    )
    previous_customers = result.scalar()

    customers_growth = 0.0
    if previous_customers > 0:
        customers_growth = ((recent_customers - previous_customers) / previous_customers) * 100

    # Orders growth
    result = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= thirty_days_ago)
    )
    recent_orders = result.scalar()

    result = await db.execute(
        select(func.count(Order.id)).where(
            and_(Order.created_at >= sixty_days_ago, Order.created_at < thirty_days_ago)
        )
    )
    previous_orders = result.scalar()

    orders_growth = 0.0
    if previous_orders > 0:
        orders_growth = ((recent_orders - previous_orders) / previous_orders) * 100

    return DashboardMetrics(
        total_customers=total_customers,
        total_orders=total_orders,
        total_paid_orders=total_paid_orders,
        total_profit=total_profit,
        customers_growth=round(customers_growth, 2),
        orders_growth=round(orders_growth, 2),
    )


@router.get("/monthly-sales/{year}", response_model=YearlySalesData)
async def get_monthly_sales(
    year: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),  # Admin only
):
    """
    Get monthly sales data for a specific year.
    Returns sales count per month and aggregated metrics.
    """
    # Initialize sales array with 12 zeros
    monthly_sales = [0] * 12

    # Query orders grouped by month
    result = await db.execute(
        select(
            extract("month", Order.created_at).label("month"),
            func.count(Order.id).label("count"),
        )
        .where(
            and_(
                extract("year", Order.created_at) == year,
            )
        )
        .group_by(extract("month", Order.created_at))
    )

    rows = result.all()
    for row in rows:
        month_index = int(row.month) - 1  # Convert to 0-indexed
        monthly_sales[month_index] = row.count

    # Calculate total sales
    total_sales_count = sum(monthly_sales)

    # Get total revenue for the year
    result = await db.execute(
        select(func.sum(Order.total_sale_price)).where(
            and_(
                extract("year", Order.created_at) == year,
            )
        )
    )
    total_revenue = result.scalar() or Decimal("0")

    # Format total revenue
    total_revenue_formatted = f"${total_revenue:,.0f}"

    # Calculate growth vs previous year
    result = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                extract("year", Order.created_at) == year - 1,
            )
        )
    )
    previous_year_sales = result.scalar() or 0

    growth = 0.0
    if previous_year_sales > 0:
        growth = ((total_sales_count - previous_year_sales) / previous_year_sales) * 100

    growth_formatted = f"+{growth:.0f}%" if growth >= 0 else f"{growth:.0f}%"

    return YearlySalesData(
        year=year,
        sales=monthly_sales,
        total_sales=total_revenue_formatted,
        growth=growth_formatted,
    )


@router.get("/targets/{target_type}", response_model=TargetData)
async def get_target_progress(
    target_type: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),  # Admin only
):
    """
    Get target progress based on profit margin (sale_price - cost_price).
    Shows daily, monthly, or annual profit targets and achievement.
    """
    now = datetime.now()

    if target_type == "daily":
        # Daily target: today's profit
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = now

        # Previous day for comparison
        prev_start = start_date - timedelta(days=1)
        prev_end = start_date

        title = "Daily Profit Target"
        subtitle = "Today's profit margin goal"
        current_label = "Today"
        # Target: average ~$300 profit per day (based on ~3 orders with ~$100 avg profit)
        target_profit = Decimal("300")

    elif target_type == "monthly":
        # Monthly target: this month's profit
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now

        # Previous month for comparison
        if now.month == 1:
            prev_start = now.replace(year=now.year - 1, month=12, day=1, hour=0, minute=0, second=0, microsecond=0)
        else:
            prev_start = now.replace(month=now.month - 1, day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_end = start_date

        title = "Monthly Profit Target"
        subtitle = "This month's profit margin goal"
        current_label = "Today"
        # Target: ~$9K profit per month (30 days * $300/day)
        target_profit = Decimal("9000")

    elif target_type == "annual":
        # Annual target: this year's profit
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = now

        # Previous year for comparison
        prev_start = now.replace(year=now.year - 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        prev_end = start_date

        title = "Annual Profit Target"
        subtitle = "This year's profit margin goal"
        current_label = "This Month"
        # Target: ~$108K profit per year (12 months * $9K/month)
        target_profit = Decimal("108000")

    else:
        raise ValueError("Invalid target_type. Must be 'daily', 'monthly', or 'annual'")

    # Get current period profit (total_sale_price - total_cost_price)
    result = await db.execute(
        select(
            func.sum(Order.total_sale_price - Order.total_cost_price).label("profit")
        ).where(
            and_(
                Order.created_at >= start_date,
                Order.created_at <= end_date,
            )
        )
    )
    current_profit = result.scalar() or Decimal("0")

    # Get previous period profit for comparison
    result = await db.execute(
        select(
            func.sum(Order.total_sale_price - Order.total_cost_price).label("profit")
        ).where(
            and_(
                Order.created_at >= prev_start,
                Order.created_at < prev_end,
            )
        )
    )
    prev_profit = result.scalar() or Decimal("0")

    # Calculate percentage of target achieved
    percentage = float((current_profit / target_profit) * 100) if target_profit > 0 else 0.0

    # Calculate growth
    growth = 0.0
    if prev_profit > 0:
        growth = ((current_profit - prev_profit) / prev_profit) * 100

    # Get today's profit (for current field)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(
            func.sum(Order.total_sale_price - Order.total_cost_price).label("profit")
        ).where(
            and_(
                Order.created_at >= today_start,
                Order.created_at <= now,
            )
        )
    )
    today_profit = result.scalar() or Decimal("0")

    # For annual target, use this month's profit as "current"
    if target_type == "annual":
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = await db.execute(
            select(
                func.sum(Order.total_sale_price - Order.total_cost_price).label("profit")
            ).where(
                and_(
                    Order.created_at >= month_start,
                    Order.created_at <= now,
                )
            )
        )
        current_value = result.scalar() or Decimal("0")
    else:
        current_value = today_profit

    # Format values
    def format_currency(value: Decimal) -> str:
        if value >= 1000:
            return f"${value / 1000:.1f}K"
        return f"${value:.0f}"

    return TargetData(
        title=title,
        subtitle=subtitle,
        percentage=round(percentage, 2),
        percentage_change=f"+{growth:.0f}%" if growth >= 0 else f"{growth:.0f}%",
        message=f"{percentage:.1f}% of profit target achieved",
        target=format_currency(target_profit),
        profit=format_currency(current_profit),
        current=format_currency(current_value),
        current_label=current_label,
        target_direction="down" if percentage < 100 else "up",
        profit_direction="up" if growth >= 0 else "down",
        current_direction="up" if current_value > 0 else "down",
    )


@router.get("/statistics-chart/{year}", response_model=StatisticsChartData)
async def get_statistics_chart(
    year: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),  # Admin only
):
    """
    Get statistics chart data showing sales count and profit margin for each month.
    Returns data for area chart visualization with actual business metrics.
    """
    # Initialize arrays with 12 zeros
    monthly_sales = [0] * 12
    monthly_profit = [0.0] * 12

    # Query sales count and profit per month
    result = await db.execute(
        select(
            extract("month", Order.created_at).label("month"),
            func.count(Order.id).label("count"),
            func.sum(Order.total_sale_price - Order.total_cost_price).label("profit"),
        )
        .where(
            and_(
                extract("year", Order.created_at) == year,
            )
        )
        .group_by(extract("month", Order.created_at))
    )

    rows = result.all()
    for row in rows:
        month_index = int(row.month) - 1  # Convert to 0-indexed
        monthly_sales[month_index] = row.count
        # Convert profit to hundreds for better chart visualization
        profit_in_hundreds = float(row.profit or 0) / 100
        monthly_profit[month_index] = round(profit_in_hundreds, 1)

    return StatisticsChartData(
        year=year,
        sales=monthly_sales,
        profit=monthly_profit,
    )
