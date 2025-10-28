"""Add status to services and remove status from orders

Revision ID: service_status_001
Revises: b2c3d4e5f6g7
Create Date: 2025-10-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'service_status_001'
down_revision = 'b2c3d4e5f6g7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add status column to services table
    op.add_column('services', sa.Column('status', sa.String(length=20), nullable=False, server_default='activo'))

    # Remove status column from orders table
    op.drop_column('orders', 'status')


def downgrade() -> None:
    # Add status column back to orders table
    op.add_column('orders', sa.Column('status', sa.String(length=20), nullable=False, server_default='pendiente'))

    # Remove status column from services table
    op.drop_column('services', 'status')
