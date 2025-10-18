"""Order and service management endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.apis.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.order import OrderStatus
from app.schemas import order as order_schemas
from app.schemas import service as service_schemas
from app.services import order_service

router = APIRouter()


# ===== ORDER ENDPOINTS =====

@router.post("/", response_model=order_schemas.Order, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: order_schemas.OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new order associated with the current operator and a customer.

    Requires authentication.
    """
    try:
        order = await order_service.create_order(db, order_data, current_user)
        return order
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=list[order_schemas.Order])
async def list_orders(
    user_id: int | None = Query(None, description="Filter by operator ID"),
    customer_id: int | None = Query(None, description="Filter by customer ID"),
    order_status: OrderStatus | None = Query(None, description="Filter by order status"),
    start_date: datetime | None = Query(None, description="Filter by start date"),
    end_date: datetime | None = Query(None, description="Filter by end date"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List orders with optional filters.

    Requires authentication.
    """
    orders = await order_service.list_orders(
        db,
        user_id=user_id,
        customer_id=customer_id,
        status=order_status,
        start_date=start_date,
        end_date=end_date,
        limit=limit
    )
    return orders


@router.get("/{order_id}", response_model=order_schemas.OrderWithDetails)
async def get_order_details(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get complete details of an order with all services and images (using JOINs).

    Requires authentication.
    """
    order = await order_service.get_order(db, order_id, with_details=True)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found"
        )
    return order


@router.put("/{order_id}", response_model=order_schemas.Order)
async def update_order(
    order_id: int,
    order_data: order_schemas.OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an order (mainly for changing status).

    Requires authentication.
    """
    order = await order_service.update_order(db, order_id, order_data)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found"
        )
    return order


# ===== SERVICE ENDPOINTS =====

@router.post("/{order_id}/services", response_model=service_schemas.Service, status_code=status.HTTP_201_CREATED)
async def add_service_to_order(
    order_id: int,
    service_data: service_schemas.ServiceBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a new service to an order.

    This endpoint will:
    - Create the service
    - Recalculate order totals
    - Update sales counters if applicable (FLIGHT/BUS)

    Requires authentication.
    """
    # Create ServiceCreate with order_id
    service_create = service_schemas.ServiceCreate(
        order_id=order_id,
        **service_data.model_dump()
    )

    try:
        service = await order_service.add_service_to_order(db, service_create, current_user)
        return service
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/services/{service_id}", response_model=service_schemas.Service)
async def update_service(
    service_id: int,
    service_data: service_schemas.ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a specific service.

    This will recalculate the parent order's totals.

    Requires authentication.
    """
    try:
        service = await order_service.update_service(db, service_id, service_data, current_user)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service with id {service_id} not found"
            )
        return service
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    service_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a service from an order.

    This will recalculate the parent order's totals.

    Requires authentication.
    """
    try:
        deleted = await order_service.delete_service(db, service_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service with id {service_id} not found"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/services/{service_id}/images", response_model=list[service_schemas.ServiceImage], status_code=status.HTTP_201_CREATED)
async def add_service_images(
    service_id: int,
    image_urls: list[str],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload and associate one or multiple images to a service.

    Requires authentication.
    """
    try:
        images = await order_service.add_service_images(db, service_id, image_urls)
        return images
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
