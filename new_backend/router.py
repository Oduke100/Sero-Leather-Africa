import io, uuid, json
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from PIL import Image

from auth import create_token, verify_password, get_current_admin
from dependancies import get_db
from currency import convert, get_supported
from mpesa import initiate_stk_push
from paypal import create_order as paypal_create_order, capture_order as paypal_capture_order

from schemas import (
    AdminLogin, AdminTokenResponse,
    CreateCategory, UpdateCategory,
    CreateProduct, UpdateProduct,
    CreateProductVariant, UpdateProductVariant,
    ProductInfo, AdminProductInfo,
    OrderCreate, OrderOut, OrderStatusOut, CreateCurrency,
)
from models import Admin, Category, Product, Variant, Order, OrderItem, PaymentLog

router = APIRouter()


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def _build_product_info(p, currency, schema):
    from schemas import AdminProductInfo
    base = p.price
    final = base * (1 - p.discount_percentage / 100) if p.is_on_discount and p.discount_percentage else base
    kwargs = dict(
        name=p.name, slug=p.slug, description=p.description, image_url=p.image_url,
        is_customisable=p.is_customisable, price=convert(base, currency),
        final_price=convert(final, currency), discount_percentage=p.discount_percentage,
        is_on_discount=p.is_on_discount, stock=p.stock, is_active=p.is_active, currency=currency,
    )
    if schema is AdminProductInfo:
        kwargs.update(id=p.id, initial_stock=p.initial_stock, created_at=p.created_at, updated_at=p.updated_at)
    return schema(**kwargs)

def _validate_currency(currency: str, db=None):
    currency = currency.upper()
    supported = get_supported(db) if db else ["KES"]
    if currency not in supported:
        raise HTTPException(status_code=400, detail=f"Unsupported currency. Supported: {SUPPORTED_CURRENCIES}")
    return currency


# ─── MISC ────────────────────────────────────────────────────────────────────

@router.get("/")
def root():
    return {"Message": "The BE is livee!!!"}

