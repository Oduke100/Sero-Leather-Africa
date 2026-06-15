from dotenv import load_dotenv
load_dotenv()

import os, requests
from decimal import Decimal
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio

from router import router
from database import SessionLocal
from models import Currency

RATES_URL = "https://open.er-api.com/v6/latest/KES"

def refresh_rates():
    db = SessionLocal()
    try:
        resp = requests.get(RATES_URL, timeout=10)
        data = resp.json()
        if data.get("result") != "success":
            print("Rate refresh failed:", data)
            return
        rates = data["rates"]
        currencies = db.query(Currency).filter(Currency.is_active == True).all()
        for c in currencies:
            code = c.code.upper()
            if code in rates:
                # API returns how many units of foreign currency = 1 KES
                # We store rate_to_kes = how many KES = 1 unit of foreign currency? No.
                # open.er-api with base KES: rates["USD"] = X means 1 KES = X USD
                # So to convert KES -> USD: amount * rates["USD"]
                c.rate_to_kes = Decimal(str(rates[code]))
                c.last_updated = datetime.now(timezone.utc)
        db.commit()
        print(f"[{datetime.now()}] Exchange rates refreshed.")
    except Exception as e:
        print(f"Rate refresh error: {e}")
    finally:
        db.close()

async def rate_refresh_loop():
    while True:
        refresh_rates()
        await asyncio.sleep(86400)  # 24 hours

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
