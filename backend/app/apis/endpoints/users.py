from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.apis.dependencies import get_current_active_user, get_current_superuser
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import User as UserSchema
from app.schemas.user import UserUpdate
from app.services import stats_service

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Get current user information."""
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_current_user(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update current user information."""
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        result = await db.execute(select(User).where(User.email == user_update.email))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = user_update.email

    # Update other fields
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    if user_update.password is not None:
        current_user.hashed_password = get_password_hash(user_update.password)

    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.get("/", response_model=list[UserSchema])
async def list_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_superuser)],
    skip: int = 0,
    limit: int = 100,
):
    """List all users (superuser only)."""
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()
    return users


@router.get("/top-sellers", response_model=list[UserSchema])
async def get_top_sellers(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
):
    """
    Get ranking of operators with most sales.

    Requires authentication.
    """
    top_sellers = await stats_service.get_top_sellers(db, limit=limit)
    return top_sellers


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_superuser)],
):
    """Get user by ID (superuser only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
