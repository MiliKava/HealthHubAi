"""make patient_id nullable

Revision ID: 370693235a8a
Revises: c7a832692148
Create Date: 2026-06-20 09:01:54.011213

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '370693235a8a'
down_revision: Union[str, None] = 'c7a832692148'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('triage_sessions', 'patient_id', existing_type=sa.UUID(), nullable=True)


def downgrade() -> None:
    op.alter_column('triage_sessions', 'patient_id', existing_type=sa.UUID(), nullable=False)
