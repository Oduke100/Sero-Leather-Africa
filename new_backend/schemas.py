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
    name:Optional[str]
    slug:Optional[str]
    description:Optional[str]
    image_url:Optional[str]
    is_customisable:Optional[bool]
    price:Optional[Annotated[Decimal, Field(max_digits=10, decimal_places=2)]]
    discount_percentage:Optional[Annotated[Decimal, Field(max_digits=10, decimal_places=2)]]
    is_on_discount:Optional[bool]
    stock:Optional[int]
    is_active:Optional[bool]

class ProductInfo(BaseModel):
    name:str
    slug:str
    description:str
    image_url:str
    is_customisable:bool
    price:Annotated[Decimal, Field(max_digits=10, decimal_places=2)]
    discount_percentage:Optional[Annotated[Decimal, Field(max_digits=5, decimal_places=2)]]
    is_on_discount:bool
    stock:int
    is_active:bool

class AdminProductInfo(ProductInfo):
    created_at:datetime
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