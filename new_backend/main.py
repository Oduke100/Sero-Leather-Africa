from dotenv import load_dotenv
load_dotenv()

import os, asyncio, requests
from decimal import Decimal
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from router import router
from database import SessionLocal
from models import Currency

# ── rate refresh ──────────────────────────────────────────────────────────────
RATES_URL = "https://open.er-api.com/v6/latest/KES"

def refresh_rates():
    db = SessionLocal()
    try:
        data = requests.get(RATES_URL, timeout=10).json()
        if data.get("result") != "success":
            print("Rate refresh failed:", data)
            return
        rates = data["rates"]
        for c in db.query(Currency).filter(Currency.is_active == True).all():
            code = c.code.upper()
            if code in rates:
                c.rate_to_kes = Decimal(str(rates[code]))
                c.last_updated = datetime.now(timezone.utc)
        db.commit()
        print(f"[{datetime.now()}] Rates refreshed.")
    except Exception as e:
        print(f"Rate refresh error: {e}")
    finally:
        db.close()

async def rate_refresh_loop():
    while True:
        refresh_rates()
        await asyncio.sleep(86400)

# ── app ───────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(rate_refresh_loop())
    yield

app = FastAPI(lifespan=lifespan)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")