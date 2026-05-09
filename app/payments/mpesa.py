# app/payments/mpesa.py

import os
import base64
import httpx
from datetime import datetime


CONSUMER_KEY    = os.getenv("MPESA_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
SHORTCODE       = os.getenv("MPESA_SHORTCODE")
PASSKEY         = os.getenv("MPESA_PASSKEY")
CALLBACK_URL    = os.getenv("MPESA_CALLBACK_URL")
BASE_URL        = "https://sandbox.safaricom.co.ke"  # swap to live when ready


def get_access_token() -> str:
    credentials = base64.b64encode(f"{CONSUMER_KEY}:{CONSUMER_SECRET}".encode()).decode()
    r = httpx.get(
        f"{BASE_URL}/oauth/v1/generate?grant_type=client_credentials",
        headers={"Authorization": f"Basic {credentials}"},
        timeout=10,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def get_password_and_timestamp():
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    raw       = f"{SHORTCODE}{PASSKEY}{timestamp}"
    password  = base64.b64encode(raw.encode()).decode()
    return password, timestamp


def stk_push(phone: str, amount: float, order_id: int) -> dict:
    """
    Sends STK push to the customer's phone.
    Phone must be in format 2547XXXXXXXX.
    Returns the Daraja API response dict.
    """
    token               = get_access_token()
    password, timestamp = get_password_and_timestamp()

    # Normalize phone: strip leading 0, add 254
    phone = phone.strip().replace(" ", "")
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    elif phone.startswith("+"):
        phone = phone[1:]

    payload = {
        "BusinessShortCode": SHORTCODE,
        "Password":          password,
        "Timestamp":         timestamp,
        "TransactionType":   "CustomerPayBillOnline",
        "Amount":            int(amount),
        "PartyA":            phone,
        "PartyB":            SHORTCODE,
        "PhoneNumber":       phone,
        "CallBackURL":       CALLBACK_URL,
        "AccountReference":  f"SeroOrder{order_id}",
        "TransactionDesc":   f"Sero Leather Order #{order_id}",
    }

    r = httpx.post(
        f"{BASE_URL}/mpesa/stkpush/v1/processrequest",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()