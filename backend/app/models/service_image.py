from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ServiceImage(Base):
    """Service image model for many-to-many relationship between services and images."""

    __tablename__ = "service_images"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    service_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True
    )
    image_url: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    service: Mapped["Service"] = relationship("Service", back_populates="images")
