# app/payments/router.py

import json
from fastapi           import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic          import BaseModel
from app.database      import get_connection
from app.payments      import mpesa, paypal

router = APIRouter()


# ── Request bodies ────────────────────────────────────────────────

class MpesaInitRequest(BaseModel):
    order_id:  int
    phone:     str
    amount:    float
    payer_name: str

class PaypalInitRequest(BaseModel):
    order_id:   int
    amount_usd: float
    payer_name: str
    payer_email: str = ""


# ── Helpers ───────────────────────────────────────────────────────

def record_transaction(order_id, txn_id, method, payer_name, payer_contact, amount, currency, status):
    conn = cur = None
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO transactions
                (order_id, transaction_id, payment_method,
                 payer_name, payer_contact, amount, currency, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (transaction_id) DO NOTHING
        """, (order_id, txn_id, method, payer_name, payer_contact, amount, currency, status))
        conn.commit()
    finally:
        if cur:  cur.close()
        if conn: conn.close()


def confirm_order(order_id: int):
    conn = cur = None
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute(
            "UPDATE orders SET status = 'Confirmed' WHERE id = %s AND status = 'Pending'",
            (order_id,)
        )
        conn.commit()
    finally:
        if cur:  cur.close()
        if conn: conn.close()


# ── M-Pesa endpoints ──────────────────────────────────────────────

@router.post("/mpesa/initiate")
def mpesa_initiate(req: MpesaInitRequest):
    try:
        result = mpesa.stk_push(req.phone, req.amount, req.order_id)
        checkout_request_id = result.get("CheckoutRequestID", f"pending-{req.order_id}")
        record_transaction(
            order_id      = req.order_id,
            txn_id        = checkout_request_id,
            method        = "mpesa",
            payer_name    = req.payer_name,
            payer_contact = req.phone,
            amount        = req.amount,
            currency      = "KES",
            status        = "pending",
        )
        return {"message": "STK push sent", "checkout_request_id": checkout_request_id}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"M-Pesa error: {e}")


@router.post("/mpesa/callback")
async def mpesa_callback(request: Request):
    """Safaricom calls this URL after the customer completes/rejects payment."""
    try:
        body     = await request.json()
        stk      = body["Body"]["stkCallback"]
        order_id = None

        # Extract order_id from AccountReference e.g. "SeroOrder42"
        conn = cur = None
        try:
            conn = get_connection()
            cur  = conn.cursor()
            cur.execute(
                "SELECT order_id FROM transactions WHERE transaction_id = %s",
                (stk["CheckoutRequestID"],)
            )
            row = cur.fetchone()
            if row: order_id = row[0]
        finally:
            if cur:  cur.close()
            if conn: conn.close()

        if stk["ResultCode"] == 0:
            # Payment successful
            meta   = {m["Name"]: m["Value"] for m in stk["CallbackMetadata"]["Item"]}
            txn_id = meta.get("MpesaReceiptNumber", stk["CheckoutRequestID"])

            conn = cur = None
            try:
                conn = get_connection()
                cur  = conn.cursor()
                cur.execute(
                    "UPDATE transactions SET transaction_id = %s, status = 'success' WHERE transaction_id = %s",
                    (txn_id, stk["CheckoutRequestID"])
                )
                conn.commit()
            finally:
                if cur:  cur.close()
                if conn: conn.close()

            if order_id:
                confirm_order(order_id)

    except Exception:
        pass  # Always return 200 to Safaricom

    return {"ResultCode": 0, "ResultDesc": "Accepted"}


# ── PayPal endpoints ──────────────────────────────────────────────

@router.post("/paypal/initiate")
def paypal_initiate(req: PaypalInitRequest):
    try:
        result = paypal.create_order(req.amount_usd, req.order_id)
        record_transaction(
            order_id      = req.order_id,
            txn_id        = result["paypal_order_id"],
            method        = "paypal",
            payer_name    = req.payer_name,
            payer_contact = req.payer_email,
            amount        = req.amount_usd,
            currency      = "USD",
            status        = "pending",
        )
        return result  # {paypal_order_id, approval_url}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"PayPal error: {e}")


@router.get("/paypal/capture")
def paypal_capture(token: str, PayerID: str = ""):
    """PayPal redirects here after customer approves payment."""
    try:
        result   = paypal.capture_order(token)
        status   = result["status"]  # "COMPLETED" if successful

        conn = cur = None
        try:
            conn = get_connection()
            cur  = conn.cursor()
            cur.execute(
                "UPDATE transactions SET status = %s WHERE transaction_id = %s RETURNING order_id",
                ("success" if status == "COMPLETED" else "failed", token)
            )
            row = cur.fetchone()
            conn.commit()
            if row and status == "COMPLETED":
                confirm_order(row[0])
        finally:
            if cur:  cur.close()
            if conn: conn.close()

        if status == "COMPLETED":
            return RedirectResponse(url="/?payment=success")
        return RedirectResponse(url="/cart?payment=failed")

    except Exception as e:
        return RedirectResponse(url="/cart?payment=failed")
    
@router.get("/transactions")
def get_transactions():
    conn = cur = None
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute("SELECT order_id, transaction_id, payment_method, payer_name, payer_contact, amount, currency, status, created_at FROM transactions ORDER BY created_at DESC")
        rows = cur.fetchall()
        return {"transactions": [
            {
                "order_id":       r[0],
                "transaction_id": r[1],
                "payment_method": r[2],
                "payer_name":     r[3],
                "payer_contact":  r[4],
                "amount":         float(r[5]),
                "currency":       r[6],
                "status":         r[7],
                "created_at":     str(r[8]),
            } for r in rows
        ]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cur:  cur.close()
        if conn: conn.close()