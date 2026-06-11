# DEVLOGAI — Sero Leather Africa Frontend (V2)

## Project Overview
This is the second iteration of the Sero Leather Africa frontend.
V1 was scrapped — static HTML with vanilla JS, deemed too amateur for a production storefront.
V2 is a clean React + Vite + TypeScript rebuild. The visual design is preserved exactly. The architecture is replaced entirely.

---

## Stack
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Routing**: react-router-dom
- **Icons**: lucide-react
- **Fonts**: Google Fonts (Cormorant Garamond + Jost) — loaded via @import in index.css
- **Styling**: Inline styles + CSS custom properties (no Tailwind, no CSS modules)
- **Package Manager**: npm
- **Dev Server**: `npm run dev`

---

## Project Location

    ~/work/Sero-Leather-Africa-2/new_frontend/

Scaffolded with:

    npm create vite@latest new_frontend -- --template react-ts

---

## Project Structure

    new_frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── package.json
    ├── src/
    │   ├── main.tsx                   ← mounts app, no router here
    │   ├── App.tsx                    ← BrowserRouter + CurrencyProvider + route definitions
    │   ├── index.css                  ← design tokens, reset, grain, cursor, scrollbar
    │   ├── context/
    │   │   └── CurrencyContext.tsx    ← currency state, convertPrice, useCurrency hook
    │   ├── components/
    │   │   ├── Cursor.tsx             ← dot + ring cursor, MutationObserver for hover binding
    │   │   ├── Navbar.tsx             ← logo, nav links, currency select, cart icon
    │   │   ├── Footer.tsx             ← brand, nav, contact, payment logos, kente strip
    │   │   └── Layout.tsx             ← wraps Cursor + Navbar + {children} + Footer
    │   └── pages/
    │       ├── Home.tsx               ← full landing page
    │       └── ComingSoon.tsx         ← placeholder for all unbuilt pages

---

## Environment Variables

No `.env` file yet. Backend API base URL is currently hardcoded in `Home.tsx`:

    const API = 'http://localhost:8000';

Before shipping, this moves to a `.env` file:

    VITE_API_BASE=http://localhost:8000

And is read as:

    const API = import.meta.env.VITE_API_BASE;

---

## Design Tokens (index.css)

Single source of truth. All color values live here, nowhere else.

| Token | Value | Usage |
|---|---|---|
| --dust | #E8C99A | Warm accent, hero italic |
| --ember | #C15C3D | Primary CTA, sale badges |
| --bark | #2C1E16 | Card backgrounds, brand strip |
| --savannah | #D4A847 | Gold accent, labels, scrollbar |
| --dusk | #8B5E3C | Placeholder gradients |
| --midnight | #1A0F08 | Page background |
| --bone | #F5EDD8 | Primary text |
| --smoke | rgba(26,15,8,0.7) | Overlays |

---

## Routing (App.tsx)

| Path | Component | Layout |
|---|---|---|
| / | Home | Layout (Navbar + Footer) |
| /coming-soon | ComingSoon | None — standalone page |
| * | ComingSoon | None — catch-all |

All buttons linking to unbuilt pages call `navigate('/coming-soon')`.

---

## Components

### Cursor.tsx
Custom mouse cursor — a dot (12px, savannah) and a lagging ring (40px, border only).
Uses `useRef` + `useEffect` + `window.addEventListener('mousemove')`.
MutationObserver watches for new DOM nodes and binds the expand class to all `a`, `button`, and `[data-cursor]` elements.
Hidden on mobile via CSS (`display: none` at max-width 768px).

### Navbar.tsx
Fixed position, top of viewport, z-index 1000.
Gradient fades from `rgba(26,15,8,0.95)` at top to transparent — does not block page content.
Left: SERO wordmark + "Leather Africa" subtitle as a `<Link to="/">`.
Center: nav links array mapped to `<Link>` — active state highlights in `--savannah` (skips `/coming-soon` to avoid every link lighting up).
Right: currency `<select>` wired to `useCurrency()` + `<ShoppingBag>` icon linking to `/coming-soon`.

**Nav links (current)**:
| Label | Route |
|---|---|
| Home | / |
| Collections | /coming-soon |
| About | /coming-soon |
| Contact | /coming-soon |

### Footer.tsx
Four-column grid: brand + socials / navigation / contact / payment logos.
Topped by a 4px kente-pattern strip (repeating CSS gradient in ember, savannah, bark, dusk).
Payment logos pulled from Wikimedia CDN as `<img>` tags. Rendered with `filter: brightness(0) invert(1)` at 0.6 opacity — makes any color logo render consistently on dark background.

