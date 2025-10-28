from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class OrderBase(BaseModel):
    """Base order schema with shared fields."""

    customer_id: int


class OrderCreate(OrderBase):
    """Schema for creating a new order."""

    pass


class OrderUpdate(BaseModel):
    """Schema for updating order information."""

    pass  # Orders are immutable after creation (services handle status)


class OrderInDB(OrderBase):
    """Order schema as stored in database."""

    id: int
    order_number: str
    user_id: int | None
    total_cost_price: Decimal
    total_sale_price: Decimal
    total_profit: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class Order(OrderInDB):
    """Order schema for API responses."""

    pass


class OrderWithDetails(Order):
    """Order schema with nested relationships."""

    user: "User | None" = None
    customer: "Customer"
    services: list["ServiceWithDetails"] = []
