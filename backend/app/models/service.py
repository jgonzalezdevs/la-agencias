import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ServiceType(str, enum.Enum):
    """Service type enumeration."""
    FLIGHT = "FLIGHT"
    BUS = "BUS"
    HOTEL = "HOTEL"
    LUGGAGE = "LUGGAGE"
    OTHER = "OTHER"


class Service(Base):
    """Service model using single-table approach for different service types."""

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    service_type: Mapped[ServiceType] = mapped_column(
        Enum(ServiceType, native_enum=False), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    sale_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Calendar fields
    event_start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    event_end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    calendar_color: Mapped[str | None] = mapped_column(String(7))  # HEX color
    calendar_icon: Mapped[str | None] = mapped_column(String(50))  # Icon name

    # Fields for FLIGHT / BUS
    origin_location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("locations.id", ondelete="SET NULL")
    )
    destination_location_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("locations.id", ondelete="SET NULL")
    )
    pnr_code: Mapped[str | None] = mapped_column(String(50))
    company: Mapped[str | None] = mapped_column(String(100))
    departure_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    arrival_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Fields for HOTEL
    hotel_name: Mapped[str | None] = mapped_column(String(150))
    reservation_number: Mapped[str | None] = mapped_column(String(50))
    check_in_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    check_out_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Fields for LUGGAGE
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    associated_service_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("services.id", ondelete="SET NULL")
    )

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="services")
    origin_location: Mapped["Location"] = relationship(
        "Location",
        back_populates="services_as_origin",
        foreign_keys=[origin_location_id]
    )
    destination_location: Mapped["Location"] = relationship(
        "Location",
        back_populates="services_as_destination",
        foreign_keys=[destination_location_id]
    )
    images: Mapped[list["ServiceImage"]] = relationship(
        "ServiceImage", back_populates="service", cascade="all, delete-orphan"
    )
    # Self-referential relationship for luggage associated to a flight
    associated_service: Mapped["Service"] = relationship(
        "Service", remote_side=[id], foreign_keys=[associated_service_id]
    )
