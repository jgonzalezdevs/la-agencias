"""Location management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.apis.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.location import Location
from app.schemas import location as schemas
from app.services import geocoding_service

router = APIRouter()


@router.post("/", response_model=schemas.Location, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: schemas.LocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new location with automatic geocoding.

    If latitude and longitude are not provided, they will be automatically
    obtained using the Nominatim geocoding service based on city, state, and country.

    Checks for duplicates based on city, state, and country (case-insensitive).

    Requires authentication.
    """
    location_dict = location_data.model_dump()

    # Check for duplicate location (case-insensitive)
    duplicate_check = await db.execute(
        select(Location).where(
            func.lower(Location.city) == location_dict["city"].lower(),
            func.lower(Location.state) == location_dict["state"].lower(),
            func.lower(Location.country) == location_dict["country"].lower()
        )
    )
    existing_location = duplicate_check.scalar_one_or_none()

    if existing_location:
        # Return existing location instead of creating duplicate
        return existing_location

    # If coordinates not provided, try to geocode
    if location_dict.get("latitude") is None or location_dict.get("longitude") is None:
        # Try airport code first if available
        if location_dict.get("airport_code"):
            lat, lon = await geocoding_service.geocode_airport(location_dict["airport_code"])
            if lat and lon:
                location_dict["latitude"] = lat
                location_dict["longitude"] = lon

        # If still no coordinates, try city/state/country geocoding
        if location_dict.get("latitude") is None:
            lat, lon = await geocoding_service.geocode_location(
                city=location_dict["city"],
                country=location_dict["country"],
                state=location_dict.get("state")
            )
            if lat and lon:
                location_dict["latitude"] = lat
                location_dict["longitude"] = lon

    new_location = Location(**location_dict)
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


@router.patch("/{location_id}/geocode", response_model=schemas.Location)
async def geocode_existing_location(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update latitude and longitude for an existing location using geocoding.

    This endpoint is useful for adding coordinates to locations that were
    created before the geocoding feature was added.

    Requires authentication.
    """
    # Get the location
    result = await db.execute(
        select(Location).where(Location.id == location_id)
    )
    location = result.scalar_one_or_none()

    if not location:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )

    # Try to geocode using airport code first
    if location.airport_code:
        lat, lon = await geocoding_service.geocode_airport(location.airport_code)
        if lat and lon:
            location.latitude = lat
            location.longitude = lon
            await db.commit()
            await db.refresh(location)
            return location

    # Try geocoding with city/state/country
    lat, lon = await geocoding_service.geocode_location(
        city=location.city,
        country=location.country,
        state=location.state
    )

    if lat and lon:
        location.latitude = lat
        location.longitude = lon
        await db.commit()
        await db.refresh(location)
        return location

    # If geocoding failed, raise error
    from fastapi import HTTPException
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Could not geocode location: {location.city}, {location.country}"
    )


@router.post("/geocode-all", response_model=dict)
async def geocode_all_locations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Geocode all locations that don't have coordinates yet.

    This is a batch operation useful for updating existing database records.

    Requires authentication.

    Returns a summary of the geocoding operation.
    """
    # Get all locations without coordinates
    result = await db.execute(
        select(Location).where(
            (Location.latitude.is_(None)) | (Location.longitude.is_(None))
        )
    )
    locations = result.scalars().all()

    total = len(locations)
    geocoded = 0
    failed = 0
    failed_locations = []

    for location in locations:
        # Try airport code first
        if location.airport_code:
            lat, lon = await geocoding_service.geocode_airport(location.airport_code)
            if lat and lon:
                location.latitude = lat
                location.longitude = lon
                geocoded += 1
                continue

        # Try city/state/country
        lat, lon = await geocoding_service.geocode_location(
            city=location.city,
            country=location.country,
            state=location.state
        )

        if lat and lon:
            location.latitude = lat
            location.longitude = lon
            geocoded += 1
        else:
            failed += 1
            failed_locations.append(f"{location.city}, {location.country}")

    # Commit all changes
    await db.commit()

    return {
        "total_locations": total,
        "geocoded": geocoded,
        "failed": failed,
        "failed_locations": failed_locations
    }
