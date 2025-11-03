"""merge migration heads

Revision ID: 827463fbc5e8
Revises: 26c6d5e5a40c, add_order_custom_fields
Create Date: 2025-11-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '827463fbc5e8'
down_revision = ('26c6d5e5a40c', 'add_order_custom_fields')
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This is a merge migration - no schema changes needed
    pass


def downgrade() -> None:
    # This is a merge migration - no schema changes needed
    pass
