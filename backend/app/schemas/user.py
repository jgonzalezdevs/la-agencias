from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema with shared fields."""

    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str


class UserUpdate(BaseModel):
    """Schema for updating user information."""

    email: EmailStr | None = None
    full_name: str | None = None
    password: str | None = None
    role: str | None = None
    is_active: bool | None = None


class UserInDB(UserBase):
    """User schema as stored in database."""

    id: int
    role: str
    sales_count: int
    is_active: bool
    is_superuser: bool
    avatar: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class User(UserInDB):
    """User schema for API responses."""

    pass
