# app/models.py
# ─────────────────────────────────────────────
#  Pydantic models / request-body schemas.
# ─────────────────────────────────────────────

from pydantic import BaseModel
from typing  import List, Optional


class Products(BaseModel):
    product_name:         str
    product_description:  Optional[str]  = None
    product_price:        float
    product_picture_url:  Optional[str]  = None
    product_quantity:     int
    product_is_available: bool           = True


class OrderItem(BaseModel):
    id:       int
    name:     str
    price:    float
    quantity: int


class Order(BaseModel):
    customer_name:    str
    phone:            str
    delivery_address: str
    items:            List[OrderItem]
    total_price:      float


class OrderStatusUpdate(BaseModel):
    status: str

class Order(BaseModel):
    customer_name:    str
    phone:            str
    delivery_address: str
    items:            List[OrderItem]
    total_price:      float
    payment_method:   str = "mpesa"  # default to mpesa