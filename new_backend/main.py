from dotenv import load_dotenv
load_dotenv()

import os, asyncio, requests
from decimal import Decimal
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
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

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seroafrica.com", "https://www.seroafrica.com", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")