**Payment methods displayed**:
- M-Pesa
- Visa
- Mastercard
- PayPal

### Layout.tsx
Thin wrapper. Applies `className="grain"` to the root div (triggers the CSS noise overlay).
Renders: `<Cursor />` → `<Navbar />` → `{children}` → `<Footer />`.
Every page that uses the standard shell is wrapped in this — currently only `Home`.
`ComingSoon` is intentionally outside Layout (no navbar/footer on placeholder pages).

---

## Context

### CurrencyContext.tsx
Replaces `currency.js` from V1 entirely.

Supported currencies: KES, USD, EUR, GBP, CAD, AUD, INR, AED, ZAR, NGN.
Rates are hardcoded — no live rate fetch yet.
Active currency persisted to `localStorage` under key `sero-currency`.
`convertPrice(kes: number)` — takes a KES base price, returns a formatted string in the active currency.
Pricing convention: `Math.floor(converted) + 0.99` — psychological pricing preserved across all currencies.
High-value currencies (KES, NGN, INR, ZAR) get `toLocaleString()`. Others get `toFixed(2)`.

**Hook**: `useCurrency()` — throws if called outside `<CurrencyProvider>`.

---

## Pages

### Home.tsx
Full landing page. Fetches from backend on mount via `Promise.all` — categories and products in parallel.
Falls back to placeholder UI (gradient cards) if backend is offline. Falls back to skeleton shimmer while loading.

**Sections in order**:
| Section | Source |
|---|---|
| Hero | Static — Unsplash image, "Carry The Spirit" headline |
| Categories | GET /categories |
| Featured Products | GET /products (first 8) |
| Brand Strip | Static copy |

Discount logic: `calcFinal(price, discount_percentage)` — mirrors backend calculation. Discounted price is never stored, always computed.
All prices run through `convertPrice()` — currency switcher in Navbar affects them live.

### ComingSoon.tsx
Standalone page, no Layout wrapper.
Shows SERO wordmark, decorative gold rule, italic copy, and a back button (`navigate(-1)`).
Kente strip fixed to top of viewport.
Used as the target for every button/link that leads to an unbuilt page.

---

## V1 → V2 Migration Map

| V1 (HTML/JS) | V2 (React/TS) |
|---|---|
| 6 `.html` files | 6 routes (pages in progress) |
| Copy-pasted navbar/footer | Single `Navbar.tsx` + `Footer.tsx` |
| `currency.js` + `window.seroRefreshPrices()` | `CurrencyContext.tsx` + `useCurrency()` |
| `config.js` served by BE | `.env` + `import.meta.env.VITE_*` |
| `<script>` tags per page | Component-scoped hooks |
| Hardcoded product HTML | Dynamic fetch from FastAPI |
| Frontend-only admin password check | JWT gated routes (pending) |
| CSS tokens duplicated in every file | Single `index.css` |

---

## Pages Status

| Page | Route | Status |
|---|---|---|
| Landing | / | ✅ Done |
| Products | /products | ⬜ Not started |
| Product Detail | /products/:slug | ⬜ Not started |
| Cart | /cart | ⬜ Not started |
| About | /about | ⬜ Not started |
| Admin | /admin | ⬜ Not started |
| Coming Soon | /coming-soon | ✅ Done |

---

## Code Editing Convention
**ALL CODE IS WRITTEN IN CHAT. No files are created as downloadable artifacts. Every component, hook, or patch is written directly in the chat for the dev to copy.**

**Single line change**: use sed

    sed -i 's/old text/new text/' src/components/Example.tsx

**Block/multi-line change**: save to /tmp/ then run with node or a shell heredoc.

---

## Known Issues / Notes

| Issue | Notes |
|---|---|
| API base URL hardcoded | Move to `.env` before shipping |
| Currency rates static | No live rate API yet — rates are hardcoded approximations |
| `updated_at` trigger not yet in BE | Not a FE concern but affects data freshness |
| No auth on admin route | `/admin` route not built yet |
| Cart state not implemented | No cart context exists yet |
| Images on cards use backend `image_url` | No fallback if URL is broken |

---

## Pre-Ship Checklist
- [ ] Move `API` base URL to `.env`
- [ ] Build `/products` page
- [ ] Build `/products/:slug` product detail page
- [ ] Build `/cart` page with cart context
- [ ] Build `/about` page
- [ ] Build `/admin` page with JWT auth gate
- [ ] Live currency rate API or scheduled rate refresh
- [ ] Mobile responsive pass (navbar collapse, grid breakpoints)
- [ ] Fallback image handling on product/category cards
- [ ] CORS confirmed working with backend
- [ ] Replace all `/coming-soon` links with real routes as pages are completed