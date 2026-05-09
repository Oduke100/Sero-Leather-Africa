# app/payments/paypal.py

import os
import httpx

CLIENT_ID     = os.getenv("PAYPAL_CLIENT_ID")
CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
MODE          = os.getenv("PAYPAL_MODE", "sandbox")
RETURN_URL    = os.getenv("PAYPAL_RETURN_URL")
CANCEL_URL    = os.getenv("PAYPAL_CANCEL_URL")

BASE_URL = (
    "https://api-m.sandbox.paypal.com"
    if MODE == "sandbox"
    else "https://api-m.paypal.com"
)


def get_access_token() -> str:
    r = httpx.post(
        f"{BASE_URL}/v1/oauth2/token",
        data={"grant_type": "client_credentials"},
        auth=(CLIENT_ID, CLIENT_SECRET),
        timeout=10,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def create_order(amount_usd: float, order_id: int) -> dict:
    """
    Creates a PayPal order and returns the approval URL
    the frontend redirects the customer to.
    """
    token = get_access_token()
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "reference_id": f"sero-{order_id}",
            "description":  f"Sero Leather Order #{order_id}",
            "amount": {
                "currency_code": "USD",
                "value":         f"{amount_usd:.2f}",
            },
        }],
        "application_context": {
            "return_url": RETURN_URL,
            "cancel_url": CANCEL_URL,
            "brand_name": "Sero Leather Africa",
            "user_action": "PAY_NOW",
        },
    }
    r = httpx.post(
        f"{BASE_URL}/v2/checkout/orders",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    r.raise_for_status()
    data         = r.json()
    approval_url = next(l["href"] for l in data["links"] if l["rel"] == "approve")
    return {"paypal_order_id": data["id"], "approval_url": approval_url}


def capture_order(paypal_order_id: str) -> dict:
    """
    Captures (charges) an approved PayPal order.
    Called from the return URL handler.
    """
    token = get_access_token()
    r = httpx.post(
        f"{BASE_URL}/v2/checkout/orders/{paypal_order_id}/capture",
        headers={
            "Authorization":  f"Bearer {token}",
            "Content-Type":   "application/json",
        },
        timeout=15,
    )
    r.raise_for_status()
    return r.json()