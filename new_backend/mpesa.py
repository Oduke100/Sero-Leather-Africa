import os, base64, httpx
from datetime import datetime

# ── config ────────────────────────────────────────────────────────────────────
CONSUMER_KEY    = os.getenv("MPESA_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
SHORTCODE       = os.getenv("MPESA_SHORTCODE")
PASSKEY         = os.getenv("MPESA_PASSKEY")
CALLBACK_URL    = os.getenv("MPESA_CALLBACK_URL")
BASE_URL        = os.getenv("MPESA_BASE_URL", "https://sandbox.safaricom.co.ke")

# ── auth ──────────────────────────────────────────────────────────────────────
def get_access_token() -> str:
    creds = base64.b64encode(f"{CONSUMER_KEY}:{CONSUMER_SECRET}".encode()).decode()
    r = httpx.get(
        f"{BASE_URL}/oauth/v1/generate?grant_type=client_credentials",
        headers={"Authorization": f"Basic {creds}"}, timeout=10
    )
    r.raise_for_status()
    return r.json()["access_token"]

# ── stk push ──────────────────────────────────────────────────────────────────
def initiate_stk_push(phone: str, amount: int, merchant_reference: str) -> dict:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password  = base64.b64encode(f"{SHORTCODE}{PASSKEY}{timestamp}".encode()).decode()
    r = httpx.post(
        f"{BASE_URL}/mpesa/stkpush/v1/processrequest",
        json={
            "BusinessShortCode": SHORTCODE,
            "Password":          password,
            "Timestamp":         timestamp,
            "TransactionType":   "CustomerPayBillOnline",
            "Amount":            amount,
            "PartyA":            phone,
            "PartyB":            SHORTCODE,
            "PhoneNumber":       phone,
            "CallBackURL":       CALLBACK_URL,
            "AccountReference":  merchant_reference,
            "TransactionDesc":   "Sero Leather Order",
        },
        headers={"Authorization": f"Bearer {get_access_token()}"}, timeout=10
    )
    r.raise_for_status()
    return r.json()