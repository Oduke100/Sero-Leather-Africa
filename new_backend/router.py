import io, uuid, json
from decimal import Decimal

from fastapi import APIRouter, Body, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from PIL import Image

from auth import create_token, verify_password, get_current_admin
from dependancies import get_db
from currency import convert, get_supported
from mpesa import initiate_stk_push
from paypal import create_order as paypal_create_order, capture_order as paypal_capture_order
from models import Admin, Category, Product, Variant, Order, OrderItem, PaymentLog, Currency
from schemas import (
    AdminLogin, AdminTokenResponse,
    CreateCategory, UpdateCategory,
    CreateProduct, UpdateProduct,
    CreateProductVariant, UpdateProductVariant,
    ProductInfo, AdminProductInfo,
    OrderCreate, OrderOut, OrderStatusOut, OrderStatusUpdate,
    CreateCurrency, CurrencyInfo,
)

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


# ── helpers ───────────────────────────────────────────────────────────────────
def _build_product_info(p, currency, schema):
    base  = p.price
    final = base * (1 - p.discount_percentage / 100) if p.is_on_discount and p.discount_percentage else base
    kwargs = dict(
        id=p.id, name=p.name, slug=p.slug, description=p.description, image_url=p.image_url,
        is_customisable=p.is_customisable, price=convert(base, currency),
        final_price=convert(final, currency), discount_percentage=p.discount_percentage,
        is_on_discount=p.is_on_discount, stock=p.stock, is_active=p.is_active, currency=currency,
    )
    if schema is AdminProductInfo:
        kwargs.update(initial_stock=p.initial_stock, created_at=p.created_at, updated_at=p.updated_at)
    return schema(**kwargs)

def _validate_currency(currency: str, db: Session) -> str:
    currency = currency.upper()
    if currency not in get_supported(db):
        raise HTTPException(status_code=400, detail=f"Unsupported currency. Supported: {get_supported(db)}")
    return currency

def _get_or_404(db: Session, model, **filters):
    obj = db.query(model).filter_by(**filters).first()
    if not obj:
        raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
    return obj

def _patch(db: Session, obj, data):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj

def _deduct_stock(db: Session, order_id: int):
    for oi in db.query(OrderItem).filter(OrderItem.order_id == order_id).all():
        if oi.variant_id:
            v = db.query(Variant).filter(Variant.id == oi.variant_id).with_for_update().first()
            if v: v.stock -= oi.quantity
        else:
            p = db.query(Product).filter(Product.id == oi.product_id).with_for_update().first()
            if p: p.stock -= oi.quantity


# ── misc ──────────────────────────────────────────────────────────────────────
@router.get("/")
def root():
    return {"message": "BE is live"}

@router.post("/upload")
def upload_image(file: UploadFile = File(...), _: Admin = Depends(get_current_admin)):
    try:
        if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG and WebP images are allowed.")
        contents = file.file.read()
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large. Max size is 5MB.")
        try:
            Image.open(io.BytesIO(contents)).verify()
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
    except Exception:
        raise HTTPException(status_code=500, detail="Upload failed.")


