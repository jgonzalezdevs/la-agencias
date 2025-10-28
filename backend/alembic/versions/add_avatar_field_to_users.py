"""add avatar field to users

Revision ID: a1b2c3d4e5f6
Revises: f570e2316173
Create Date: 2025-10-18 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f570e2316173'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add avatar column to users table
    op.add_column('users', sa.Column('avatar', sa.String(length=255), nullable=True))


def downgrade() -> None:
    # Remove avatar column from users table
    op.drop_column('users', 'avatar')
