# main.py
# ─────────────────────────────────────────────
#  Entry point.  Run with:
#      python main.py
#  Then open:
#      http://localhost:8000
# ─────────────────────────────────────────────

import os
import uvicorn
import os
import time
from collections             import defaultdict
from fastapi                 import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles     import StaticFiles
from fastapi.responses       import JSONResponse
from dotenv                  import load_dotenv

load_dotenv()

from app.router   import router as api_router
from app.frontend import router as frontend_router


# ── Rate limiting ────────────────────────────
_request_counts: dict = defaultdict(list)
RATE_LIMIT_ROUTES = {"/api/orders": (5, 60), "/api/upload": (20, 60)}

# ── App ───────────────────────────────────────
app = FastAPI(title="Storefront", docs_url="/docs", redoc_url=None)

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"]  = "nosniff"
    response.headers["X-Frame-Options"]         = "DENY"
    response.headers["X-XSS-Protection"]        = "1; mode=block"
    response.headers["Referrer-Policy"]         = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"]      = "geolocation=(), microphone=(), camera=()"
    return response

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    if path in RATE_LIMIT_ROUTES:
        ip  = request.client.host
        key = f"{ip}:{path}"
        limit, window = RATE_LIMIT_ROUTES[path]
        now = time.time()
        _request_counts[key] = [t for t in _request_counts[key] if now - t < window]
        if len(_request_counts[key]) >= limit:
            return JSONResponse(status_code=429, content={"detail": "Too many requests. Please slow down."})
        _request_counts[key].append(now)
    return await call_next(request)

# ── CORS ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "http://localhost:8000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Directories (auto-create) ─────────────────
os.makedirs("uploads", exist_ok=True)
os.makedirs("static",  exist_ok=True)

# ── Static mounts ─────────────────────────────
#   /uploads  →  uploaded product images
#   /static   →  logo, images, any local assets
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/static",  StaticFiles(directory="static"),  name="static")

# ── Routers ───────────────────────────────────
#   /api/*  →  all API endpoints  (must be first)
#   /*      →  frontend HTML pages
app.include_router(api_router,      prefix="/api")
app.include_router(frontend_router)


# ── Boot ──────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)