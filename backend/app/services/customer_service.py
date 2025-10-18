"""Customer service for CRM functionality."""

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.schemas import customer as schemas


async def create_customer(
    db: AsyncSession,
    customer_data: schemas.CustomerCreate
) -> Customer:
    """
    Create a new customer.

    Args:
        db: Database session
        customer_data: Customer creation data

    Returns:
        Created customer instance
    """
    new_customer = Customer(**customer_data.model_dump())
    db.add(new_customer)
    await db.commit()
    await db.refresh(new_customer)
    return new_customer


async def get_customer(db: AsyncSession, customer_id: int) -> Customer | None:
    """
    Get a customer by ID.

    Args:
        db: Database session
        customer_id: Customer ID

    Returns:
        Customer instance or None if not found
    """
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id)
    )
    return result.scalar_one_or_none()


async def search_customers(
    db: AsyncSession,
    query: str | None = None,
    limit: int = 50
) -> list[Customer]:
    """
    Search customers by name, email, or document_id using ILIKE.

    Args:
        db: Database session
        query: Search query string
        limit: Maximum number of results

    Returns:
        List of matching customers
    """
    stmt = select(Customer)

    if query:
        search_pattern = f"%{query}%"
        stmt = stmt.where(
            or_(
                Customer.full_name.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
                Customer.document_id.ilike(search_pattern)
            )
        )

    stmt = stmt.limit(limit).order_by(Customer.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_customer(
    db: AsyncSession,
    customer_id: int,
    customer_data: schemas.CustomerUpdate
) -> Customer | None:
    """
    Update customer information.

    Args:
        db: Database session
        customer_id: Customer ID
        customer_data: Update data

    Returns:
        Updated customer instance or None if not found
    """
    customer = await get_customer(db, customer_id)
    if not customer:
        return None

    update_data = customer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    await db.commit()
    await db.refresh(customer)
    return customer
