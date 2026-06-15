# DEVLOGAI — Sero Leather Africa Frontend (V2)

## Project Overview
React + Vite + TypeScript storefront for Sero Leather Africa. V1 (static HTML/vanilla JS) was scrapped. V2 is a full rebuild — same visual design, new architecture. Every page is built and functional. The frontend talks to a FastAPI backend over HTTP.

---

## Stack
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Routing**: react-router-dom v6
- **Icons**: lucide-react (used selectively; most icons are inline SVG)
- **Fonts**: @fontsource/cormorant-garamond (300/300i/400/600/700) + @fontsource/jost (200–600) — loaded in main.tsx, not via CDN
- **Styling**: Global CSS (index.css) + inline styles. No Tailwind, no CSS modules.
- **State**: React Context (Currency, Cart, HeroSlider)
- **Package Manager**: npm
- **Dev Server**: `npm run dev`

---

## Project Location

    ~/work/Sero-Leather-Africa-2/new_frontend/

---

## Project Structure

    new_frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
    ├── package.json / package-lock.json
    ├── src/
    │   ├── main.tsx                    ← font imports, StrictMode mount
    │   ├── App.tsx                     ← all providers + BrowserRouter + route table
    │   ├── App.css                     ← Vite boilerplate (not used by the actual UI)
    │   ├── index.css                   ← design tokens, reset, all component CSS
    │   ├── config.ts                   ← SOCIAL and CONTACT constants
    │   ├── api/
    │   │   └── index.ts                ← all fetch helpers + TypeScript types
    │   ├── context/
    │   │   ├── CurrencyContext.tsx     ← currency state + convertPrice + useCurrency
    │   │   ├── CartContext.tsx         ← cart state + addItem/removeItem/updateQty
    │   │   └── HeroSliderContext.tsx   ← hero image slideshow state
    │   ├── components/
    │   │   ├── Cursor.tsx              ← custom dot + ring cursor
    │   │   ├── Navbar.tsx              ← sticky nav, cart badge, currency select, mobile menu
    │   │   ├── Footer.tsx              ← 3-col grid, socials, payment badges, ankara band
    │   │   ├── Layout.tsx              ← Navbar + {children} + Footer + toast div
    │   │   └── ScrollToTop.tsx         ← scrolls to top on route change
    │   └── pages/
    │       ├── Home.tsx                ← Hero, Ticker, Categories, Stats, Story, USP, Newsletter
    │       ├── About.tsx               ← Hero, Ticker, Origin Story, Stats, Values, CTA
    │       ├── Collections.tsx         ← category grid, fetches GET /categories
    │       ├── CollectionDetail.tsx    ← product grid filtered by category slug, search + sort
    │       ├── Products.tsx            ← all products, search + sort bar
    │       ├── ProductDetail.tsx       ← single product, qty picker, add to bag, trust tiles
    │       ├── Cart.tsx                ← bag items, qty controls, order summary sidebar
    │       ├── Checkout.tsx            ← customer details form, M-Pesa / PayPal selection
    │       ├── PayPalReturn.tsx        ← PayPal capture handler after redirect back
    │       ├── OrderConfirmation.tsx   ← payment status poller (3s interval, 40 polls max)
    │       ├── AdminLogin.tsx          ← split-screen login, 5-attempt lockout, 60s cooldown
    │       ├── AdminDashboard.tsx      ← 4-tab admin panel: Inventory / Orders / Categories / Currencies
    │       └── ComingSoon.tsx          ← standalone fallback, no Layout wrapper

---

## Environment Variables

    VITE_API_BASE=http://localhost:8000/api

Read as `import.meta.env.VITE_API_BASE` throughout. Falls back to `http://${window.location.hostname}:8000/api` when not set. The raw `API_BASE` (without `/api`) is derived in pages that need image URLs by stripping `/api` from the env var.

---

## Design Tokens (index.css)

Single source of truth. Nothing is hardcoded in components (except AdminDashboard and AdminLogin which use inline styles for isolation).

