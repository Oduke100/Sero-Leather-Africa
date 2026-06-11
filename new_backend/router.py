from auth import create_token, verify_password, hash_password, get_current_admin
from schemas import AdminLogin, AdminTokenResponse
from models import Admin
from fastapi import APIRouter, Depends, HTTPException
from dependancies import get_db
from sqlalchemy.orm import Session
from schemas import (
    CreateCategory, UpdateCategory,
    CreateProduct, UpdateProduct,
    CreateProductVariant, UpdateProductVariant,
)
from models import (
    Category, Product, Variant, Admin,
)

router = APIRouter()

@router.get("/")
def root():
    return {"Message":"The BE is livee!!!"}

@router.post("/admin/login", response_model=AdminTokenResponse)
def admin_login(credentials: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == credentials.username).first()
    if not admin or not verify_password(credentials.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = create_token({"sub": admin.username})
    admin.active_token = token  # invalidates any previous session
    db.commit()

    return {"access_token": token, "token_type": "bearer"}

@router.post("/new-category")
def create_new_category(cat: CreateCategory, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Category).filter(Category.name == cat.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already in the shop!")
    
    new_cat = Category(
        name        =cat.name,
        slug        =cat.slug,
        description =cat.description,
        image_url   =cat.image_url
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.post("/new-product")
def create_new_product(prod: CreateProduct, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Product).filter(Product.name == prod.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product already in store!")
    
    new_prod = Product(
        name                =prod.name,
        slug                =prod.slug,
        description         =prod.description,
        image_url           =prod.image_url,
        is_customisable     =prod.is_customisable,
        price               =prod.price,
        discount_percentage =prod.discount_percentage,
        is_on_discount      =prod.is_on_discount,
        stock               =prod.stock,
        is_active           =prod.is_active
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    return new_prod

@router.post("/products/{product_id}/variants")
def create_new_product_variant(product_id: int, var: CreateProductVariant, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Variant).filter(
        Variant.product_id == product_id,
        Variant.colour     == var.colour,
        Variant.size       == var.size
        ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product Variant already in store(same size and colour)")
    
    new_var = Variant (
        product_id      =product_id,
        size            =var.size,
        colour          =var.colour,
        stock           =var.stock
    )
    db.add(new_var)
    db.commit()
    db.refresh(new_var)
    return new_var

# ─── READ ROUTES ────────────────────────────────────────────────

@router.get("/categories")
def get_all_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.get("/categories/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@router.get("/products")
def get_all_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.is_active == True).all()

@router.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod

@router.get("/products/{product_id}/variants")
def get_product_variants(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    variants = db.query(Variant).filter(Variant.product_id == product_id).all()
    return variants

@router.get("/admin/categories")
def admin_get_all_categories(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(Category).all()

@router.get("/admin/products")
def admin_get_all_products(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(Product).all()

@router.get("/admin/products/{product_id}")
def admin_get_product(product_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod

# ─── UPDATE ROUTES ───────────────────────────────────────────────

@router.patch("/admin/categories/{category_id}")
def update_category(category_id: int, cat: UpdateCategory, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Category).filter(Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in cat.model_dump(exclude_unset=True).items():
        setattr(existing, field, value)
    db.commit()
    db.refresh(existing)
    return existing

@router.patch("/admin/products/{product_id}")
def update_product(product_id: int, prod: UpdateProduct, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Product).filter(Product.id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in prod.model_dump(exclude_unset=True).items():
        setattr(existing, field, value)
    db.commit()
    db.refresh(existing)
    return existing

@router.patch("/admin/products/{product_id}/variants/{variant_id}")
def update_variant(product_id: int, variant_id: int, var: UpdateProductVariant, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Variant).filter(Variant.id == variant_id, Variant.product_id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Variant not found")
    for field, value in var.model_dump(exclude_unset=True).items():
        setattr(existing, field, value)
    db.commit()
    db.refresh(existing)
    return existing

# ─── DELETE ROUTES ───────────────────────────────────────────────

@router.delete("/admin/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Category).filter(Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(existing)
    db.commit()
    return {"message": "Category deleted"}

@router.delete("/admin/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Product).filter(Product.id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(existing)
    db.commit()
    return {"message": "Product deleted"}

@router.delete("/admin/products/{product_id}/variants/{variant_id}")
def delete_variant(product_id: int, variant_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Variant).filter(Variant.id == variant_id, Variant.product_id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Variant not found")
    db.delete(existing)
    db.commit()
    return {"message": "Variant deleted"}

# ─── READ ROUTES ────────────────────────────────────────────────

@router.get("/categories")
def get_all_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.get("/categories/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@router.get("/products")
def get_all_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.is_active == True).all()

@router.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod

@router.get("/products/{product_id}/variants")
def get_product_variants(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    variants = db.query(Variant).filter(Variant.product_id == product_id).all()
    return variants

@router.get("/admin/categories")
def admin_get_all_categories(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(Category).all()

@router.get("/admin/products")
def admin_get_all_products(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(Product).all()

@router.get("/admin/products/{product_id}")
def admin_get_product(product_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod

# ─── UPDATE ROUTES ───────────────────────────────────────────────

@router.patch("/admin/categories/{category_id}")
def update_category(category_id: int, cat: UpdateCategory, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Category).filter(Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in cat.model_dump(exclude_unset=True).items():
        setattr(existing, field, value)
    db.commit()
    db.refresh(existing)
    return existing

@router.patch("/admin/products/{product_id}")
def update_product(product_id: int, prod: UpdateProduct, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Product).filter(Product.id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in prod.model_dump(exclude_unset=True).items():
        setattr(existing, field, value)
    db.commit()
    db.refresh(existing)
    return existing

@router.patch("/admin/products/{product_id}/variants/{variant_id}")
def update_variant(product_id: int, variant_id: int, var: UpdateProductVariant, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Variant).filter(Variant.id == variant_id, Variant.product_id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Variant not found")
    for field, value in var.model_dump(exclude_unset=True).items():
        setattr(existing, field, value)
    db.commit()
    db.refresh(existing)
    return existing

# ─── DELETE ROUTES ───────────────────────────────────────────────

@router.delete("/admin/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Category).filter(Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(existing)
    db.commit()
    return {"message": "Category deleted"}

@router.delete("/admin/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Product).filter(Product.id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(existing)
    db.commit()
    return {"message": "Product deleted"}

@router.delete("/admin/products/{product_id}/variants/{variant_id}")
def delete_variant(product_id: int, variant_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Variant).filter(Variant.id == variant_id, Variant.product_id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Variant not found")
    db.delete(existing)
    db.commit()
    return {"message": "Variant deleted"}

# ─── READ ROUTES ────────────────────────────────────────────────

@router.get("/categories")
def get_all_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.get("/categories/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@router.get("/products")
def get_all_products(db: Session = Depends(get_db)):
    return db.query(Product).filter(Product.is_active == True).all()

@router.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod

@router.get("/products/{product_id}/variants")
def get_product_variants(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    variants = db.query(Variant).filter(Variant.product_id == product_id).all()
    return variants

@router.get("/admin/categories")
def admin_get_all_categories(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(Category).all()

@router.get("/admin/products")
def admin_get_all_products(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(Product).all()

@router.get("/admin/products/{product_id}")
def admin_get_product(product_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod

# ─── UPDATE ROUTES ───────────────────────────────────────────────

@router.patch("/admin/categories/{category_id}")
def update_category(category_id: int, cat: UpdateCategory, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Category).filter(Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in cat.model_dump(exclude_unset=True).items():
        setattr(existing, field, value)
    db.commit()
    db.refresh(existing)
    return existing

@router.patch("/admin/products/{product_id}")
def update_product(product_id: int, prod: UpdateProduct, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Product).filter(Product.id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in prod.model_dump(exclude_unset=True).items():
        setattr(existing, field, value)
    db.commit()
    db.refresh(existing)
    return existing

@router.patch("/admin/products/{product_id}/variants/{variant_id}")
def update_variant(product_id: int, variant_id: int, var: UpdateProductVariant, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Variant).filter(Variant.id == variant_id, Variant.product_id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Variant not found")
    for field, value in var.model_dump(exclude_unset=True).items():
        setattr(existing, field, value)
    db.commit()
    db.refresh(existing)
    return existing

# ─── DELETE ROUTES ───────────────────────────────────────────────

@router.delete("/admin/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Category).filter(Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(existing)
    db.commit()
    return {"message": "Category deleted"}

@router.delete("/admin/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Product).filter(Product.id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(existing)
    db.commit()
    return {"message": "Product deleted"}

@router.delete("/admin/products/{product_id}/variants/{variant_id}")
def delete_variant(product_id: int, variant_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Variant).filter(Variant.id == variant_id, Variant.product_id == product_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Variant not found")
    db.delete(existing)
    db.commit()
    return {"message": "Variant deleted"}
