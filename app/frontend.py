# app/frontend.py
# ─────────────────────────────────────────────
#  Serves all frontend HTML pages at clean URLs.
#  Registered in main.py AFTER the API router
#  so /api/* routes are never caught here.
#
#  Routes:
#      /              → index.html
#      /products      → products.html
#      /about         → about.html
#      /cart          → cart.html
#      /product       → product-detail.html  (?id=N)
#      /admin         → admin.html
# ─────────────────────────────────────────────

import os
from fastapi           import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter()

STATIC = os.path.join(os.path.dirname(__file__), "..", "static")


def _html(filename: str) -> HTMLResponse:
    path = os.path.join(STATIC, filename)
    with open(path, "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())


@router.get("/",        response_class=HTMLResponse)
def serve_index():
    return _html("index.html")


@router.get("/products", response_class=HTMLResponse)
def serve_products():
    return _html("products.html")


@router.get("/about",   response_class=HTMLResponse)
def serve_about():
    return _html("about.html")


@router.get("/cart",    response_class=HTMLResponse)
def serve_cart():
    return _html("cart.html")


@router.get("/product", response_class=HTMLResponse)
def serve_product_detail():
    return _html("product_detail.html")


@router.get("/admin",   response_class=HTMLResponse)
def serve_admin():
    return _html("admin.html")