### Storefront tokens
| Token | Value | Usage |
|---|---|---|
| --dust | #E8C99A | Warm accent |
| --ember | #C15C3D | Primary CTA fill, sale badges |
| --bark | #2C1E16 | Card backgrounds, footer, USP band |
| --savannah | #D4A847 | Gold — prices, active links, scrollbar, borders |
| --dusk | #8B5E3C | Cursor color, placeholder gradients |
| --midnight | #1A0F08 | Page background |
| --bone | #F5EDD8 | Primary text |
| --smoke | rgba(26,15,8,0.7) | Overlays |
| --hero-image | url("/landing_page.webp") | Hero BG, products/cart hero BG |

### Admin tokens (separate namespace, same :root)
`--adm-void`, `--adm-surface`, `--adm-card`, `--adm-border`, `--adm-gold`, `--adm-gold2`, `--adm-ember`, `--adm-text`, `--adm-muted`, `--adm-dim`, `--adm-green`, `--adm-red`, `--adm-amber`

---

## Routing (App.tsx)

Provider order (outer → inner): `HeroSliderProvider` → `CurrencyProvider` → `CartProvider` → `BrowserRouter`

`ScrollToTop` and `Cursor` are rendered inside BrowserRouter, outside Routes.

Admin routes are lazy-loaded via `React.lazy` + `Suspense`.

| Path | Component | Layout wrapper |
|---|---|---|
| / | Home | Layout |
| /about | About | Layout |
| /collections | Collections | Layout |
| /products | Collections (same component) | Layout |
| /collections/:slug | CollectionDetail | Layout |
| /product/:id | ProductDetail | Layout |
| /cart | Cart | Layout |
| /checkout | Checkout | Layout |
| /checkout/paypal-return | PayPalReturn | Layout |
| /order-confirmation/:orderId | OrderConfirmation | None — standalone |
| /coming-soon | ComingSoon | None — standalone |
| /admin/login | AdminLogin (lazy) | None — standalone |
| /admin | AdminDashboard (lazy) | None — standalone |
| * | ComingSoon | None |

---

## Components

### Cursor.tsx
Dot (12px, `--dusk`) + lagging ring (40px, border only). Expands on hover over `a`, `button`, `[data-cursor]`. Hidden on mobile (`max-width: 768px`). Body sets `cursor: none` globally; mobile resets to `cursor: auto`.

### Navbar.tsx
Sticky top, z-index 1000. Transparent until scroll, then `rgba(26,15,8,0.95)` + blur via `.scrolled` class. Left: logo image (`/logo2.webp`). Center: nav links. Right: currency `<select>` + cart icon with badge (count from CartContext). Active link detection skips `/coming-soon`. Mobile: hamburger button toggles `.mobile-menu.open` slide-in panel with large Cormorant Garamond links.

### Footer.tsx
3-column grid: brand + copy / navigation / contact. Topped by an ankara band (green palette — distinct from the storefront kente). Payment badges (M-Pesa, PayPal, PesaPal) as styled `<span>` elements. Social icon links from `config.ts`. `SOCIAL` and `CONTACT` constants imported from `src/config.ts`.

### Layout.tsx
Renders `<Navbar />` → `{children}` → `<Footer />`. Also renders the `#toast` div used by `showToast()` imperatively across pages.

### ScrollToTop.tsx
`useEffect` on location pathname, calls `window.scrollTo(0,0)`.

---

## Context

### CurrencyContext.tsx
Currencies: KES, USD, EUR, GBP, CAD, AUD, INR, AED, ZAR, NGN. Rates hardcoded (no live fetch). Active currency persisted to `localStorage` key `sero-currency`. `convertPrice(kes: number)` → formatted string in active currency. Psychological pricing: `Math.floor(converted) + 0.99`. High-value currencies (KES, NGN, INR, ZAR) use `toLocaleString()`. `useCurrency()` throws if used outside provider.

### CartContext.tsx
Cart items in React state. Each item: `{ product_id, name, price, image, quantity, variant_id? }`. Methods: `addItem`, `removeItem(product_id, variant_id)`, `updateQty(product_id, variant_id, qty)` — removes item if qty drops to 0. `totalPrice` computed as `items.reduce(...)`. `clearCart()` called after successful order.

### HeroSliderContext.tsx
Manages hero background image cycling. Currently referenced in App.tsx — used in Hero component for slide transitions.

---

## API Layer (api/index.ts)

