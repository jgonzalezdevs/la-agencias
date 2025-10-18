from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.service import ServiceType


class ServiceImageBase(BaseModel):
    """Base service image schema."""

    image_url: str


class ServiceImageCreate(ServiceImageBase):
    """Schema for creating a service image."""

    pass


class ServiceImage(ServiceImageBase):
    """Service image schema for API responses."""

    id: int
    service_id: int

    model_config = {"from_attributes": True}


class ServiceBase(BaseModel):
    """Base service schema with shared fields."""

    service_type: ServiceType
    name: str
    description: str | None = None
    cost_price: Decimal
    sale_price: Decimal

    # Calendar fields
    event_start_date: datetime | None = None
    event_end_date: datetime | None = None
    calendar_color: str | None = None
    calendar_icon: str | None = None

    # Fields for FLIGHT / BUS
    origin_location_id: int | None = None
    destination_location_id: int | None = None
    pnr_code: str | None = None
    company: str | None = None
    departure_datetime: datetime | None = None
    arrival_datetime: datetime | None = None

    # Fields for HOTEL
    hotel_name: str | None = None
    reservation_number: str | None = None
    check_in_datetime: datetime | None = None
    check_out_datetime: datetime | None = None

    # Fields for LUGGAGE
    weight_kg: Decimal | None = None
    associated_service_id: int | None = None


class ServiceCreate(ServiceBase):
    """Schema for creating a new service."""

    order_id: int


class ServiceUpdate(BaseModel):
    """Schema for updating service information."""

    service_type: ServiceType | None = None
    name: str | None = None
    description: str | None = None
    cost_price: Decimal | None = None
    sale_price: Decimal | None = None

    # Calendar fields
    event_start_date: datetime | None = None
    event_end_date: datetime | None = None
    calendar_color: str | None = None
    calendar_icon: str | None = None

    # Fields for FLIGHT / BUS
    origin_location_id: int | None = None
    destination_location_id: int | None = None
    pnr_code: str | None = None
    company: str | None = None
    departure_datetime: datetime | None = None
    arrival_datetime: datetime | None = None

    # Fields for HOTEL
    hotel_name: str | None = None
    reservation_number: str | None = None
    check_in_datetime: datetime | None = None
    check_out_datetime: datetime | None = None

    # Fields for LUGGAGE
    weight_kg: Decimal | None = None
    associated_service_id: int | None = None


class ServiceInDB(ServiceBase):
    """Service schema as stored in database."""

    id: int
    order_id: int

    model_config = {"from_attributes": True}


class Service(ServiceInDB):
    """Service schema for API responses."""

    pass


class ServiceWithDetails(Service):
    """Service schema with nested relationships."""

    origin_location: "Location | None" = None
    destination_location: "Location | None" = None
    images: list[ServiceImage] = []
