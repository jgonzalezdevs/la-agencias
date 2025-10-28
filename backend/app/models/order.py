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
    text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Order(Base):
    """Order model for purchase orders. All orders are considered paid."""

    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    total_cost_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total_sale_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    # total_profit is calculated in application logic (not as a generated column for SQLAlchemy compatibility)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="orders")
    customer: Mapped["Customer"] = relationship("Customer", back_populates="orders")
    services: Mapped[list["Service"]] = relationship(
        "Service", back_populates="order", cascade="all, delete-orphan"
    )

    @property
    def total_profit(self) -> Decimal:
        """Calculate profit as sale_price - cost_price."""
        return self.total_sale_price - self.total_cost_price
