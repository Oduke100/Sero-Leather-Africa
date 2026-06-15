from sqlalchemy import Column, Integer, Text, TIMESTAMP, Boolean, Numeric, ForeignKey
from sqlalchemy.schema import FetchedValue
from sqlalchemy.sql import func
from database import Base

# ── timestamps mixin ──────────────────────────────────────────────────────────
_ts = lambda: {"server_default": func.now(), "nullable": False}
_ts_update = lambda: {**_ts(), "server_onupdate": FetchedValue()}

# ── catalogue ─────────────────────────────────────────────────────────────────
class Category(Base):
    __tablename__ = "category"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(Text, nullable=False, unique=True)
    slug        = Column(Text, nullable=False, unique=True)
    description = Column(Text, nullable=False, unique=True)
    image_url   = Column(Text, nullable=False, unique=True)
    created_at  = Column(TIMESTAMP, **_ts())
    updated_at  = Column(TIMESTAMP, **_ts_update())

class Product(Base):
    __tablename__ = "product"
    id                  = Column(Integer, primary_key=True, index=True)
    name                = Column(Text, nullable=False, unique=True)
    slug                = Column(Text, nullable=False, unique=True)
    description         = Column(Text, nullable=False, unique=True)
    image_url           = Column(Text, nullable=False, unique=True)
    is_customisable     = Column(Boolean, nullable=False, default=False)
    price               = Column(Numeric(10, 2), nullable=False)
    is_on_discount      = Column(Boolean, nullable=False, default=False)
    discount_percentage = Column(Numeric, nullable=True)
    initial_stock       = Column(Integer, nullable=True)
    stock               = Column(Integer, nullable=False)
    is_active           = Column(Boolean, nullable=False, default=True)
    category_id         = Column(Integer, ForeignKey(Category.id), nullable=False)
    created_at          = Column(TIMESTAMP, **_ts())
    updated_at          = Column(TIMESTAMP, **_ts_update())

class Variant(Base):
    __tablename__ = "variant"
    id            = Column(Integer, primary_key=True, index=True)
    product_id    = Column(Integer, ForeignKey(Product.id), nullable=False)
    size          = Column(Text, nullable=False)
    colour        = Column(Text, nullable=False)
    initial_stock = Column(Integer, nullable=True)
    stock         = Column(Integer, nullable=False)
    created_at    = Column(TIMESTAMP, **_ts())
    updated_at    = Column(TIMESTAMP, **_ts_update())

# ── admin ─────────────────────────────────────────────────────────────────────
class Admin(Base):
    __tablename__ = "admin"
    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(Text, nullable=False, unique=True)
    hashed_password = Column(Text, nullable=False)
    active_token    = Column(Text, nullable=True)
    created_at      = Column(TIMESTAMP, **_ts())
    updated_at      = Column(TIMESTAMP, **_ts_update())

# ── orders ────────────────────────────────────────────────────────────────────
class Order(Base):
    __tablename__ = "order"
    id                        = Column(Integer, primary_key=True, index=True)
    customer_name             = Column(Text, nullable=False)
    customer_email            = Column(Text, nullable=False)
    customer_phone            = Column(Text, nullable=False)
    delivery_address          = Column(Text, nullable=False)
    total_price               = Column(Numeric(10, 2), nullable=False)
    status                    = Column(Text, nullable=False, default="pending")   # pending | confirmed | shipped | delivered | cancelled
    payment_method            = Column(Text, nullable=True)                       # mpesa | paypal | pesapal
    payment_status            = Column(Text, nullable=False, default="unpaid")    # unpaid | paid | failed | refunded
    merchant_reference        = Column(Text, unique=True, nullable=True)          # UUID sent to provider; matched on webhook
    mpesa_checkout_request_id = Column(Text, nullable=True)
    paypal_order_id           = Column(Text, nullable=True)
    currency                  = Column(Text, nullable=False, default="KES")
    created_at                = Column(TIMESTAMP, **_ts())
    updated_at                = Column(TIMESTAMP, **_ts_update())

class OrderItem(Base):
    __tablename__ = "order_item"
    id         = Column(Integer, primary_key=True, index=True)
    order_id   = Column(Integer, ForeignKey("order.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("product.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("variant.id"), nullable=True)
    quantity   = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)  # snapshot at order time
    created_at = Column(TIMESTAMP, **_ts())
    updated_at = Column(TIMESTAMP, **_ts_update())

# ── payments ──────────────────────────────────────────────────────────────────
class PaymentLog(Base):
    __tablename__ = "payment_log"
    id                 = Column(Integer, primary_key=True, index=True)
    order_id           = Column(Integer, ForeignKey("order.id"), nullable=False)
    provider           = Column(Text, nullable=False)   # mpesa | paypal
    event_type         = Column(Text, nullable=False)   # initiate | callback | success | failure
    raw_payload        = Column(Text, nullable=True)    # full provider JSON — audit trail
    provider_reference = Column(Text, nullable=True)    # MpesaReceiptNumber | PayPal capture ID
    created_at         = Column(TIMESTAMP, **_ts())

# ── currency ──────────────────────────────────────────────────────────────────
class Currency(Base):
    __tablename__ = "currency"
    id           = Column(Integer, primary_key=True, index=True)
    code         = Column(Text, nullable=False, unique=True)
    name         = Column(Text, nullable=False)
    rate_to_kes  = Column(Numeric(20, 6), nullable=False, default=1)
    is_active    = Column(Boolean, nullable=False, default=True)
    last_updated = Column(TIMESTAMP, nullable=True)
    created_at   = Column(TIMESTAMP, **_ts())