# ── auth ──────────────────────────────────────────────────────────────────────
@router.post("/sero-internal/login", response_model=AdminTokenResponse)
@limiter.limit("5/minute")
def admin_login(request: Request, credentials: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == credentials.username).first()
    if not admin or not verify_password(credentials.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token({"sub": admin.username})
    admin.active_token = token
    db.commit()
    return {"access_token": token, "token_type": "bearer"}


# ── categories ────────────────────────────────────────────────────────────────
@router.get("/categories")
def get_all_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.get("/categories/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, Category, id=category_id)

@router.post("/admin/login")
async def admin_login_decoy(request: Request):
    raise HTTPException(status_code=404, detail="Not found")

@router.get("/admin/categories")
def admin_get_all_categories(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return db.query(Category).all()

@router.get("/admin/categories/{category_id}/detail")
def admin_category_detail(category_id: int, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    cat      = _get_or_404(db, Category, id=category_id)
    products = db.query(Product).filter(Product.category_id == category_id).all()
    return {
        "id": cat.id, "name": cat.name, "slug": cat.slug,
        "description": cat.description, "image_url": cat.image_url,
        "created_at": cat.created_at, "updated_at": cat.updated_at,
        "products": [
            {"id": p.id, "name": p.name, "initial_stock": p.initial_stock,
             "stock": p.stock, "is_active": p.is_active, "price": float(p.price)}
            for p in products
        ],
    }

@router.post("/new-category")
def create_category(cat: CreateCategory, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    if db.query(Category).filter(Category.name == cat.name).first():
        raise HTTPException(status_code=400, detail="Category already exists")
    obj = Category(**cat.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.patch("/admin/categories/{category_id}")
def update_category(category_id: int, cat: UpdateCategory, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return _patch(db, _get_or_404(db, Category, id=category_id), cat)

@router.delete("/admin/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    db.delete(_get_or_404(db, Category, id=category_id)); db.commit()
    return {"message": "Category deleted"}


# ── products ──────────────────────────────────────────────────────────────────
@router.get("/products")
def get_all_products(currency: str = "KES", category: str = None, db: Session = Depends(get_db)):
    currency = _validate_currency(currency, db)
    query    = db.query(Product).filter(Product.is_active == True)
    if category:
        query = query.join(Category).filter(Category.slug == category)
    return [_build_product_info(p, currency, ProductInfo) for p in query.all()]

@router.get("/products/by-slug/{slug}")
def get_product_by_slug(slug: str, currency: str = "KES", db: Session = Depends(get_db)):
    currency = _validate_currency(currency, db)
    p = db.query(Product).filter(Product.slug == slug, Product.is_active == True).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _build_product_info(p, currency, ProductInfo)

@router.get("/products/{product_id}")
def get_product(product_id: int, currency: str = "KES", db: Session = Depends(get_db)):
    currency = _validate_currency(currency, db)
    p = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _build_product_info(p, currency, ProductInfo)

@router.get("/products/{product_id}/variants")
def get_product_variants(product_id: int, db: Session = Depends(get_db)):
    _get_or_404(db, Product, id=product_id)
    return db.query(Variant).filter(Variant.product_id == product_id).all()

@router.get("/admin/products")
def admin_get_all_products(currency: str = "KES", db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    currency = _validate_currency(currency, db)
    return [_build_product_info(p, currency, AdminProductInfo) for p in db.query(Product).all()]

@router.get("/admin/products/{product_id}")
def admin_get_product(product_id: int, currency: str = "KES", db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    currency = _validate_currency(currency, db)
    return _build_product_info(_get_or_404(db, Product, id=product_id), currency, AdminProductInfo)

@router.post("/new-product")
def create_product(prod: CreateProduct, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    if db.query(Product).filter(Product.name == prod.name).first():
        raise HTTPException(status_code=400, detail="Product already exists")
    data = prod.model_dump()
    data["initial_stock"] = data.get("stock", 0)
    obj = Product(**data)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.patch("/admin/products/{product_id}")
def update_product(product_id: int, prod: UpdateProduct, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return _patch(db, _get_or_404(db, Product, id=product_id), prod)

@router.put("/products/{product_id}/toggle")
def toggle_product(product_id: int, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    product = _get_or_404(db, Product, id=product_id)
    product.is_active = not product.is_active
    db.commit()
    return {"is_active": product.is_active}

@router.delete("/admin/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    existing = _get_or_404(db, Product, id=product_id)
    db.query(OrderItem).filter(OrderItem.product_id == product_id).delete()
    db.query(Variant).filter(Variant.product_id == product_id).delete()
    db.delete(existing); db.commit()
    return {"message": "Product deleted"}


# ── variants ──────────────────────────────────────────────────────────────────
@router.post("/products/{product_id}/variants")
def create_variant(product_id: int, var: CreateProductVariant, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    if db.query(Variant).filter(Variant.product_id == product_id, Variant.colour == var.colour, Variant.size == var.size).first():
        raise HTTPException(status_code=400, detail="Variant already exists (same size and colour)")
    obj = Variant(product_id=product_id, **var.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.patch("/admin/products/{product_id}/variants/{variant_id}")
def update_variant(product_id: int, variant_id: int, var: UpdateProductVariant, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    return _patch(db, _get_or_404(db, Variant, id=variant_id, product_id=product_id), var)

@router.delete("/admin/products/{product_id}/variants/{variant_id}")
def delete_variant(product_id: int, variant_id: int, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    db.delete(_get_or_404(db, Variant, id=variant_id, product_id=product_id)); db.commit()
    return {"message": "Variant deleted"}


# ── orders ────────────────────────────────────────────────────────────────────
@router.get("/orders/{order_id}/status", response_model=OrderStatusOut)
def get_order_status(order_id: int, db: Session = Depends(get_db)):
    o = _get_or_404(db, Order, id=order_id)
    return OrderStatusOut(
        order_id=o.id, status=o.status, payment_status=o.payment_status,
        total_price=o.total_price, merchant_reference=o.merchant_reference,
    )

@router.get("/admin/orders")
def get_all_orders(db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    result = []
    for o in db.query(Order).order_by(Order.id.desc()).all():
        items = db.query(OrderItem).filter(OrderItem.order_id == o.id).all()
        item_list = []
        for oi in items:
            p = db.query(Product).filter(Product.id == oi.product_id).first()
            item_list.append({
                "name":     p.name if p else f"Product #{oi.product_id}",
                "price":    float(oi.unit_price),
                "quantity": oi.quantity,
            })
        result.append([o.id, o.customer_name, o.customer_phone, o.delivery_address, json.dumps(item_list), float(o.total_price), o.status, str(o.created_at)])
    return {"orders": result}

@router.post("/orders", response_model=OrderOut)
@limiter.limit("10/minute")
def create_order(request: Request, payload: OrderCreate, db: Session = Depends(get_db)):
    payload.currency = _validate_currency(payload.currency, db)
    items_data = []
    total      = Decimal("0.00")
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
        elif product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}. Available: {product.stock}")
        unit_price = (
            product.price * (1 - product.discount_percentage / 100)
            if product.is_on_discount and product.discount_percentage else product.price
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
    db.add(order); db.flush()
    for d in items_data:
        db.add(OrderItem(order_id=order.id, **d))
    if payload.payment_method == "mpesa":
        try:
            stk = initiate_stk_push(phone=payload.customer_phone, amount=int(total), merchant_reference=merchant_ref)
            order.mpesa_checkout_request_id = stk.get("CheckoutRequestID")
            db.add(PaymentLog(order_id=order.id, provider="mpesa", event_type="initiate", raw_payload=json.dumps(stk), provider_reference=stk.get("CheckoutRequestID")))
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=502, detail=f"M-Pesa initiation failed: {e}")
    db.commit(); db.refresh(order)
    order.items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    return order

@router.put("/admin/orders/{order_id}")
def update_order_status(order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    order = _get_or_404(db, Order, id=order_id)
    order.status = payload.status.value
    db.commit()
    return {"message": "Status updated"}


# ── webhooks ──────────────────────────────────────────────────────────────────
# Safaricom callback IP whitelist
MPESA_ALLOWED_IPS = {
    "196.201.214.200", "196.201.214.206", "196.201.213.100",
    "196.201.214.207", "196.201.214.208", "196.201.213.101",
    "196.201.212.127", "196.201.212.138", "196.201.212.129",
    "196.201.212.136", "196.201.212.74",  "196.201.212.69",
}

@router.post("/webhooks/mpesa")
async def mpesa_webhook(request: Request, db: Session = Depends(get_db)):
    client_ip = request.headers.get("X-Forwarded-For", request.client.host).split(",")[0].strip()
    if client_ip not in MPESA_ALLOWED_IPS:
        raise HTTPException(status_code=403, detail="Forbidden")
    body     = await request.json()
    callback = body.get("Body", {}).get("stkCallback", {})
    checkout_request_id = callback.get("CheckoutRequestID")
    order = db.query(Order).filter(Order.mpesa_checkout_request_id == checkout_request_id).first()
    if not order:
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
    if callback.get("ResultCode") == 0 and order.payment_status != "paid":
        meta    = callback.get("CallbackMetadata", {}).get("Item", [])
        receipt = next((i["Value"] for i in meta if i["Name"] == "MpesaReceiptNumber"), None)
        order.payment_status = "paid"
        order.status         = "confirmed"
        _deduct_stock(db, order.id)
        db.add(PaymentLog(order_id=order.id, provider="mpesa", event_type="success", raw_payload=json.dumps(body), provider_reference=receipt))
    else:
        order.payment_status = "failed"
        db.add(PaymentLog(order_id=order.id, provider="mpesa", event_type="failure", raw_payload=json.dumps(body)))
    db.commit()
    return {"ResultCode": 0, "ResultDesc": "Accepted"}


# ── paypal ────────────────────────────────────────────────────────────────────
@router.post("/orders/{order_id}/paypal/create")
def paypal_create(order_id: int, db: Session = Depends(get_db)):
    order = _get_or_404(db, Order, id=order_id)
    try:
        result       = paypal_create_order(amount_usd=str(convert(order.total_price, "USD")), merchant_reference=order.merchant_reference)
        paypal_id    = result["id"]
        approval_url = next(l["href"] for l in result["links"] if l["rel"] == "approve")
        order.paypal_order_id = paypal_id
        db.add(PaymentLog(order_id=order.id, provider="paypal", event_type="initiate", raw_payload=json.dumps(result), provider_reference=paypal_id))
        db.commit()
        return {"approval_url": approval_url, "paypal_order_id": paypal_id}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"PayPal error: {e}")

@router.post("/orders/{order_id}/paypal/capture")
def paypal_capture(order_id: int, db: Session = Depends(get_db)):
    order = _get_or_404(db, Order, id=order_id)
    if not order.paypal_order_id:
        raise HTTPException(status_code=400, detail="No PayPal order on record")
    try:
        result = paypal_capture_order(order.paypal_order_id)
        if result.get("status") == "COMPLETED":
            order.payment_status = "paid"
            order.status         = "confirmed"
            capture_id           = result["purchase_units"][0]["payments"]["captures"][0]["id"]
            _deduct_stock(db, order.id)
            db.add(PaymentLog(order_id=order.id, provider="paypal", event_type="success", raw_payload=json.dumps(result), provider_reference=capture_id))
        else:
            order.payment_status = "failed"
            db.add(PaymentLog(order_id=order.id, provider="paypal", event_type="failure", raw_payload=json.dumps(result)))
        db.commit()
        return {"status": order.payment_status, "paypal_status": result.get("status")}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"PayPal capture error: {e}")


# ── currencies ────────────────────────────────────────────────────────────────
@router.get("/currencies")
def get_currencies(db: Session = Depends(get_db)):
    return db.query(Currency).filter(Currency.is_active == True).all()

@router.post("/admin/currencies")
def add_currency(payload: CreateCurrency, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    if db.query(Currency).filter(Currency.code == payload.code.upper()).first():
        raise HTTPException(status_code=400, detail="Currency already exists")
    obj = Currency(code=payload.code.upper(), name=payload.name)
    db.add(obj); db.commit(); db.refresh(obj)
    return obj

@router.delete("/admin/currencies/{code}")
def remove_currency(code: str, db: Session = Depends(get_db), _: Admin = Depends(get_current_admin)):
    obj = db.query(Currency).filter(Currency.code == code.upper()).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Currency not found")
    db.delete(obj); db.commit()
    return {"message": f"{code.upper()} removed"}