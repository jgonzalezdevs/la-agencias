import os
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
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

# Directory for storing avatars
AVATAR_DIR = Path("uploads/avatars")
AVATAR_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Get current user information."""
    return current_user


@router.put("/me", response_model=UserSchema)
async def update_current_user(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    email: str = Form(None),
    full_name: str = Form(None),
    avatar: UploadFile = File(None),
):
    """Update current user information with optional avatar upload. Password cannot be changed through this endpoint."""
    # Check if email is being changed and if it's already taken
    if email and email != current_user.email:
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = email

    # Update other fields
    if full_name is not None:
        current_user.full_name = full_name

    # Handle avatar upload
    if avatar and avatar.filename:
        # Validate file type
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif"}
        file_ext = os.path.splitext(avatar.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only JPG, PNG, and GIF are allowed."
            )

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = AVATAR_DIR / unique_filename

        # Save file
        try:
            with open(file_path, "wb") as f:
                content = await avatar.read()
                f.write(content)

            # Delete old avatar file if exists
            if current_user.avatar:
                # Extract filename from URL path (e.g., /uploads/avatars/xyz.jpg -> xyz.jpg)
                old_filename = current_user.avatar.split("/")[-1]
                old_avatar_path = AVATAR_DIR / old_filename
                if old_avatar_path.exists():
                    old_avatar_path.unlink()

            # Save URL path (not file system path)
            current_user.avatar = f"/uploads/avatars/{unique_filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving avatar: {str(e)}")

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
    _: Annotated[User, Depends(get_current_superuser)],
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
):
    """
    Get ranking of operators with most sales.

    Requires admin permissions.
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


@router.post("/", response_model=UserSchema)
async def create_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_superuser)],
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    role: str = Form("operator"),
):
    """Create a new user (superuser only)."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    hashed_password = get_password_hash(password)
    new_user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
        role=role,
        is_active=True,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_superuser)],
    user_update: UserUpdate,
):
    """Update user information (superuser only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != user.email:
        result = await db.execute(select(User).where(User.email == user_update.email))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = user_update.email

    # Update other fields
    if user_update.full_name is not None:
        user.full_name = user_update.full_name

    if user_update.role is not None:
        user.role = user_update.role

    if user_update.is_active is not None:
        user.is_active = user_update.is_active

    if user_update.password:
        user.hashed_password = get_password_hash(user_update.password)

    await db.commit()
    await db.refresh(user)

    return user


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_superuser)],
):
    """Delete a user (superuser only)."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()

    return {"message": "User deleted successfully"}
