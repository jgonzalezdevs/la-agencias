"""add custom_ticket_number observations and attachment_urls to orders

Revision ID: add_order_custom_fields
Revises: c195a6997649
Create Date: 2025-11-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_order_custom_fields'
down_revision = 'c195a6997649'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add custom_ticket_number column
    op.add_column('orders', sa.Column('custom_ticket_number', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_orders_custom_ticket_number'), 'orders', ['custom_ticket_number'], unique=False)

    # Add observations column
    op.add_column('orders', sa.Column('observations', sa.Text(), nullable=True))

    # Add attachment_urls column (stores JSON array of URLs as text)
    op.add_column('orders', sa.Column('attachment_urls', sa.Text(), nullable=True))


def downgrade() -> None:
    # Drop columns in reverse order
    op.drop_column('orders', 'attachment_urls')
    op.drop_column('orders', 'observations')
    op.drop_index(op.f('ix_orders_custom_ticket_number'), table_name='orders')
    op.drop_column('orders', 'custom_ticket_number')
