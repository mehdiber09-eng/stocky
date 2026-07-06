"""add lots table

Revision ID: 20250617_add_lots_table
Revises: 
Create Date: 2026-06-17 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20250617_add_lots_table"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "lots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("batch_code", sa.String(length=255), nullable=True),
        sa.Column("expiry_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("quantity_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("quantity_available", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("supplier_lot_ref", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
    )

    op.create_index("ix_lots_owner_expiry", "lots", ["owner_id", "expiry_date"])
    op.create_index(op.f("ix_lots_owner_id"), "lots", ["owner_id"])
    op.create_index(op.f("ix_lots_product_id"), "lots", ["product_id"])


def downgrade():
    op.drop_index(op.f("ix_lots_product_id"), table_name="lots")
    op.drop_index(op.f("ix_lots_owner_id"), table_name="lots")
    op.drop_index("ix_lots_owner_expiry", table_name="lots")
    op.drop_table("lots")
