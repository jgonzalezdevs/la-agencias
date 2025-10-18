from datetime import datetime

from pydantic import BaseModel, EmailStr


class CustomerBase(BaseModel):
    """Base customer schema with shared fields."""

    full_name: str
    document_id: str | None = None
    phone_number: str | None = None
    email: EmailStr | None = None
    notes: str | None = None


class CustomerCreate(CustomerBase):
    """Schema for creating a new customer."""

    pass


class CustomerUpdate(BaseModel):
    """Schema for updating customer information."""

    full_name: str | None = None
    document_id: str | None = None
    phone_number: str | None = None
    email: EmailStr | None = None
    notes: str | None = None


class CustomerInDB(CustomerBase):
    """Customer schema as stored in database."""

    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class Customer(CustomerInDB):
    """Customer schema for API responses."""

    pass
