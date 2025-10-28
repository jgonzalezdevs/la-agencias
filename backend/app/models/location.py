from sqlalchemy import String, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal

from app.db.base import Base


class Location(Base):
    """Location model for origins and destinations."""

    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str | None] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    airport_code: Mapped[str | None] = mapped_column(String(10))
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))

    # Relationships for services (origin and destination)
    services_as_origin: Mapped[list["Service"]] = relationship(
        "Service",
        back_populates="origin_location",
        foreign_keys="Service.origin_location_id"
    )
    services_as_destination: Mapped[list["Service"]] = relationship(
        "Service",
        back_populates="destination_location",
        foreign_keys="Service.destination_location_id"
    )

    # Relationships for popular trips
    popular_trips_as_origin: Mapped[list["PopularTrip"]] = relationship(
        "PopularTrip",
        back_populates="origin_location",
        foreign_keys="PopularTrip.origin_location_id"
    )
    popular_trips_as_destination: Mapped[list["PopularTrip"]] = relationship(
        "PopularTrip",
        back_populates="destination_location",
        foreign_keys="PopularTrip.destination_location_id"
    )
