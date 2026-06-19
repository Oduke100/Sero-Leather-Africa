import os, httpx

# ── config ────────────────────────────────────────────────────────────────────
CLIENT_ID     = os.getenv("PAYPAL_CLIENT_ID")
CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
BASE_URL      = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")
RETURN_URL    = os.getenv("PAYPAL_RETURN_URL")
CANCEL_URL    = os.getenv("PAYPAL_CANCEL_URL")

# ── auth ──────────────────────────────────────────────────────────────────────
def get_access_token() -> str:
    r = httpx.post(
        f"{BASE_URL}/v1/oauth2/token",
        data={"grant_type": "client_credentials"},
        auth=(CLIENT_ID, CLIENT_SECRET), timeout=10,
    )
    r.raise_for_status()
    return r.json()["access_token"]

# ── orders ────────────────────────────────────────────────────────────────────
def create_order(amount_usd: str, merchant_reference: str, return_url: str = None, cancel_url: str = None) -> dict:
    r = httpx.post(
        f"{BASE_URL}/v2/checkout/orders",
        json={
            "intent": "CAPTURE",
            "purchase_units": [{
                "reference_id": merchant_reference,
                "amount": {"currency_code": "USD", "value": amount_usd},
                "description": "Sero Leather Order",
            }],
            "application_context": {
                "return_url": return_url or RETURN_URL,
                "cancel_url": cancel_url or CANCEL_URL,
                "brand_name": "Sero Leather Africa",
                "user_action": "PAY_NOW",
            },
        },
        headers={"Authorization": f"Bearer {get_access_token()}"}, timeout=10,
    )
    r.raise_for_status()
    return r.json()

def capture_order(paypal_order_id: str) -> dict:
    r = httpx.post(
        f"{BASE_URL}/v2/checkout/orders/{paypal_order_id}/capture",
        timeout=10,
        headers={
            "Authorization": f"Bearer {get_access_token()}",
            "Content-Type":  "application/json",
        },
    )
    r.raise_for_status()
    return r.json()