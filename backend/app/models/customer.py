from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Customer(Base):
    """Customer model for CRM functionality."""

    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    document_id: Mapped[str | None] = mapped_column(String(50), unique=True, index=True)
    phone_number: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    orders: Mapped[list["Order"]] = relationship(
        "Order", back_populates="customer"
    )