All fetch calls live here. Base URL: `import.meta.env.VITE_API_BASE`. Auth token pulled from `sessionStorage.getItem('sero_admin_token')` and sent as `Authorization: Bearer <token>` on admin calls.

**Types exported**: `Category`, `CategoryDetail`, `Product`, `AdminProductDetail`, `Order`, `OrderStatusResponse`, `Currency`

**Functions**:
| Function | Method + Endpoint | Auth |
|---|---|---|
| `getCategories()` | GET /categories | No |
| `getCategoryDetail(id)` | GET /admin/categories/{id}/detail | Yes |
| `createCategory(data)` | POST /new-category | Yes |
| `updateCategory(id, data)` | PATCH /admin/categories/{id} | Yes |
| `deleteCategory(id)` | DELETE /admin/categories/{id} | Yes |
| `getProducts()` | GET /products | No |
| `getProduct(id)` | GET /products/{id} | No |
| `getProductsByCategory(slug)` | GET /collections/{slug}/products | No |
| `getAdminProducts()` | GET /admin/products | Yes |
| `getAdminProductDetail(id)` | GET /admin/products/{id} | Yes |
| `createProduct(data)` | POST /new-product | Yes |
| `updateAdminProduct(id, data)` | PATCH /admin/products/{id} | Yes |
| `deleteAdminProduct(id)` | DELETE /admin/products/{id} | Yes |
| `toggleProduct(id, active)` | PATCH /admin/products/{id} | Yes |
| `createOrder(data)` | POST /orders | No |
| `getOrderStatus(id)` | GET /orders/{id}/status | No |
| `getOrders()` | GET /admin/orders | Yes |
| `updateOrderStatus(id, status)` | PUT /admin/orders/{id} | Yes |
| `getCurrencies()` | GET /currencies | No |
| `addCurrency(code, name)` | POST /admin/currencies | Yes |
| `removeCurrency(code)` | DELETE /admin/currencies/{code} | Yes |
| `adminLogin(u, p)` | POST /admin/login | No |
| `uploadImage(file)` | POST /upload | No |

---

## Pages

### Home.tsx
Sub-components: `Hero`, `Ticker`, `Categories`, `Stats`, `Story`, `WaveDivider`, `USP`, `Newsletter`. `Categories` fetches `GET /categories` on mount. Falls back to skeleton shimmer. Newsletter form is FE-only (no backend call) — sets `submitted` state + triggers toast. `showToast()` is a DOM imperative: grabs `#toast` by ID, adds `.show`, removes after 3.5s.

### About.tsx
Static data only — no API calls. `TICKER`, `STATS`, `VALUES` are hardcoded arrays. Uses `useReveal()` hook (IntersectionObserver on `.reveal` / `.reveal-left` / `.reveal-right`). Story image: `/sero_about_page.webp` with Unsplash fallback on error.

### Collections.tsx
Fetches `GET /categories`. Displays category cards with image + name + desc. Click navigates to `/collections/:slug`. Skeleton grid while loading.

### CollectionDetail.tsx
Reads `slug` from `useParams`. Parallel fetch: `getProductsByCategory(slug)` + `getCategories()` (to get category metadata for the hero). Filter bar: text search (client-side) + sort by price. `showToast()` on add to cart. `ProductCard` sub-component shared in style with `Products.tsx`.

