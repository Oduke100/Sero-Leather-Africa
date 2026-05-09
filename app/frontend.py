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
from fastapi.responses import HTMLResponse, Response

router = APIRouter()

STATIC = os.path.join(os.path.dirname(__file__), "..", "static")


def _html(filename: str) -> HTMLResponse:
    path = os.path.join(STATIC, filename)
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return HTMLResponse(f.read())


@router.get("/", response_class=HTMLResponse)
def serve_index():
    return _html("index.html")


@router.get("/products", response_class=HTMLResponse)
def serve_products():
    return _html("products.html")


@router.get("/about", response_class=HTMLResponse)
def serve_about():
    return _html("about.html")


@router.get("/cart", response_class=HTMLResponse)
def serve_cart():
    return _html("cart.html")


@router.get("/product", response_class=HTMLResponse)
def serve_product_detail():
    return _html("product_detail.html")


@router.get("/admin", response_class=HTMLResponse)
def serve_admin():
    return _html("admin.html")


@router.get("/static/js/config.js")
def serve_config():
    content = f"""window.SERO_CONFIG = {{
    email:           "{os.getenv('SERO_EMAIL',        'seroleatherafrica@gmail.com')}",
    phone:           "{os.getenv('SERO_PHONE',        '+254 729 319 983')}",
    location:        "{os.getenv('SERO_LOCATION',     'Nairobi, Kenya')}",
    facebook:        "{os.getenv('SERO_FACEBOOK',     '')}",
    instagram:       "{os.getenv('SERO_INSTAGRAM',    '')}",
    whatsapp:        "{os.getenv('SERO_WHATSAPP',     '')}",
    tiktok:          "{os.getenv('SERO_TIKTOK',       '')}",
    logoDark:        "{os.getenv('SERO_LOGO_DARK',    '/static/images/logo1.webp')}",
    logoLight:       "{os.getenv('SERO_LOGO_LIGHT',   '/static/images/logo2.webp')}",
    imgAbout:        "{os.getenv('SERO_IMG_ABOUT',    '/static/images/sero_about_page.webp')}",
    imgIndex:        "{os.getenv('SERO_IMG_INDEX',    '/static/images/sero_index_page.webp')}",
    imgHero:         "{os.getenv('SERO_IMG_HERO',     '/static/gallery/landing_page.webp')}",
    heroUnsplash:    "{os.getenv('SERO_HERO_UNSPLASH','https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1920&auto=format&fit=crop&q=60')}",
    fallbackImg:     "{os.getenv('SERO_FALLBACK_IMG', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop')}",
    tailwindUrl:     "{os.getenv('SERO_TAILWIND_URL', 'https://cdn.tailwindcss.com/3.4.1')}",
    lucideUrl:       "{os.getenv('SERO_LUCIDE_URL',   'https://unpkg.com/lucide@0.441.0/dist/umd/lucide.min.js')}",
    fontUrl:         "{os.getenv('SERO_FONT_URL',     'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,600&family=Jost:wght@200;300;400;500;600&display=swap')}",
    fontDisplay:     "{os.getenv('SERO_FONT_DISPLAY', 'Cormorant Garamond')}",
    fontBody:        "{os.getenv('SERO_FONT_BODY',    'Jost')}",
    brandName:       "{os.getenv('SERO_BRAND_NAME',   'Sero Leather Africa')}",
    brandTagline:    "{os.getenv('SERO_BRAND_TAGLINE','Carry The Spirit Of Africa')}",
    brandSub:        "{os.getenv('SERO_BRAND_SUB',    'Africa')}",
    description:     "{os.getenv('SERO_BRAND_DESCRIPTION', 'Premium handcrafted leather goods from Nairobi, Kenya.')}",
    copyrightYear:   "{os.getenv('SERO_COPYRIGHT_YEAR','2026')}",
    apiBase:         "{os.getenv('SERO_API_BASE',     '/api')}",
}};"""
    return Response(content=content, media_type="application/javascript")
