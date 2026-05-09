# app/payments/pesapal.py

import os
import httpx

CONSUMER_KEY    = os.getenv("PESAPAL_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("PESAPAL_CONSUMER_SECRET")
ENVIRONMENT     = os.getenv("PESAPAL_ENVIRONMENT", "sandbox")
IPN_URL         = os.getenv("PESAPAL_IPN_URL")
REDIRECT_URL    = os.getenv("PESAPAL_REDIRECT_URL")

BASE_URL = (
    "https://cybqa.pesapal.com/pesapalv3"
    if ENVIRONMENT == "sandbox"
    else "https://pay.pesapal.com/v3"
)


def get_access_token() -> str:
    r = httpx.post(
        f"{BASE_URL}/api/Auth/RequestToken",
        json={"consumer_key": CONSUMER_KEY, "consumer_secret": CONSUMER_SECRET},
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()["token"]


def register_ipn(token: str) -> str:
    """Register IPN URL and return ipn_id. Do this once, store the id."""
    r = httpx.post(
        f"{BASE_URL}/api/URLSetup/RegisterIPN",
        json={"url": IPN_URL, "ipn_notification_type": "POST"},
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()["ipn_id"]


def submit_order(token: str, ipn_id: str, order_id: int, amount: float, phone: str, email: str, name: str) -> dict:
    """
    Submits order to Pesapal and returns the redirect URL
    the customer is sent to for payment.
    """
    first, *rest = name.strip().split(" ", 1)
    last = rest[0] if rest else first

    r = httpx.post(
        f"{BASE_URL}/api/Transactions/SubmitOrderRequest",
        json={
            "id":                str(order_id),
            "currency":          "KES",
            "amount":            amount,
            "description":       f"Sero Leather Order #{order_id}",
            "callback_url":      REDIRECT_URL,
            "notification_id":   ipn_id,
            "billing_address": {
                "phone_number":  phone,
                "email_address": email or "",
                "first_name":    first,
                "last_name":     last,
            },
        },
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=15,
    )
    r.raise_for_status()
    data = r.json()
    return {
        "order_tracking_id": data["order_tracking_id"],
        "redirect_url":      data["redirect_url"],
    }


def get_transaction_status(token: str, order_tracking_id: str) -> dict:
    r = httpx.get(
        f"{BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId={order_tracking_id}",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()