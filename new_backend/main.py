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
    from database import SessionLocal
    from sqlalchemy import text
    db = SessionLocal()
    db.execute(text("UPDATE product SET slug = lower(slug)"))
    db.commit()
    db.close()
    asyncio.create_task(rate_refresh_loop())
    yield

app = FastAPI(lifespan=lifespan)

from starlette.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["sero-leather-africa-2-production.up.railway.app"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seroafrica.com", "https://www.seroafrica.com", "https://sero-leather-africa-fe-production.up.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
# ── security middleware ──────────────────────────────────────────────────────
from starlette.responses import JSONResponse

MAX_BODY_SIZE = 10 * 1024 * 1024  # 10MB

@app.middleware("http")
async def limit_body_size(request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(status_code=413, content={"detail": "Request body too large."})
    return await call_next(request)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return response
