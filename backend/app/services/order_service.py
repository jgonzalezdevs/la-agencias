"""Order and service management with transactional logic."""

import secrets
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.customer import Customer
from app.models.order import Order
from app.models.service import Service, ServiceType
from app.models.service_image import ServiceImage
from app.models.user import User
from app.models.popular_trip import PopularTrip
from app.schemas import order as order_schemas
from app.schemas import service as service_schemas


def generate_order_number() -> str:
    """
    Generate a unique order number.
    Format: ORD-YYYY-XXXX where XXXX is a random hex.
    """
    year = datetime.now().year
    random_hex = secrets.token_hex(2).upper()
    return f"ORD-{year}-{random_hex}"


async def recalculate_order_totals(db: AsyncSession, order: Order) -> None:
    """
    Recalculate and update order totals based on its services.

    Args:
        db: Database session
        order: Order instance to recalculate
    """
    # Get all services for this order
    result = await db.execute(
        select(Service).where(Service.order_id == order.id)
    )
    services = result.scalars().all()

    # Calculate totals
    total_cost = sum(service.cost_price for service in services)
    total_sale = sum(service.sale_price for service in services)

    # Update order
    order.total_cost_price = Decimal(str(total_cost))
    order.total_sale_price = Decimal(str(total_sale))

    await db.commit()


async def update_sales_counters(
    db: AsyncSession,
    user: User,
    service: Service
) -> None:
    """
    Update sales counters when a FLIGHT or BUS service is added.

    Args:
        db: Database session
        user: User (operator) who made the sale
        service: Service that was added
    """
    # Only update for FLIGHT and BUS services
    if service.service_type not in [ServiceType.FLIGHT, ServiceType.BUS]:
        return

    # Check if service has origin and destination
    if not service.origin_location_id or not service.destination_location_id:
        return

    # Increment user sales_count
    user.sales_count += 1

    # Update or create popular_trip
    result = await db.execute(
        select(PopularTrip).where(
            PopularTrip.origin_location_id == service.origin_location_id,
            PopularTrip.destination_location_id == service.destination_location_id
        )
    )
    popular_trip = result.scalar_one_or_none()

    if popular_trip:
        popular_trip.sales_count += 1
    else:
        popular_trip = PopularTrip(
            origin_location_id=service.origin_location_id,
            destination_location_id=service.destination_location_id,
            sales_count=1
        )
        db.add(popular_trip)

    await db.commit()


