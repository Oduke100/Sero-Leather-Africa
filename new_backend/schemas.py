from pydantic import BaseModel, Field, ConfigDict, computed_field
from datetime import datetime
from decimal import Decimal
from typing import Optional, Annotated
from enum import Enum
from pydantic import field_validator

Dec2 = Annotated[Decimal, Field(max_digits=10, decimal_places=2)]

# ── category ──────────────────────────────────────────────────────────────────
class CreateCategory(BaseModel):
    name: str
    slug: str
    description: str
    image_url: str

class UpdateCategory(BaseModel):
    name:        Optional[str] = None
    slug:        Optional[str] = None
    description: Optional[str] = None
    image_url:   Optional[str] = None

class CategoryInfo(BaseModel):
    name: str
    slug: str
    description: str
    image_url: str

class AdminCategoryInfo(CategoryInfo):
    created_at: datetime
    updated_at: datetime

# ── product ───────────────────────────────────────────────────────────────────
class CreateProduct(BaseModel):
    category_id:         int
    name:                str
    slug:                str
    description:         str
    image_url:           str
    is_customisable:     bool = False
    price:               Dec2
    discount_percentage: Optional[Dec2] = None
    is_on_discount:      bool = False
    stock:               int
    is_active:           bool = True

    @field_validator("slug", mode="before")
    @classmethod
    def lowercase_slug(cls, v):
        return v.lower() if v else v

class UpdateProduct(BaseModel):
    category_id:         Optional[int]    = None
    name:                Optional[str]    = None
    slug:                Optional[str]    = None
    description:         Optional[str]    = None
    image_url:           Optional[str]    = None
    is_customisable:     Optional[bool]   = None
    price:               Optional[Dec2] = None
    discount_percentage: Optional[Dec2] = None
    is_on_discount:      Optional[bool]   = None
    stock:               Optional[int]    = None
    is_active:           Optional[bool]   = None

class ProductInfo(BaseModel):
    id:                  int
    name:                str
    slug:                str
    description:         str
    image_url:           str
    is_customisable:     bool
    price:               Dec2
    final_price:         Dec2
    discount_percentage: Optional[Dec2]
    is_on_discount:      bool
    stock:               int
    is_active:           bool
    currency:            str = "KES"

class AdminProductInfo(ProductInfo):
    initial_stock: Optional[int] = None
    created_at:    datetime
    updated_at:    datetime

# ── variant ───────────────────────────────────────────────────────────────────
class CreateProductVariant(BaseModel):
    size:   str
    colour: str
    stock:  int

class UpdateProductVariant(BaseModel):
    size:   Optional[str] = None
    colour: Optional[str] = None
    stock:  Optional[int] = None

class ProductVariantInfo(BaseModel):
    size:   str
    colour: str
    stock:  int

class AdminProductVariantInfo(ProductVariantInfo):
    created_at: datetime
    updated_at: datetime

# ── admin ─────────────────────────────────────────────────────────────────────
class AdminLogin(BaseModel):
    username: str
    password: str

class AdminTokenResponse(BaseModel):
    access_token: str
    token_type:   str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

# ── orders ────────────────────────────────────────────────────────────────────
class OrderItemIn(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity:   int = Field(ge=1)

class OrderCreate(BaseModel):
    customer_name:    str = Field(max_length=100)
    customer_email:   str = Field(max_length=255)
    customer_phone:   str = Field(max_length=20)
    delivery_address: str = Field(max_length=500)
    payment_method:   str = "mpesa"
    currency:         str = "KES"
    items:            list[OrderItemIn] = Field(min_length=1)

class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: int
    variant_id: Optional[int]
    quantity:   int
    unit_price: Dec2

    @computed_field
    @property
    def subtotal(self) -> Decimal:
        return self.unit_price * self.quantity

class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id:                 int
    customer_name:      str
    customer_email:     str
    customer_phone:     str
    delivery_address:   str
    total_price:        Dec2
    status:             str
    payment_status:     str
    payment_method:     Optional[str]
    merchant_reference: Optional[str]
    currency:           str
    created_at:         datetime
    items:              list[OrderItemOut] = []

class OrderStatusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    order_id:           int
    status:             str
    payment_status:     str
    total_price:        Dec2
    merchant_reference: Optional[str]

class OrderStatusEnum(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"

class OrderStatusUpdate(BaseModel):
    status: OrderStatusEnum

# ── currency ──────────────────────────────────────────────────────────────────
class CreateCurrency(BaseModel):
    code: str
    name: str

class CurrencyInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    code:         str
    name:         str
    rate_to_kes:  Decimal
    is_active:    bool
    last_updated: Optional[datetime]