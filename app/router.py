# app/router.py
# ─────────────────────────────────────────────
#  All API endpoints.
#  Mounted at /api by main.py.
# ─────────────────────────────────────────────

import json
import uuid
import shutil

from fastapi          import APIRouter, HTTPException, UploadFile, File
from app.database     import get_connection
from app.models       import Products, Order, OrderStatusUpdate

router = APIRouter()


# ═════════════════════════════════════════════
#  HELPERS
# ═════════════════════════════════════════════

def serialize_product(r):
    """Convert a raw DB product row into a JSON-safe list."""
    return [
        r[0],           # id
        r[1],           # product_name
        r[2],           # product_description
        float(r[3]),    # product_price      — Decimal → float
        r[4],           # product_picture_url
        r[5],           # product_quantity
        bool(r[6]),     # product_is_available — tinyint → bool
    ]

def serialize_order(r):
    """Convert a raw DB order row into a JSON-safe list."""
    items = r[4] if isinstance(r[4], list) else json.loads(r[4])
    return [
        r[0],                       # id
        r[1],                       # customer_name
        r[2],                       # phone
        r[3],                       # delivery_address
        items,                      # items  — already parsed
        float(r[5]),                # total_price — Decimal → float
        r[6],                       # status
        str(r[7]),                  # created_at  — datetime → string
    ]


# ═════════════════════════════════════════════
#  IMAGE UPLOAD
# ═════════════════════════════════════════════

@router.post("/upload")
def upload_image(file: UploadFile = File(...)):
    try:
        allowed = {"image/jpeg", "image/png", "image/webp"}
        if file.content_type not in allowed:
            raise HTTPException(
                status_code=400,
                detail="Only JPEG, PNG and WebP images are allowed."
            )

        ext      = file.filename.rsplit(".", 1)[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = f"uploads/{filename}"

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

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
            """
            INSERT INTO inventory
                (product_name, product_description, product_price,
                 product_picture_url, product_quantity, product_is_available)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                product.product_name,
                product.product_description,
                product.product_price,
                product.product_picture_url,
                product.product_quantity,
                product.product_is_available,
            ),
        )
        conn.commit()
        return {"message": "New product added successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@router.get("/products")
def get_all_products():
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                product_name,
                product_description,
                product_price,
                product_picture_url,
                product_quantity,
                product_is_available
            FROM inventory
            """
        )
        rows = cursor.fetchall()
        return {"products": [serialize_product(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@router.get("/products/{id}")
def get_product(id: int):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                product_name,
                product_description,
                product_price,
                product_picture_url,
                product_quantity,
                product_is_available
            FROM inventory WHERE id = %s
            """,
            (id,),
        )
        product = cursor.fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found.")
        return {"product": serialize_product(product)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@router.put("/products/{id}")
def update_product(id: int, product: Products):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE inventory
            SET product_name         = %s,
                product_description  = %s,
                product_price        = %s,
                product_picture_url  = %s,
                product_quantity     = %s,
                product_is_available = %s
            WHERE id = %s
            """,
            (
                product.product_name,
                product.product_description,
                product.product_price,
                product.product_picture_url,
                product.product_quantity,
                product.product_is_available,
                id,
            ),
        )
        conn.commit()
        return {"message": "Product updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


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
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@router.put("/products/{id}/toggle")
def toggle_availability(id: int):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE inventory SET product_is_available = NOT product_is_available WHERE id = %s",
            (id,),
        )
        conn.commit()
        return {"message": "Availability toggled."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


# ═════════════════════════════════════════════
#  ORDERS
# ═════════════════════════════════════════════

@router.post("/orders")
def place_order(order: Order):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO orders
                (customer_name, phone, delivery_address, items, total_price)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                order.customer_name,
                order.phone,
                order.delivery_address,
                json.dumps([item.dict() for item in order.items]),
                order.total_price,
            ),
        )
        conn.commit()
        return {"message": "Order placed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


@router.get("/orders")
def get_all_orders():
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                id,
                customer_name,
                phone,
                delivery_address,
                items,
                total_price,
                status,
                created_at
            FROM orders ORDER BY created_at DESC
            """
        )
        rows = cursor.fetchall()
        return {"orders": [serialize_order(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass


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

        cursor.execute(
            "UPDATE orders SET status = %s WHERE id = %s",
            (update.status, id),
        )

        # Deduct stock only when an order is marked Delivered
        if update.status == "Delivered":
            cursor.execute("SELECT items FROM orders WHERE id = %s", (id,))
            row = cursor.fetchone()
            if row:
                items = row[0] if isinstance(row[0], list) else json.loads(row[0])
                for item in items:
                    cursor.execute(
                        """
                        UPDATE inventory
                        SET product_quantity     = product_quantity - %s,
                            product_is_available = CASE
                                WHEN product_quantity - %s <= 0 THEN FALSE
                                ELSE product_is_available
                            END
                        WHERE id = %s
                        """,
                        (item["quantity"], item["quantity"], item["id"]),
                    )

        conn.commit()
        return {"message": "Order status updated."}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            cursor.close()
            conn.close()
        except Exception:
            pass