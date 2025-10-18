from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PopularTrip(Base):
    """Popular trip model for tracking most sold routes."""

    __tablename__ = "popular_trips"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    origin_location_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False
    )
    destination_location_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False
    )
    sales_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    origin_location: Mapped["Location"] = relationship(
        "Location",
        back_populates="popular_trips_as_origin",
        foreign_keys=[origin_location_id]
    )
    destination_location: Mapped["Location"] = relationship(
        "Location",
        back_populates="popular_trips_as_destination",
        foreign_keys=[destination_location_id]
    )

    # Unique constraint to avoid duplicate routes
    __table_args__ = (
        UniqueConstraint('origin_location_id', 'destination_location_id', name='unique_route'),
    )
