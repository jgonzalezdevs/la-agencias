"""add latitude and longitude to locations

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2025-10-18 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add latitude and longitude columns to locations table
    op.add_column('locations', sa.Column('latitude', sa.Numeric(precision=10, scale=7), nullable=True))
    op.add_column('locations', sa.Column('longitude', sa.Numeric(precision=10, scale=7), nullable=True))


def downgrade() -> None:
    # Remove latitude and longitude columns from locations table
    op.drop_column('locations', 'longitude')
    op.drop_column('locations', 'latitude')