@router.post("/upload")
def upload_image(file: UploadFile = File(...)):
    try:
        if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG and WebP images are allowed.")
        contents = file.file.read()
        try:
            image = Image.open(io.BytesIO(contents))
            image.verify()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file.")
        if image.width > 1200:
            ratio = 1200 / image.width
            image = image.resize((1200, int(image.height * ratio)), Image.LANCZOS)
        filename = f"{uuid.uuid4()}.webp"
        image.save(f"uploads/{filename}", "WEBP", quality=82, method=6)
        return {"url": f"/uploads/{filename}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── AUTH ────────────────────────────────────────────────────────────────────

@router.post("/admin/login", response_model=AdminTokenResponse)
def admin_login(credentials: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == credentials.username).first()
    if not admin or not verify_password(credentials.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token({"sub": admin.username})
    admin.active_token = token
    db.commit()
    return {"access_token": token, "token_type": "bearer"}


# ─── CREATE ROUTES ───────────────────────────────────────────────────────────

@router.post("/new-category")
def create_new_category(cat: CreateCategory, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    if db.query(Category).filter(Category.name == cat.name).first():
        raise HTTPException(status_code=400, detail="Category already in the shop!")
    new_cat = Category(**cat.model_dump())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.post("/new-product")
def create_new_product(prod: CreateProduct, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    if db.query(Product).filter(Product.name == prod.name).first():
        raise HTTPException(status_code=400, detail="Product already in store!")
    prod_data = prod.model_dump()
    prod_data["initial_stock"] = prod_data.get("stock", 0)
    new_prod = Product(**prod_data)
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    return new_prod

@router.post("/products/{product_id}/variants")
def create_new_product_variant(product_id: int, var: CreateProductVariant, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    if db.query(Variant).filter(Variant.product_id == product_id, Variant.colour == var.colour, Variant.size == var.size).first():
        raise HTTPException(status_code=400, detail="Variant already in store (same size and colour)")
    new_var = Variant(product_id=product_id, **var.model_dump())
    db.add(new_var)
    db.commit()
    db.refresh(new_var)
    return new_var


# ─── READ ROUTES ─────────────────────────────────────────────────────────────

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
def get_all_products(currency: str = "KES", category: str = None, db: Session = Depends(get_db)):
    currency = _validate_currency(currency, db)
    query = db.query(Product).filter(Product.is_active == True)
    if category:
        query = query.join(Category).filter(Category.slug == category)
    return [_build_product_info(p, currency, AdminProductInfo) for p in query.all()]

@router.get("/products/by-slug/{slug}")
def get_product_by_slug(slug: str, currency: str = "KES", db: Session = Depends(get_db)):
    currency = _validate_currency(currency, db)
    p = db.query(Product).filter(Product.slug == slug, Product.is_active == True).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _build_product_info(p, currency, AdminProductInfo)

@router.get("/products/{product_id}")
def get_product(product_id: int, currency: str = "KES", db: Session = Depends(get_db)):
    currency = _validate_currency(currency, db)
    p = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _build_product_info(p, currency, ProductInfo)

@router.get("/products/{product_id}/variants")
def get_product_variants(product_id: int, db: Session = Depends(get_db)):
    if not db.query(Product).filter(Product.id == product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
    return db.query(Variant).filter(Variant.product_id == product_id).all()

@router.get("/orders/{order_id}/status", response_model=OrderStatusOut)
def get_order_status(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderStatusOut(
        order_id=order.id, status=order.status, payment_status=order.payment_status,
        total_price=order.total_price, merchant_reference=order.merchant_reference,
    )

@router.get("/admin/categories")
def admin_get_all_categories(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    return db.query(Category).all()

@router.get("/admin/products")
def admin_get_all_products(currency: str = "KES", db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    currency = _validate_currency(currency, db)
    return [_build_product_info(p, currency, AdminProductInfo) for p in db.query(Product).all()]

@router.get("/admin/products/{product_id}")
def admin_get_product(product_id: int, currency: str = "KES", db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    currency = _validate_currency(currency, db)
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _build_product_info(p, currency, AdminProductInfo)

@router.get("/admin/orders")
def get_all_orders(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    result = []
    for o in db.query(Order).order_by(Order.id.desc()).all():
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        item_list = []
        for oi in items:
            p = db.query(Product).filter(Product.id == oi.product_id).first()
            item_list.append({"name": p.name if p else f"Product #{oi.product_id}", "price": float(oi.unit_price), "quantity": oi.quantity})
        result.append([o.id, o.customer_name, o.customer_phone, o.delivery_address, json.dumps(item_list), float(o.total_price), o.status, str(o.created_at)])
    return {"orders": result}


# ─── UPDATE ROUTES ───────────────────────────────────────────────────────────

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

@router.patch("/admin/categories/{category_id}/update")
def admin_update_category(category_id: int, cat: UpdateCategory, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
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

@router.put("/admin/orders/{order_id}")
def update_order_status(order_id: int, payload: dict, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.get("status", order.status)
    db.commit()
    return {"message": "Status updated"}


# ─── DELETE ROUTES ───────────────────────────────────────────────────────────

@router.delete("/admin/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    existing = db.query(Category).filter(Category.id == category_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(existing)
    db.commit()
    return {"message": "Category deleted"}

@router.delete("/admin/categories/{category_id}/delete")
def admin_delete_category(category_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
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
    db.query(OrderItem).filter(OrderItem.product_id == product_id).delete()
    db.query(Variant).filter(Variant.product_id == product_id).delete()
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


# ─── ORDER ROUTES ────────────────────────────────────────────────────────────

@router.post("/orders", response_model=OrderOut)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    items_data = []
    total = Decimal("0.00")

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.is_active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found or inactive")
        if item.variant_id:
            variant = db.query(Variant).filter(Variant.id == item.variant_id, Variant.product_id == item.product_id).first()
            if not variant:
                raise HTTPException(status_code=404, detail=f"Variant {item.variant_id} not found")
            if variant.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Not enough stock for variant {item.variant_id}. Available: {variant.stock}")
        else:
            if product.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}. Available: {product.stock}")

        unit_price = (
            product.price * (1 - product.discount_percentage / 100)
            if product.is_on_discount and product.discount_percentage
            else product.price
        )
        total += unit_price * item.quantity
        items_data.append({"product_id": item.product_id, "variant_id": item.variant_id, "quantity": item.quantity, "unit_price": unit_price})

    merchant_ref = str(uuid.uuid4())
    order = Order(
        customer_name=payload.customer_name, customer_email=payload.customer_email,
        customer_phone=payload.customer_phone, delivery_address=payload.delivery_address,
        total_price=total, status="pending", payment_status="unpaid",
        payment_method=payload.payment_method, merchant_reference=merchant_ref, currency=payload.currency,
    )
    db.add(order)
    db.flush()

    for d in items_data:
        db.add(OrderItem(order_id=order.id, **d))

    if payload.payment_method == "mpesa":
        try:
            stk = initiate_stk_push(phone=payload.customer_phone, amount=int(total), merchant_reference=merchant_ref)
            order.mpesa_checkout_request_id = stk.get("CheckoutRequestID")
            db.add(PaymentLog(order_id=order.id, provider="mpesa", event_type="initiate", raw_payload=json.dumps(stk), provider_reference=stk.get("CheckoutRequestID")))
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=502, detail=f"M-Pesa initiation failed: {str(e)}")

    db.commit()
    db.refresh(order)
    order.items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    return order


# ─── WEBHOOK ROUTES ──────────────────────────────────────────────────────────

@router.post("/webhooks/mpesa")
async def mpesa_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    callback = body.get("Body", {}).get("stkCallback", {})
    checkout_request_id = callback.get("CheckoutRequestID")
    result_code = callback.get("ResultCode")

    order = db.query(Order).filter(Order.mpesa_checkout_request_id == checkout_request_id).first()
    if not order:
        return {"ResultCode": 0, "ResultDesc": "Accepted"}

    if result_code == 0:
        meta = callback.get("CallbackMetadata", {}).get("Item", [])
        receipt = next((i["Value"] for i in meta if i["Name"] == "MpesaReceiptNumber"), None)
        order.payment_status = "paid"
        order.status = "confirmed"
        for oi in db.query(OrderItem).filter(OrderItem.order_id == order.id).all():
            if oi.variant_id:
                v = db.query(Variant).filter(Variant.id == oi.variant_id).with_for_update().first()
                if v: v.stock -= oi.quantity
            else:
                p = db.query(Product).filter(Product.id == oi.product_id).with_for_update().first()
                if p: p.stock -= oi.quantity
        db.add(PaymentLog(order_id=order.id, provider="mpesa", event_type="success", raw_payload=json.dumps(body), provider_reference=receipt))
    else:
        order.payment_status = "failed"
        db.add(PaymentLog(order_id=order.id, provider="mpesa", event_type="failure", raw_payload=json.dumps(body)))

    db.commit()
    return {"ResultCode": 0, "ResultDesc": "Accepted"}


# ─── PAYPAL ROUTES ───────────────────────────────────────────────────────────

@router.post("/orders/{order_id}/paypal/create")
def paypal_create(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    amount_usd = str(convert(order.total_price, "USD"))
    try:
        result = paypal_create_order(amount_usd=amount_usd, merchant_reference=order.merchant_reference)
        paypal_order_id = result["id"]
        approval_url = next(l["href"] for l in result["links"] if l["rel"] == "approve")
        order.paypal_order_id = paypal_order_id
        db.add(PaymentLog(order_id=order.id, provider="paypal", event_type="initiate", raw_payload=json.dumps(result), provider_reference=paypal_order_id))
        db.commit()
        return {"approval_url": approval_url, "paypal_order_id": paypal_order_id}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"PayPal error: {e}")

@router.post("/orders/{order_id}/paypal/capture")
def paypal_capture(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order.paypal_order_id:
        raise HTTPException(status_code=400, detail="No PayPal order on record")
    try:
        result = paypal_capture_order(order.paypal_order_id)
        status = result.get("status")
        if status == "COMPLETED":
            order.payment_status = "paid"
            order.status = "confirmed"
            capture_id = result["purchase_units"][0]["payments"]["captures"][0]["id"]
            for oi in db.query(OrderItem).filter(OrderItem.order_id == order.id).all():
                if oi.variant_id:
                    v = db.query(Variant).filter(Variant.id == oi.variant_id).with_for_update().first()
                    if v: v.stock -= oi.quantity
                else:
                    p = db.query(Product).filter(Product.id == oi.product_id).with_for_update().first()
                    if p: p.stock -= oi.quantity
            db.add(PaymentLog(order_id=order.id, provider="paypal", event_type="success", raw_payload=json.dumps(result), provider_reference=capture_id))
        else:
            order.payment_status = "failed"
            db.add(PaymentLog(order_id=order.id, provider="paypal", event_type="failure", raw_payload=json.dumps(result)))
        db.commit()
        return {"status": order.payment_status, "paypal_status": status}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"PayPal capture error: {e}")


# ─── CURRENCY ROUTES ─────────────────────────────────────────────────────────

@router.get("/currencies")
def get_currencies(db: Session = Depends(get_db)):
    from models import Currency
    from schemas import CurrencyInfo
    return db.query(Currency).filter(Currency.is_active == True).all()

@router.post("/admin/currencies")
def add_currency(payload: CreateCurrency, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    from models import Currency
    if db.query(Currency).filter(Currency.code == payload.code.upper()).first():
        raise HTTPException(status_code=400, detail="Currency already exists")
    c = Currency(code=payload.code.upper(), name=payload.name)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.delete("/admin/currencies/{code}")
def remove_currency(code: str, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    from models import Currency
    c = db.query(Currency).filter(Currency.code == code.upper()).first()
    if not c:
        raise HTTPException(status_code=404, detail="Currency not found")
    db.delete(c)
    db.commit()
    return {"message": f"{code.upper()} removed"}


# ─── CATEGORY DETAIL ─────────────────────────────────────────────────────────

@router.get("/admin/categories/{category_id}/detail")
def admin_category_detail(category_id: int, db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    products = db.query(Product).filter(Product.category_id == category_id).all()
    return {
        "id":           cat.id,
        "name":         cat.name,
        "slug":         cat.slug,
        "description":  cat.description,
        "image_url":    cat.image_url,
        "created_at":   cat.created_at,
        "updated_at":   cat.updated_at,
        "products": [
            {
                "id":            p.id,
                "name":          p.name,
                "initial_stock": p.initial_stock,
                "stock":         p.stock,
                "is_active":     p.is_active,
                "price":         float(p.price),
            }
            for p in products
        ],
    }
