import os, httpx

CLIENT_ID     = os.getenv("PAYPAL_CLIENT_ID")
CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")
BASE_URL      = os.getenv("PAYPAL_BASE_URL", "https://api-m.sandbox.paypal.com")
RETURN_URL    = os.getenv("PAYPAL_RETURN_URL")
CANCEL_URL    = os.getenv("PAYPAL_CANCEL_URL")


def get_access_token() -> str:
    r = httpx.post(
        f"{BASE_URL}/v1/oauth2/token",
        data={"grant_type": "client_credentials"},
        auth=(CLIENT_ID, CLIENT_SECRET),
    )
    r.raise_for_status()
    return r.json()["access_token"]


def create_order(amount_usd: str, merchant_reference: str) -> dict:
    token = get_access_token()
    r = httpx.post(
        f"{BASE_URL}/v2/checkout/orders",
        json={
            "intent": "CAPTURE",
            "purchase_units": [{
                "reference_id": merchant_reference,
                "amount": {
                    "currency_code": "USD",
                    "value": amount_usd,
                },
                "description": "Sero Leather Order",
            }],
            "application_context": {
                "return_url": f"{RETURN_URL}",
                "cancel_url": f"{CANCEL_URL}",
                "brand_name": "Sero Leather Africa",
                "user_action": "PAY_NOW",
            },
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    return r.json()


def capture_order(paypal_order_id: str) -> dict:
    token = get_access_token()
    r = httpx.post(
        f"{BASE_URL}/v2/checkout/orders/{paypal_order_id}/capture",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type":  "application/json",
        },
    )
    r.raise_for_status()
    return r.json()
