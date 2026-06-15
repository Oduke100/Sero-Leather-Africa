from pydantic import BaseModel, Field
from datetime import datetime
from decimal import Decimal
from typing import Optional, Annotated

class CreateCategory(BaseModel):
    name:str
    slug:str
    description:str
    image_url:str

class UpdateCategory(BaseModel):
    name:Optional[str]
    slug:Optional[str]
    description:Optional[str]
    image_url:Optional[str]

class CategoryInfo(BaseModel):
    name:str
    slug:str
    description:str
    image_url:str

class AdminCategoryInfo(CategoryInfo):
    created_at:datetime
    updated_at:datetime

class CreateProduct(BaseModel):
    category_id:int
    name:str
    slug:str
    description:str
    image_url:str
    is_customisable:bool = False
    price:Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    discount_percentage:Optional[Annotated[Decimal, Field(max_digits=5, decimal_places=2)]] = None
    is_on_discount:bool = False
    stock:int
    is_active:bool = True

class UpdateProduct(BaseModel):
    category_id:Optional[int] = None
    name:Optional[str] = None
    slug:Optional[str] = None
    description:Optional[str] = None
    image_url:Optional[str] = None
    is_customisable:Optional[bool] = None
    price:Optional[Annotated[Decimal, Field(max_digits=10, decimal_places=2)]] = None
    discount_percentage:Optional[Annotated[Decimal, Field(max_digits=10, decimal_places=2)]] = None
    is_on_discount:Optional[bool] = None
    stock:Optional[int] = None
    is_active:Optional[bool] = None

class ProductInfo(BaseModel):
    name:str
    slug:str
    description:str
    image_url:str
    is_customisable:bool
    price:Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    final_price:Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    discount_percentage:Optional[Annotated[Decimal, Field(max_digits=5, decimal_places=2)]]
    is_on_discount:bool
    stock:int
    is_active:bool
    currency:str = "KES"

class AdminProductInfo(ProductInfo):
    id:           int
    initial_stock: Optional[int] = None
    created_at:   datetime
    updated_at:datetime

class CreateProductVariant(BaseModel):
    size:str
    colour:str
    stock:int

class UpdateProductVariant(BaseModel):
    size:Optional[str]
    colour:Optional[str]
    stock:Optional[int]

class ProductVariantInfo(BaseModel):
    size:str
    colour:str
    stock:int

class AdminProductVariantInfo(ProductVariantInfo):
    created_at:datetime
    updated_at:datetime

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str

# ── Order Schemas ─────────────────────────────────────────────────────────────

from pydantic import ConfigDict, computed_field

class OrderItemIn(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity:   int = Field(ge=1)                          # must be at least 1

class OrderCreate(BaseModel):
    customer_name:    str
    customer_email:   str
    customer_phone:   str                                  # Safaricom number for STK push e.g. 2547XXXXXXXX
    delivery_address: str
    payment_method:   str = "mpesa"                        # mpesa | paypal
    currency:         str = "KES"
    items:            list[OrderItemIn] = Field(min_length=1)

class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    variant_id: Optional[int]
    quantity:   int
    unit_price: Annotated[Decimal, Field(max_digits=10, decimal_places=2)]

    @computed_field
    @property
    def subtotal(self) -> Decimal:
        return self.unit_price * self.quantity

class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:                         int
    customer_name:              str
    customer_email:             str
    customer_phone:             str
    delivery_address:           str
    total_price:                Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    status:                     str
    payment_status:             str
    payment_method:             Optional[str]
    merchant_reference:         Optional[str]              # frontend stores this for polling
    currency:                   str
    created_at:                 datetime
    items:                      list[OrderItemOut] = []

class OrderStatusOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id:           int
    status:             str
    payment_status:     str
    total_price:        Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    merchant_reference: Optional[str]

# ── Currency Schemas ──────────────────────────────────────────────────────────

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
