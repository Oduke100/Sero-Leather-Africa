"""create order, order_item, payment_log tables

Revision ID: b7f3c9d2a841
Revises: 93803e4d7376
Create Date: 2026-06-15

"""
from alembic import op
import sqlalchemy as sa

revision = 'b7f3c9d2a841'
down_revision = '93803e4d7376'
branch_labels = None
depends_on = None


def upgrade() -> None:

    op.create_table(
        'order',
        sa.Column('id',                         sa.Integer(),       nullable=False),
        sa.Column('customer_name',              sa.Text(),          nullable=False),
        sa.Column('customer_email',             sa.Text(),          nullable=False),
        sa.Column('customer_phone',             sa.Text(),          nullable=False),
        sa.Column('delivery_address',           sa.Text(),          nullable=False),
        sa.Column('total_price',                sa.Numeric(10, 2),  nullable=False),
        sa.Column('status',                     sa.Text(),          nullable=False, server_default='pending'),
        sa.Column('payment_method',             sa.Text(),          nullable=True),
        sa.Column('payment_status',             sa.Text(),          nullable=False, server_default='unpaid'),
        sa.Column('merchant_reference',         sa.Text(),          nullable=True,  unique=True),
        sa.Column('mpesa_checkout_request_id',  sa.Text(),          nullable=True),
        sa.Column('currency',                   sa.Text(),          nullable=False, server_default='KES'),
        sa.Column('created_at',                 sa.TIMESTAMP(),     nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at',                 sa.TIMESTAMP(),     nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_id'), 'order', ['id'], unique=False)

    op.create_table(
        'order_item',
        sa.Column('id',          sa.Integer(),       nullable=False),
        sa.Column('order_id',    sa.Integer(),       nullable=False),
        sa.Column('product_id',  sa.Integer(),       nullable=False),
        sa.Column('variant_id',  sa.Integer(),       nullable=True),
        sa.Column('quantity',    sa.Integer(),       nullable=False),
        sa.Column('unit_price',  sa.Numeric(10, 2),  nullable=False),
        sa.Column('created_at',  sa.TIMESTAMP(),     nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at',  sa.TIMESTAMP(),     nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['order_id'],   ['order.id']),
        sa.ForeignKeyConstraint(['product_id'], ['product.id']),
        sa.ForeignKeyConstraint(['variant_id'], ['variant.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_order_item_id'), 'order_item', ['id'], unique=False)

    op.create_table(
        'payment_log',
        sa.Column('id',                 sa.Integer(),   nullable=False),
        sa.Column('order_id',           sa.Integer(),   nullable=False),
        sa.Column('provider',           sa.Text(),      nullable=False),
        sa.Column('event_type',         sa.Text(),      nullable=False),
        sa.Column('raw_payload',        sa.Text(),      nullable=True),
        sa.Column('provider_reference', sa.Text(),      nullable=True),
        sa.Column('created_at',         sa.TIMESTAMP(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['order_id'], ['order.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payment_log_id'), 'payment_log', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_payment_log_id'), table_name='payment_log')
    op.drop_table('payment_log')
    op.drop_index(op.f('ix_order_item_id'), table_name='order_item')
    op.drop_table('order_item')
    op.drop_index(op.f('ix_order_id'), table_name='order')
    op.drop_table('order')
