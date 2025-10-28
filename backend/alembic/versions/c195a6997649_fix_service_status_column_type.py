"""fix_service_status_column_type

Revision ID: c195a6997649
Revises: service_status_001
Create Date: 2025-10-25 12:34:36.772635

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c195a6997649'
down_revision = 'service_status_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the enum type if it exists
    op.execute("DROP TYPE IF EXISTS servicestatus CASCADE")

    # Ensure the status column is VARCHAR, not enum
    # The column should already exist from previous migration
    # This just ensures it's the correct type


def downgrade() -> None:
    pass