async def create_order(
    db: AsyncSession,
    order_data: order_schemas.OrderCreate,
    user: User
) -> Order:
    """
    Create a new order.

    Args:
        db: Database session
        order_data: Order creation data
        user: User (operator) creating the order

    Returns:
        Created order instance

    Raises:
        ValueError: If customer doesn't exist
    """
    # Verify customer exists
    result = await db.execute(
        select(Customer).where(Customer.id == order_data.customer_id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise ValueError(f"Customer with id {order_data.customer_id} not found")

    # Create order
    new_order = Order(
        order_number=generate_order_number(),
        # custom_ticket_number=order_data.custom_ticket_number,  # Column doesn't exist in DB yet
        user_id=user.id,
        customer_id=order_data.customer_id,
        total_cost_price=Decimal("0.00"),
        total_sale_price=Decimal("0.00"),
        # observations=order_data.observations,  # Column doesn't exist in DB yet
        # attachment_urls=order_data.attachment_urls  # Column doesn't exist in DB yet
    )

    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    return new_order


async def get_order(
    db: AsyncSession,
    order_id: int,
    with_details: bool = False
) -> Order | None:
    """
    Get an order by ID.

    Args:
        db: Database session
        order_id: Order ID
        with_details: Whether to eagerly load relationships

    Returns:
        Order instance or None if not found
    """
    stmt = select(Order).where(Order.id == order_id)

    if with_details:
        stmt = stmt.options(
            selectinload(Order.user),
            selectinload(Order.customer),
            selectinload(Order.services).selectinload(Service.images),
            selectinload(Order.services).selectinload(Service.origin_location),
            selectinload(Order.services).selectinload(Service.destination_location)
        )

    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_orders(
    db: AsyncSession,
    user_id: int | None = None,
    customer_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    phone_number: str | None = None,
    ticket_number: str | None = None,
    limit: int = 100
) -> list[Order]:
    """
    List orders with optional filters.

    Args:
        db: Database session
        user_id: Filter by user (operator)
        customer_id: Filter by customer
        start_date: Filter by start date
        end_date: Filter by end date
        phone_number: Filter by customer phone number
        ticket_number: Filter by custom ticket number
        limit: Maximum number of results

    Returns:
        List of orders
    """
    stmt = select(Order)

    if user_id:
        stmt = stmt.where(Order.user_id == user_id)
    if customer_id:
        stmt = stmt.where(Order.customer_id == customer_id)
    if start_date:
        stmt = stmt.where(Order.created_at >= start_date)
    if end_date:
        stmt = stmt.where(Order.created_at <= end_date)
    if ticket_number:
        stmt = stmt.where(Order.custom_ticket_number.ilike(f"%{ticket_number}%"))

    # Filter by phone number requires join with customer table
    if phone_number:
        stmt = stmt.join(Customer).where(Customer.phone.ilike(f"%{phone_number}%"))

    stmt = stmt.limit(limit).order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_orders_with_details(
    db: AsyncSession,
    user_id: int | None = None,
    customer_id: int | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    phone_number: str | None = None,
    ticket_number: str | None = None,
    limit: int = 100
) -> list[Order]:
    """
    List orders with complete details (services, customer, user) with optional filters.
    This eagerly loads all relationships for performance.

    Args:
        db: Database session
        user_id: Filter by user (operator)
        customer_id: Filter by customer
        start_date: Filter by service departure date (for calendar filtering)
        end_date: Filter by service departure date (for calendar filtering)
        phone_number: Filter by customer phone number
        ticket_number: Filter by custom ticket number
        limit: Maximum number of results

    Returns:
        List of orders with all nested relationships loaded
    """
    stmt = select(Order).options(
        selectinload(Order.user),
        selectinload(Order.customer),
        selectinload(Order.services).selectinload(Service.images),
        selectinload(Order.services).selectinload(Service.origin_location),
        selectinload(Order.services).selectinload(Service.destination_location)
    )

    if user_id:
        stmt = stmt.where(Order.user_id == user_id)
    if customer_id:
        stmt = stmt.where(Order.customer_id == customer_id)

    # Filter by service departure dates (for calendar filtering)
    # Join with Service table to filter by departure_datetime
    if start_date or end_date:
        stmt = stmt.join(Service)
        if start_date:
            stmt = stmt.where(Service.departure_datetime >= start_date)
        if end_date:
            # Add one day to end_date to include the entire day
            end_date_inclusive = end_date + timedelta(days=1)
            stmt = stmt.where(Service.departure_datetime < end_date_inclusive)
        # Make sure to get distinct orders (in case an order has multiple services)
        stmt = stmt.distinct()

    if ticket_number:
        # Skip ticket_number filter if column doesn't exist in database
        # stmt = stmt.where(Order.custom_ticket_number.ilike(f"%{ticket_number}%"))
        pass

    # Filter by phone number requires join with customer table
    if phone_number:
        if not (start_date or end_date):
            # Only join if we haven't already joined for date filtering
            stmt = stmt.join(Customer)
        else:
            # If we already have joins from date filtering, use outerjoin
            stmt = stmt.outerjoin(Customer)
        stmt = stmt.where(Customer.phone_number.ilike(f"%{phone_number}%"))

    stmt = stmt.limit(limit).order_by(Order.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_order(
    db: AsyncSession,
    order_id: int,
    order_data: order_schemas.OrderUpdate
) -> Order | None:
    """
    Update an order.

    Args:
        db: Database session
        order_id: Order ID
        order_data: Update data

    Returns:
        Updated order instance or None if not found
    """
    order = await get_order(db, order_id)
    if not order:
        return None

    update_data = order_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)

    await db.commit()
    await db.refresh(order)
    return order


async def add_service_to_order(
    db: AsyncSession,
    service_data: service_schemas.ServiceCreate,
    user: User
) -> Service:
    """
    Add a service to an order with transactional logic.

    This function:
    1. Creates the service
    2. Recalculates order totals
    3. Updates sales counters if applicable

    Args:
        db: Database session
        service_data: Service creation data
        user: User (operator) adding the service

    Returns:
        Created service instance

    Raises:
        ValueError: If order doesn't exist
    """
    # Verify order exists
    order = await get_order(db, service_data.order_id)
    if not order:
        raise ValueError(f"Order with id {service_data.order_id} not found")

    try:
        # Create service
        new_service = Service(**service_data.model_dump())
        db.add(new_service)
        await db.flush()  # Get the service ID

        # Recalculate order totals
        await recalculate_order_totals(db, order)

        # Update sales counters
        await update_sales_counters(db, user, new_service)

        # Refresh to get updated relationships
        await db.refresh(new_service)
        return new_service

    except Exception as e:
        await db.rollback()
        raise e


async def update_service(
    db: AsyncSession,
    service_id: int,
    service_data: service_schemas.ServiceUpdate,
    user: User
) -> Service | None:
    """
    Update a service and recalculate order totals.

    Args:
        db: Database session
        service_id: Service ID
        service_data: Update data
        user: User performing the update

    Returns:
        Updated service instance or None if not found
    """
    result = await db.execute(
        select(Service).where(Service.id == service_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        return None

    order = await get_order(db, service.order_id)
    if not order:
        return None

    try:
        # Update service
        update_data = service_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(service, field, value)

        # Recalculate order totals
        await recalculate_order_totals(db, order)

        await db.refresh(service)
        return service

    except Exception as e:
        await db.rollback()
        raise e


async def delete_service(
    db: AsyncSession,
    service_id: int
) -> bool:
    """
    Delete a service and recalculate order totals.

    Args:
        db: Database session
        service_id: Service ID

    Returns:
        True if deleted, False if not found
    """
    result = await db.execute(
        select(Service).where(Service.id == service_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        return False

    order = await get_order(db, service.order_id)
    if not order:
        return False

    try:
        # Delete service (cascade will delete images)
        await db.delete(service)

        # Recalculate order totals
        await recalculate_order_totals(db, order)

        return True

    except Exception as e:
        await db.rollback()
        raise e


async def add_service_images(
    db: AsyncSession,
    service_id: int,
    image_urls: list[str]
) -> list[ServiceImage]:
    """
    Add images to a service.

    Args:
        db: Database session
        service_id: Service ID
        image_urls: List of image URLs to add

    Returns:
        List of created ServiceImage instances

    Raises:
        ValueError: If service doesn't exist or URLs are invalid
    """
    # Verify service exists
    result = await db.execute(
        select(Service).where(Service.id == service_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise ValueError(f"Service with id {service_id} not found")

    # Validate and filter URLs
    valid_urls = []
    for url in image_urls:
        # Check if URL is not empty and has a proper filename
        if not url or url.strip() == '':
            continue
        # Extract filename from URL
        url_parts = url.split('/')
        filename = url_parts[-1] if url_parts else ''
        # Skip URLs without valid filename (empty or just "upload")
        if not filename or filename == 'upload':
            continue
        valid_urls.append(url)

    if not valid_urls:
        raise ValueError("No valid image URLs provided")

    # Create images
    images = [
        ServiceImage(service_id=service_id, image_url=url)
        for url in valid_urls
    ]

    db.add_all(images)
    await db.commit()

    for image in images:
        await db.refresh(image)

    return images


async def delete_order(
    db: AsyncSession,
    order_id: int
) -> bool:
    """
    Delete an order and all associated services and images.

    Args:
        db: Database session
        order_id: Order ID to delete

    Returns:
        True if deleted, False if not found
    """
    # Get order
    order = await get_order(db, order_id)
    if not order:
        return False

    try:
        # Delete order (cascade will delete all services and their images)
        await db.delete(order)
        await db.commit()
        return True

    except Exception as e:
        await db.rollback()
        raise e
