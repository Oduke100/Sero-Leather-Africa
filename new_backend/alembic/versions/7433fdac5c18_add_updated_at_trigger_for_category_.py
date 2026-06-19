"""add updated_at trigger for category, product, variant, admin, order, order_item

Revision ID: 7433fdac5c18
Revises: e73f5afc1925
Create Date: 2026-06-19 23:51:52.825467

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7433fdac5c18'
down_revision: Union[str, Sequence[str], None] = 'e73f5afc1925'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = ["category", "product", "variant", "admin", '"order"', "order_item"]


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    for table in TABLES:
        trigger_name = "trg_" + table.strip('"') + "_updated_at"
        op.execute(f"""
            CREATE TRIGGER {trigger_name}
            BEFORE UPDATE ON {table}
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at();
        """)


def downgrade() -> None:
    """Downgrade schema."""
    for table in TABLES:
        trigger_name = "trg_" + table.strip('"') + "_updated_at"
        op.execute(f'DROP TRIGGER IF EXISTS {trigger_name} ON {table};')
    op.execute("DROP FUNCTION IF EXISTS set_updated_at();")