### Products.tsx
Fetches all products (`GET /products`). Same filter bar pattern as CollectionDetail. Client-side search + sort. `ProductCard` sub-component (same shape as CollectionDetail's).

**Note**: `/products` route renders `Collections` (category grid), not `Products`. `Products.tsx` is the component actually rendered when navigating to a collection. The naming is slightly inverted from the route table — `Products.tsx` = all-products flat list, but it's not mounted on `/products`. Check `App.tsx` route table if confused.

### ProductDetail.tsx
Reads `id` from `useParams` (integer). Fetches `GET /products/{id}`. Quantity picker with min 1, max `product.qty`. Add to bag fires `addItem()` + toast. Trust tiles (4 static items). Breadcrumb: Home → Collections → product name. Sold-out state disables add button. Sets `document.title` on load.

### Cart.tsx
Reads from `CartContext`. Empty state with bag icon + CTA. Item list with image, name, unit price, qty controls, subtotal, remove button. Sidebar: order summary, checkout CTA, M-Pesa + PayPal payment badge row. Delivery listed as "On delivery" (not calculated).

### Checkout.tsx
Form fields: Full Name, Email, Phone, Delivery Address, Payment Method (radio: M-Pesa / PayPal). Phone normalized via `normalizePhone()` — strips non-digits, converts `0...` to `254...`. On submit: calls `createOrder()`. If PayPal: calls `/api/orders/{id}/paypal/create`, stores `orderId` in `sessionStorage('paypal_order_id')`, redirects to `approval_url`. If M-Pesa: clears cart, navigates to `/order-confirmation/{id}`. Empty cart guard renders early return.

### PayPalReturn.tsx
Reads `paypal_order_id` from sessionStorage. Calls `POST /orders/{id}/paypal/capture`. On success: clears sessionStorage key, clears cart, sets status to `'success'`, navigates to `/order-confirmation/{id}` after 1.5s. Three UI states: `processing`, `success`, `error`.

### OrderConfirmation.tsx
Polls `GET /orders/{id}/status` every 3s. Max 40 polls (~2 min). Stops on `paid` or `failed`. Four UI states: pending (spinner + pulse dot), paid (success icon + order detail rows), failed (X icon + retry CTA), timed out (warn icon). No Layout wrapper — standalone full-screen. Kente border fixed to bottom.

### AdminLogin.tsx
Split-screen: left = hero image with brand copy, right = login form. 5-attempt lockout → 60s countdown timer. Attempts/lockout state in `sessionStorage` (`sero_attempts`, `sero_locked`). On success: stores token in `sessionStorage('sero_admin_token')`, redirects to `/admin`. Show/hide password toggle. Redirects to `/admin` immediately if token already present. All styles inline (isolated from storefront CSS).

### AdminDashboard.tsx
4-tab panel: **Inventory** / **Orders** / **Categories** / **Currencies**. Auth guard on mount — redirects to `/admin/login` if no token in sessionStorage. All styles inline.

**Inventory tab**: Lists all products (including inactive). Add product form (inline, toggleable) with image upload (fires `POST /upload`, stores returned URL). Edit modal. Toggle active/inactive. Delete with confirm modal. Shows product thumbnail, name, price, stock, active status.

**Orders tab**: Lists all orders. Click opens order detail modal showing items + quantities + total. Status dropdown per order fires `PUT /admin/orders/{id}`. 

**Categories tab**: Lists categories. Add form with image upload. Edit modal. Delete with confirm modal (shows category name). Category detail panel available (shows products in category).

**Currencies tab**: Lists active currencies with code + name + rate. Add form (code + name only — rate managed by BE background task). Remove button per currency.

Toast notifications (`notify()`) for all CRUD operations. `useCallback` on data fetch functions.

### ComingSoon.tsx
Standalone, no Layout. Kente strip fixed to top. SERO wordmark, gold rule, italic copy, `navigate(-1)` back button.

---

## Styling Conventions

All storefront component CSS lives in `index.css` — zero CSS modules or styled-components. Admin pages (`AdminLogin.tsx`, `AdminDashboard.tsx`) use inline styles only to keep the dark admin palette fully isolated from the storefront palette.

Kente stripe: `repeating-linear-gradient(90deg, ember 0–20px, savannah 20–40px, bark 40–60px, #485c4f 60–80px, savannah 80–100px, ember 100–120px, dusk 120–140px)`. Reused across all pages as `.kente-border`. Thin variant (4px, 80px repeat) used in story section. Fixed variant (`.kente-fixed`) for ComingSoon top bar.

Ankara band (footer top): green palette repeating gradient — distinct from kente.

Scroll reveal: `.reveal`, `.reveal-left`, `.reveal-right` — opacity 0 + translateY/X, transition to visible via IntersectionObserver. Each page that needs it instantiates `useReveal()` locally (not a shared hook import — re-declared per file).

Skeleton shimmer: `.skeleton` class with `background-size: 200%` + `shimmer` keyframe animation.

Glass effect: `.glass` — `rgba(44,30,22,0.4)` + `backdrop-filter: blur(16px)` + gold border. Used on cart summary and checkout summary boxes.

---

## Image Conventions

Static assets in `new_frontend/public/`:
- `/landing_page.webp` — hero background (referenced via CSS `--hero-image` token)
- `/logo2.webp` — navbar logo
- `/sero_index_page.webp` — Home story section image
- `/sero_about_page.webp` — About story section image
- `/Landing_4.webp` — AdminLogin left panel background

Backend images: served from `http://{hostname}:8000/uploads/{uuid}.webp`. Pages derive `API_BASE` (without `/api`) and prepend it to `image_url` values from the API.

---

## Auth Flow (Admin)

1. `POST /admin/login` → JWT stored in `sessionStorage('sero_admin_token')`
2. All admin API calls send `Authorization: Bearer <token>` header
3. Dashboard checks token on mount, redirects to `/admin/login` if missing
4. Logout: removes token from sessionStorage, redirects
5. Single session enforced server-side — new login invalidates old token

---

## Page Status

| Page | Route | Status |
|---|---|---|
| Landing | / | ✅ Done |
| About | /about | ✅ Done |
| Collections | /collections + /products | ✅ Done |
| Collection Detail | /collections/:slug | ✅ Done |
| Product Detail | /product/:id | ✅ Done |
| Cart | /cart | ✅ Done |
| Checkout | /checkout | ✅ Done |
| PayPal Return | /checkout/paypal-return | ✅ Done |
| Order Confirmation | /order-confirmation/:orderId | ✅ Done |
| Admin Login | /admin/login | ✅ Done |
| Admin Dashboard | /admin | ✅ Done |
| Coming Soon | /coming-soon + * | ✅ Done |

All routes are built. No placeholders remain.

---

## Known Issues / Notes

| Issue | Notes |
|---|---|
| `/products` route renders `Collections.tsx` | Intentional — shows category grid. `Products.tsx` (flat product list) is not mounted on any route. Clarify with team if a flat all-products page is needed. |
| Currency rates hardcoded | No live rate fetch on FE — rates come from BE Currency table. FE CurrencyContext rates are a fallback only. |
| `useReveal()` re-declared per page | Not a shared import — copy-pasted in About, Cart, Collections, CollectionDetail, Products, ProductDetail, Home. Consistent behavior but not DRY. |
| `API_BASE` derived two ways | Some pages use `import.meta.env.VITE_API_BASE?.replace('/api', '')`, others use `` `http://${window.location.hostname}:8000` `` directly. Standardize before ship. |
| No route guard on `/admin` | AdminDashboard checks sessionStorage on mount and redirects — no React Router route guard wrapper. Works but not a protected Route component. |
| Cart not persisted | Cart state lives in React context only — clears on page refresh. No localStorage persistence. |
| Newsletter form is FE-only | Submit sets local state + toast. No backend call. |
| Mobile navbar | Hamburger shows/hides — links present. Currency selector has `.mobile-currency` variant. No mobile-specific layout testing documented. |
| `HeroSliderContext` | Exists and wraps the app. Hero in Home.tsx uses a `bgRef` + `loaded` class approach. Confirm slider context is actually wired to the Hero component. |

---

## Pre-Ship Checklist
- [ ] Confirm `VITE_API_BASE` is set in production `.env`
- [ ] Standardize `API_BASE` derivation (remove the `window.location.hostname` fallbacks)
- [ ] Decide if `/products` should show flat product list or keep as category grid
- [ ] Persist cart to `localStorage`
- [ ] Mobile responsive pass — test navbar collapse, grid breakpoints, checkout form
- [ ] Confirm `HeroSliderContext` is actually driving the Hero component
- [ ] Wire newsletter form to a backend endpoint or email service
- [ ] Add React Router protected route wrapper for `/admin`
- [ ] CORS confirmed working with production backend URL
- [ ] Replace all `window.location.hostname:8000` fallbacks with env var
- [ ] Fallback image handling — broken `image_url` from backend shows nothing currently

---

## Code Editing Convention
**ALL CODE WRITTEN IN CHAT. No file downloads.**

Single-line change:
```bash
sed -i 's/old/new/' src/pages/Example.tsx
```

Multi-line / block change: paste full replacement block in chat for copy.

Confirm changes with:
```bash
grep -n 'pattern' src/pages/Example.tsx
```

Section headers in code use `// ─── label ───` style.