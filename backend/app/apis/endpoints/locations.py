"""Location management endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.apis.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.location import Location
from app.schemas import location as schemas

router = APIRouter()


@router.post("/", response_model=schemas.Location, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: schemas.LocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new location.

    Requires authentication.
    """
    new_location = Location(**location_data.model_dump())
    db.add(new_location)
    await db.commit()
    await db.refresh(new_location)
    return new_location


@router.get("/", response_model=list[schemas.Location])
async def list_locations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all locations for frontend selectors.

    Requires authentication.
    """
    result = await db.execute(
        select(Location).order_by(Location.country, Location.city)
    )
    locations = result.scalars().all()
    return list(locations)
