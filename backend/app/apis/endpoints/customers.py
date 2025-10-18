"""Customer CRM endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.apis.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas import customer as schemas
from app.services import customer_service

router = APIRouter()


@router.post("/", response_model=schemas.Customer, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: schemas.CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new customer.

    Requires authentication.
    """
    customer = await customer_service.create_customer(db, customer_data)
    return customer


@router.get("/search", response_model=list[schemas.Customer])
async def search_customers(
    q: str | None = Query(None, description="Search query for name, email, or document ID"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Search customers by name, email, or document_id using ILIKE.

    Requires authentication.
    """
    customers = await customer_service.search_customers(db, query=q, limit=limit)
    return customers


@router.get("/{customer_id}", response_model=schemas.Customer)
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get details of a specific customer.

    Requires authentication.
    """
    customer = await customer_service.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found"
        )
    return customer


@router.put("/{customer_id}", response_model=schemas.Customer)
async def update_customer(
    customer_id: int,
    customer_data: schemas.CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update customer information.

    Requires authentication.
    """
    customer = await customer_service.update_customer(db, customer_id, customer_data)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with id {customer_id} not found"
        )
    return customer
