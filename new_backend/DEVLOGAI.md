```markdown
# DEVLOGAI — Sero Leather Africa Backend (V2)

## Project Overview
Second iteration of the Sero Leather Africa backend. V1 was scrapped. V2 is a clean rebuild with proper structure, auth, payment integration, and multi-currency support.

The client is a leather goods producer/seller. Built with FastAPI + PostgreSQL + SQLAlchemy + Alembic.

---

## Stack
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Auth**: JWT (python-jose) + bcrypt (passlib)
- **Schema Validation**: Pydantic v2
- **Image Processing**: Pillow
- **HTTP Client**: httpx
- **Server**: Uvicorn
- **Virtual Environment**: morpheus (custom named venv)
- **Python Version**: 3.12

---

## Project Structure

    new_backend/
    ├── main.py
    ├── router.py
    ├── models.py
    ├── schemas.py
    ├── auth.py
    ├── currency.py
    ├── mpesa.py
    ├── paypal.py
    ├── database.py
    ├── dependancies.py        <- typo is intentional, do not rename
    ├── .env
    ├── alembic.ini
    ├── alembic/
    │   ├── env.py
    │   └── versions/
    │       ├── 93803e4d7376_initial_tables.py
    │       └── (trigger migration pending)
    ├── uploads/               <- auto-created on startup
    └── seed/
        └── seed_admin.py

---

## Environment Variables (.env)

    DATABASE_URL=postgresql://postgres:sero1234@localhost:5432/sero_leather

    MPESA_CONSUMER_KEY=
    MPESA_CONSUMER_SECRET=
    MPESA_SHORTCODE=
    MPESA_PASSKEY=
    MPESA_CALLBACK_URL=        <- must be public HTTPS; use ngrok for dev
    MPESA_BASE_URL=https://sandbox.safaricom.co.ke

    PAYPAL_CLIENT_ID=
    PAYPAL_CLIENT_SECRET=
    PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
    PAYPAL_RETURN_URL=
    PAYPAL_CANCEL_URL=

No inline comments in .env values — they break URL parsing.

---

## Database
- **DB Name**: sero_leather
- **User**: postgres
- Always connect locally via `sudo -u postgres psql`

---

## Models (models.py)

All models share a timestamp pattern via `_ts()` / `_ts_update()` lambdas — `server_default=func.now()` on all, `server_onupdate=FetchedValue()` on `updated_at`. The DB trigger handles the actual update firing (see Migrations).

### Category
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | Text | unique, not null |
| slug | Text | unique, not null — human-readable URL identifier e.g. white-laptop-bag |
| description | Text | unique, not null |
| image_url | Text | unique, not null |
| created_at | TIMESTAMP | server_default=now() |
| updated_at | TIMESTAMP | DB trigger |

### Product
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | Text | unique, not null |
| slug | Text | unique, not null |
| description | Text | unique, not null |
| image_url | Text | unique, not null |
| is_customisable | Boolean | default False — flag only, custom request logic TBD |
| price | Numeric(10,2) | not null — always stored in KES |
| is_on_discount | Boolean | default False |
| discount_percentage | Numeric | nullable — only relevant when is_on_discount=True |
| initial_stock | Integer | nullable — set once at creation, never updated |
| stock | Integer | not null |
| is_active | Boolean | default True — soft hide without deleting |
| category_id | Integer FK | -> Category.id |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | DB trigger |

**Discount logic**: `final_price = price * (1 - discount_percentage / 100)`. Never stored — always computed on the fly.

**Stock logic**: If variant rows exist for a product, stock is managed per variant. If no variants exist, the product-level stock is used. Routes check variant existence before reading stock.

### Variant
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| product_id | Integer FK | -> Product.id |
| size | Text | not null |
| colour | Text | not null |
| initial_stock | Integer | nullable |
| stock | Integer | not null |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | DB trigger |

Variants are optional per product — presence of rows means the product has variants. Duplicate check is on `product_id + size + colour` together.

### Admin
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| username | Text | unique, not null |
| hashed_password | Text | not null |
| active_token | Text | nullable — current valid session JWT |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | DB trigger |

New login overwrites `active_token`, invalidating any prior session on any device.

### Order
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| customer_name | Text | not null |
| customer_email | Text | not null |
| customer_phone | Text | not null — Safaricom number for STK push e.g. 2547XXXXXXXX |
| delivery_address | Text | not null |
| total_price | Numeric(10,2) | not null — stored in order currency |
| status | Text | default "pending" — lifecycle: pending → confirmed → shipped → delivered → cancelled |
| payment_method | Text | nullable — mpesa \| paypal \| pesapal |
| payment_status | Text | default "unpaid" — unpaid \| paid \| failed \| refunded |
| merchant_reference | Text | unique, nullable — UUID generated by BE, sent to provider, matched on webhook |
| mpesa_checkout_request_id | Text | nullable — CheckoutRequestID from Daraja STK push |
| paypal_order_id | Text | nullable — PayPal order ID |
| currency | Text | default "KES" |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | DB trigger |

### OrderItem
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| order_id | Integer FK | -> Order.id |
| product_id | Integer FK | -> Product.id |
| variant_id | Integer FK | -> Variant.id, nullable |
| quantity | Integer | not null |
| unit_price | Numeric(10,2) | not null — price snapshot at order time |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | DB trigger |

### PaymentLog
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| order_id | Integer FK | -> Order.id |
| provider | Text | mpesa \| paypal |
| event_type | Text | initiate \| callback \| success \| failure |
| raw_payload | Text | nullable — full provider JSON as string, audit trail |
| provider_reference | Text | nullable — MpesaReceiptNumber or PayPal capture ID |
| created_at | TIMESTAMP | |

### Currency
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| code | Text | unique, not null — e.g. "USD" |
| name | Text | not null — e.g. "US Dollar" |
| rate_to_kes | Numeric(20,6) | not null, default 1 |
| is_active | Boolean | default True |
| last_updated | TIMESTAMP | nullable — set on each rate refresh |
| created_at | TIMESTAMP | |

---

## updated_at Strategy
DB-level trigger — fires on every UPDATE regardless of source. Declared in models with `server_onupdate=FetchedValue()`. The trigger migration is pending (see Migrations).

---

## Auth (auth.py)
- JWT via python-jose, HS256, 8-hour expiry
- Password hashing via passlib bcrypt
- `SECRET_KEY` is a placeholder — replace before shipping
- `get_current_admin` dependency: decodes token → checks `active_token` in DB → 401 on mismatch
- Single session enforcement: new login overwrites `active_token`, old tokens immediately invalid

---

## Currency (currency.py)
- All prices stored in KES
- `get_rates(db)` — returns `{code: rate}` dict from active Currency rows; rate represents how many KES equal one unit of foreign currency as per the open.er-api base-KES response
- `convert(amount, currency, db)` — converts a KES amount to the target currency
- `get_supported(db)` — returns list of active currency codes including KES
- Rates refresh automatically every 24 hours via a background task in `main.py` (open.er-api)

---

## Payments

### M-Pesa (mpesa.py)
Daraja STK push flow:
1. `POST /orders` with `payment_method: "mpesa"` — BE calls `initiate_stk_push`, logs the initiation, stores `CheckoutRequestID` on the order
2. Customer completes payment on phone
3. Safaricom hits `POST /webhooks/mpesa` — BE matches via `mpesa_checkout_request_id`, marks order paid/confirmed, deducts stock, logs receipt

### PayPal (paypal.py)
Two-step flow:
1. `POST /orders/{id}/paypal/create` — BE creates a PayPal order, returns `approval_url` for redirect
2. Customer approves on PayPal, FE calls `POST /orders/{id}/paypal/capture` — BE captures, marks order paid/confirmed, deducts stock, logs capture ID

Both providers log every event (initiate, success, failure) to `PaymentLog` for audit.

---

## Image Upload
`POST /upload` — accepts JPEG, PNG, WebP. Verifies the file is a valid image, converts to RGB, resizes to max 1200px width (preserving ratio), saves as WebP quality 82 to `uploads/`. Returns `{"url": "/uploads/<uuid>.webp"}`. The `uploads/` directory is mounted as a static files route.

---

## Schemas (schemas.py)
Pydantic v2. `Dec2 = Annotated[Decimal, Field(max_digits=10, decimal_places=2)]` used throughout to avoid repetition.

Pattern per resource: `Create`, `Update` (all Optional with defaults), `Info` (public), `AdminInfo` (extends Info, adds timestamps + admin-only fields).

`computed_field` used on `OrderItemOut.subtotal` — derived from `unit_price * quantity`, never stored.

---

## Routes (router.py)

### Helpers
- `_get_or_404(db, model, **filters)` — fetch or raise 404
- `_patch(db, obj, data)` — apply partial update and commit
- `_build_product_info(p, currency, schema)` — compute discount, convert price, return correct schema
- `_validate_currency(currency, db)` — normalise to uppercase, reject unsupported
- `_deduct_stock(db, order_id)` — decrement variant or product stock after confirmed payment

### Route Table
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | / | No | Health check |
| POST | /upload | No | Image upload → WebP |
| POST | /admin/login | No | Returns JWT |
| GET | /categories | No | All categories |
| GET | /categories/{id} | No | Single category |
| GET | /admin/categories | Yes | All categories (admin) |
| GET | /admin/categories/{id}/detail | Yes | Category + its products |
| POST | /new-category | Yes | Create category |
| PATCH | /admin/categories/{id} | Yes | Update category |
| DELETE | /admin/categories/{id} | Yes | Delete category |
| GET | /products | No | All active products (public schema) |
| GET | /products/by-slug/{slug} | No | Product by slug |
| GET | /products/{id} | No | Single active product |
| GET | /products/{id}/variants | No | Product variants |
| GET | /admin/products | Yes | All products inc. inactive (admin schema) |
| GET | /admin/products/{id} | Yes | Single product (admin schema) |
| POST | /new-product | Yes | Create product |
| PATCH | /admin/products/{id} | Yes | Update product |
| DELETE | /admin/products/{id} | Yes | Delete product + variants + order items |
| POST | /products/{id}/variants | Yes | Create variant |
| PATCH | /admin/products/{id}/variants/{vid} | Yes | Update variant |
| DELETE | /admin/products/{id}/variants/{vid} | Yes | Delete variant |
| GET | /orders/{id}/status | No | Order status poll |
| GET | /admin/orders | Yes | All orders (flat list for admin UI) |
| POST | /orders | No | Create order + trigger payment initiation |
| PUT | /admin/orders/{id} | Yes | Update order status |
| POST | /webhooks/mpesa | No | M-Pesa callback |
| POST | /orders/{id}/paypal/create | No | Create PayPal order, get approval URL |
| POST | /orders/{id}/paypal/capture | No | Capture PayPal payment |
| GET | /currencies | No | All active currencies |
| POST | /admin/currencies | Yes | Add currency |
| DELETE | /admin/currencies/{code} | Yes | Remove currency |

All prices on public product routes are converted to the requested `?currency=` query param (default KES). Admin routes support the same. Conversion uses live rates from the Currency table.

---

## Migrations
Managed by Alembic. `alembic/env.py` pulls `DATABASE_URL` from `.env` and imports models for autogenerate.

### Migration History
| ID | Description | Status |
|---|---|---|
| 93803e4d7376 | Initial tables: category, product, variant, admin | Applied |
| (pending) | Order, order_item, payment_log, currency tables | Not written |
| (pending) | updated_at DB trigger for all tables | Not written |

Run migrations: `alembic upgrade head`

---

## Seeding
Creates one admin user. Run once after migrations:

    python seed/seed_admin.py

Default credentials — **change before shipping**: `username: admin` / `password: changethispassword`

---

## Pre-Ship Checklist
- [ ] Replace `SECRET_KEY` in auth.py
- [ ] Change default admin password
- [ ] Write and apply order/payment/currency migration
- [ ] Write and apply updated_at trigger migration
- [ ] Switch M-Pesa and PayPal base URLs from sandbox to production
- [ ] Set public HTTPS callback URL for M-Pesa (not ngrok)
- [ ] Move all secrets to .env and confirm nothing is hardcoded
- [ ] Set CORS `allow_origins` to FE domain only
- [ ] Test single session enforcement end to end
- [ ] Test full M-Pesa STK push → webhook → stock deduction flow
- [ ] Test full PayPal create → capture → stock deduction flow
```