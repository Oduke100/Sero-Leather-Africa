from sqlalchemy import Column, Integer, Text, TIMESTAMP, Boolean, Numeric, ForeignKey
from sqlalchemy.schema import FetchedValue
from sqlalchemy.sql import func
from database import Base

class Category(Base):
    __tablename__ = "category"

    id                  = Column(Integer, primary_key=True, index=True)
    name                = Column(Text, nullable=False, unique=True)
    slug                = Column(Text, nullable=False, unique=True) 
    description         = Column(Text, nullable=False, unique=True)
    image_url           = Column(Text, nullable=False, unique=True)

    created_at          = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at          = Column(TIMESTAMP, server_default=func.now(), server_onupdate=FetchedValue(), nullable=False)

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
    stock               = Column(Integer, nullable=False)
    is_active           = Column(Boolean, nullable=False, default=True)
    category_id         = Column(Integer, ForeignKey(Category.id), nullable=False)

    created_at          = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at          = Column(TIMESTAMP, server_default=func.now(), server_onupdate=FetchedValue(), nullable=False)

class Variant(Base):
    __tablename__ = "variant"

    id                  = Column(Integer, primary_key=True, index=True)
    product_id          = Column(Integer, ForeignKey(Product.id), nullable=False)
    size                = Column(Text, nullable=False)
    colour              = Column(Text, nullable=False)
    stock               = Column(Integer, nullable=False)

    created_at          = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at          = Column(TIMESTAMP, server_default=func.now(), server_onupdate=FetchedValue(), nullable=False)

class Admin(Base):
    __tablename__ = "admin"

    id                  = Column(Integer, primary_key=True, index=True)
    username            = Column(Text, nullable=False, unique=True)
    hashed_password     = Column(Text, nullable=False)
    active_token        = Column(Text, nullable=True)  # stores current session token, null when logged out

    created_at          = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at          = Column(TIMESTAMP, server_default=func.now(), server_onupdate=FetchedValue(), nullable=False)

class Order(Base):
    __tablename__ = "order"

    id                  = Column(Integer, primary_key=True, index=True)
    customer_name       = Column(Text, nullable=False)
    customer_email      = Column(Text, nullable=False)
    customer_phone      = Column(Text, nullable=False)
    delivery_address    = Column(Text, nullable=False)
    total_price         = Column(Numeric(10, 2), nullable=False)
    status              = Column(Text, nullable=False, default="pending")  # pending, confirmed, shipped, delivered, cancelled
    
    created_at          = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at          = Column(TIMESTAMP, server_default=func.now(), server_onupdate=FetchedValue(), nullable=False)

class OrderItem(Base):
    __tablename__ = "order_item"

    id                  = Column(Integer, primary_key=True, index=True)
    order_id            = Column(Integer, ForeignKey("order.id"), nullable=False)
    product_id          = Column(Integer, ForeignKey("product.id"), nullable=False)
    variant_id          = Column(Integer, ForeignKey("variant.id"), nullable=True)  # nullable since not all products have variants
    quantity            = Column(Integer, nullable=False)
    unit_price          = Column(Numeric(10, 2), nullable=False)  # price at time of order, in case product price changes later

    created_at          = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at          = Column(TIMESTAMP, server_default=func.now(), server_onupdate=FetchedValue(), nullable=False)