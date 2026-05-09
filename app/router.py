# app/router.py
# ─────────────────────────────────────────────
#  All API endpoints.
#  Mounted at /api by main.py.
# ─────────────────────────────────────────────

import io
import json
import uuid
from PIL import Image

from fastapi          import APIRouter, HTTPException, UploadFile, File, Request
from app.database     import get_connection
from app.models       import Products, Order, OrderStatusUpdate
from app.payments.router import router as payments_router

router = APIRouter()


# ═════════════════════════════════════════════
#  HELPERS
# ═════════════════════════════════════════════

def serialize_product(r):
    return [
        r[0], r[1], r[2],
        float(r[3]), r[4], r[5], bool(r[6]),
    ]

def serialize_order(r):
    items = r[4] if isinstance(r[4], list) else json.loads(r[4])
    return [
        r[0], r[1], r[2], r[3], items,
        float(r[5]), r[6], str(r[7]),
    ]


# ═════════════════════════════════════════════
#  IMAGE UPLOAD
# ═════════════════════════════════════════════

@router.post("/upload")
def upload_image(file: UploadFile = File(...)):
    try:
        allowed = {"image/jpeg", "image/png", "image/webp"}
        if file.content_type not in allowed:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG and WebP images are allowed.")
        contents = file.file.read()
        try:
            image = Image.open(io.BytesIO(contents))
            image.verify()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file.")
        max_width = 1200
        if image.width > max_width:
            ratio = max_width / image.width
            image = image.resize((max_width, int(image.height * ratio)), Image.LANCZOS)
        filename = f"{uuid.uuid4()}.webp"
        image.save(f"uploads/{filename}", "WEBP", quality=82, method=6)
        return {"url": f"/uploads/{filename}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═════════════════════════════════════════════
#  PRODUCTS
# ═════════════════════════════════════════════

@router.post("/products")
def add_product(product: Products):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO inventory (product_name, product_description, product_price, product_picture_url, product_quantity, product_is_available) VALUES (%s, %s, %s, %s, %s, %s)",
            (product.product_name, product.product_description, product.product_price, product.product_picture_url, product.product_quantity, product.product_is_available),
        )
        conn.commit()
        return {"message": "New product added successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try: cursor.close(); conn.close()
        except: pass


@router.get("/products")
def get_all_products():
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, product_name, product_description, product_price, product_picture_url, product_quantity, product_is_available FROM inventory")
        return {"products": [serialize_product(r) for r in cursor.fetchall()]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try: cursor.close(); conn.close()
        except: pass


@router.get("/products/{id}")
def get_product(id: int):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, product_name, product_description, product_price, product_picture_url, product_quantity, product_is_available FROM inventory WHERE id = %s", (id,))
        product = cursor.fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")
        return {"product": serialize_product(product)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try: cursor.close(); conn.close()
        except: pass


@router.put("/products/{id}")
def update_product(id: int, product: Products):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE inventory SET product_name=%s, product_description=%s, product_price=%s, product_picture_url=%s, product_quantity=%s, product_is_available=%s WHERE id=%s",
            (product.product_name, product.product_description, product.product_price, product.product_picture_url, product.product_quantity, product.product_is_available, id),
        )
        conn.commit()
        return {"message": "Product updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try: cursor.close(); conn.close()
        except: pass


@router.delete("/products/{id}")
def delete_product(id: int):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM inventory WHERE id = %s", (id,))
        conn.commit()
        return {"message": "Product removed from inventory successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try: cursor.close(); conn.close()
        except: pass


@router.put("/products/{id}/toggle")
def toggle_availability(id: int):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE inventory SET product_is_available = NOT product_is_available WHERE id = %s", (id,))
        conn.commit()
        return {"message": "Availability toggled."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try: cursor.close(); conn.close()
        except: pass


# ═════════════════════════════════════════════
#  ORDERS
# ═════════════════════════════════════════════

@router.post("/orders")
def place_order(request: Request, order: Order):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO orders (customer_name, phone, delivery_address, items, total_price) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (order.customer_name, order.phone, order.delivery_address, json.dumps([item.dict() for item in order.items]), order.total_price),
        )
        order_id = cursor.fetchone()[0]
        conn.commit()
        return {"message": "Order placed successfully.", "id": order_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try: cursor.close(); conn.close()
        except: pass


@router.get("/orders")
def get_all_orders():
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, customer_name, phone, delivery_address, items, total_price, status, created_at FROM orders ORDER BY created_at DESC")
        return {"orders": [serialize_order(r) for r in cursor.fetchall()]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try: cursor.close(); conn.close()
        except: pass


@router.put("/orders/{id}")
def update_order_status(id: int, update: OrderStatusUpdate):
    valid_statuses = ["Pending", "Confirmed", "Out for delivery", "Delivered", "Cancelled"]
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        if update.status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status value.")
        cursor.execute("SELECT status FROM orders WHERE id = %s", (id,))
        current = cursor.fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Order not found.")
        if current[0] == "Delivered" and update.status == "Delivered":
            return {"message": "Order is already marked as delivered."}
        cursor.execute("UPDATE orders SET status = %s WHERE id = %s", (update.status, id))
        if update.status == "Delivered":
            cursor.execute("SELECT items FROM orders WHERE id = %s", (id,))
            row = cursor.fetchone()
            if row:
                items = row[0] if isinstance(row[0], list) else json.loads(row[0])
                for item in items:
                    cursor.execute(
                        "UPDATE inventory SET product_quantity = product_quantity - %s, product_is_available = CASE WHEN product_quantity - %s <= 0 THEN FALSE ELSE product_is_available END WHERE id = %s",
                        (item["quantity"], item["quantity"], item["id"]),
                    )
        conn.commit()
        return {"message": "Order status updated."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try: cursor.close(); conn.close()
        except: pass


# ═════════════════════════════════════════════
#  PAYMENT ROUTES
# ═════════════════════════════════════════════

router.include_router(payments_router, prefix="/payments")