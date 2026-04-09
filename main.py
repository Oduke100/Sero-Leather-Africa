# main.py
# ─────────────────────────────────────────────
#  Entry point.  Run with:
#      python main.py
#  Then open:
#      http://localhost:8000
# ─────────────────────────────────────────────

import os
import uvicorn
from fastapi                 import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles     import StaticFiles

from app.router   import router as api_router
from app.frontend import router as frontend_router


# ── App ───────────────────────────────────────
app = FastAPI(title="Storefront", docs_url="/docs", redoc_url=None)

# ── CORS ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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