# DEVLOGAI — Sero Leather Africa Backend (V2)

## Project Overview
This is the second iteration of the Sero Leather Africa backend.
V1 was scrapped — deemed too amateur. V2 is a clean rebuild with proper structure, auth, and scalability in mind.
The client is a leather goods producer/seller. The BE is built with FastAPI + PostgreSQL + SQLAlchemy + Alembic.

---

## Stack
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Auth**: JWT (python-jose) + bcrypt (passlib)
- **Schema Validation**: Pydantic v2
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
    ├── database.py
    ├── dependancies.py        <- note the typo, it is intentional (do not rename, imports will break)
    ├── .env
    ├── alembic.ini
    ├── alembic/
    │   ├── env.py
    │   └── versions/
    │       ├── 93803e4d7376_initial_tables.py
    │       └── (order migration here)
    └── seed/
        └── seed_admin.py

---

## Environment Variables (.env)

    DATABASE_URL=postgresql://postgres:sero1234@localhost:5432/sero_leather

Note: The original .env had a comment inline (//fill before shipping//) which caused SQLAlchemy to fail parsing the URL. Lesson: no inline comments in .env values.

---

## Database
- **DB Name**: sero_leather
- **User**: postgres
- **Password**: set via sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'sero1234';"
- Peer authentication was blocking direct psql -U postgres calls — always use sudo -u postgres psql locally.

---

## Models (models.py)

### Category
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | Text | unique, not null |
| slug | Text | unique, not null. Human-readable URL identifier e.g. white-laptop-bag instead of product/647 |
| description | Text | unique, not null |
| image_url | Text | unique, not null |
| created_at | TIMESTAMP | server_default=now() |
| updated_at | TIMESTAMP | server_default=now(), server_onupdate=FetchedValue() — DB trigger handles this |

### Product
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | Text | unique, not null |
| slug | Text | unique, not null |
| description | Text | unique, not null |
| image_url | Text | unique, not null |
| is_customisable | Boolean | default False — flag only, custom request logic handled in separate table later |
| price | Numeric(10,2) | not null |
| is_on_discount | Boolean | default False — admin toggles this |
| discount_percentage | Numeric | nullable — only relevant when is_on_discount=True |
| stock | Integer | not null — moves to Variant level when variants exist |
| is_active | Boolean | default True — hide/show product without deleting |
| category_id | Integer FK | -> Category.id |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | DB trigger |

**Discount logic**: BE calculates final_price = price - (price * discount_percentage / 100) on the fly. Discounted price is never stored.

**Stock logic**: If a product has variant rows, stock is managed per variant. If no variant rows exist, stock on Product is used. BE must check variant existence before reading stock.

### Variant
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| product_id | Integer FK | -> Product.id |
| size | Text | not null |
| colour | Text | not null |
| stock | Integer | not null |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | DB trigger |

**No slug on Variant** — variants are not navigated to directly. URL pattern is /products/white-laptop-bag?size=XL&color=red.
**Variant is optional per product** — presence of rows = has variants, no rows = no variants. FE checks this and conditionally shows size/colour selectors.
**Duplicate check**: filter by product_id + size + colour together. Same size/colour on a different product is valid.

### Admin
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| username | Text | unique, not null |
| hashed_password | Text | not null |
| active_token | Text | nullable — stores current session JWT. New login overwrites this, invalidating previous session |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | DB trigger |

**Single session enforcement**: active_token column stores the current valid token. On new login, token is overwritten — any device holding the old token gets a 401.

### Order
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| customer_name | Text | not null |
| customer_email | Text | not null |
| customer_phone | Text | not null |
| delivery_address | Text | not null |
| total_price | Numeric(10,2) | not null |
| status | Text | default "pending" — lifecycle: pending -> confirmed -> shipped -> delivered -> cancelled |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | DB trigger |

### OrderItem
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| order_id | Integer FK | -> Order.id |
| product_id | Integer FK | -> Product.id |
| variant_id | Integer FK | -> Variant.id, nullable — not all products have variants |
| quantity | Integer | not null |
| unit_price | Numeric(10,2) | not null — price at time of purchase, protects against future price changes |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | DB trigger |

---

## updated_at Strategy
Two approaches were discussed:

**SQLAlchemy onupdate=func.now()** — fires only when SQLAlchemy executes the UPDATE. Silent failure if raw SQL is used.

**DB-level trigger (chosen approach)** — fires on every UPDATE regardless of source. The function is created once and reused across all tables. In models, column is declared with server_onupdate=FetchedValue().

**NOTE**: The trigger migration has NOT been written yet. updated_at will not auto-update until the trigger migration is added.

---

## Schemas (schemas.py)

Pydantic v2. Uses Annotated + Field for Numeric constraints (replaces deprecated condecimal).

Pattern per resource: Create, Update (all Optional), Info (public), AdminInfo (extends Info, adds timestamps via inheritance).

discount_percentage is Optional with = None default in both CreateProduct and ProductInfo.

Schemas written: CreateCategory, UpdateCategory, CategoryInfo, AdminCategoryInfo, CreateProduct, UpdateProduct, ProductInfo, AdminProductInfo, CreateProductVariant, UpdateProductVariant, ProductVariantInfo, AdminProductVariantInfo, AdminLogin, AdminTokenResponse.

---

## Auth (auth.py)

- JWT via python-jose
- Password hashing via passlib[bcrypt]
- Token expiry: 8 hours
- SECRET_KEY is hardcoded as a placeholder — replace before shipping
- get_current_admin dependency: decodes token, checks it matches active_token in DB, rejects if mismatch (single session enforcement)
- OAuth2PasswordBearer points to tokenUrl="admin/login"

---

## Routes (router.py)

Routes are in a separate file from main.py — cleaner separation.

main.py just mounts the router:

    app.include_router(router)

### Completed
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | / | No | Health check |
| POST | /admin/login | No | Returns JWT token |
| POST | /new-category | Yes | Create category |
| POST | /new-product | Yes | Create product |
| POST | /products/{product_id}/variants | Yes | Create variant |
| GET | /categories | No | All categories |
| GET | /categories/{id} | No | Single category |
| GET | /products | No | All active products |
| GET | /products/{id} | No | Single product |
| GET | /products/{id}/variants | No | Product variants |
| GET | /admin/categories | Yes | All categories (admin) |
| GET | /admin/products | Yes | All products (admin) |
| GET | /admin/products/{id} | Yes | Single product (admin) |
| PATCH | /admin/categories/{id} | Yes | Update category |
| PATCH | /admin/products/{id} | Yes | Update product |
| PATCH | /admin/products/{id}/variants/{vid} | Yes | Update variant |
| DELETE | /admin/categories/{id} | Yes | Delete category |
| DELETE | /admin/products/{id} | Yes | Delete product |
| DELETE | /admin/products/{id}/variants/{vid} | Yes | Delete variant |

### Pending
- Order routes

---

## Migrations
Managed by Alembic.

alembic/env.py pulls DATABASE_URL from .env via dotenv.
sys.path.append added so Alembic can find models.py from the alembic/ subdirectory.

### Migration History
| ID | Description |
|---|---|
| 93803e4d7376 | initial tables (category, product, variant, admin) |
| (pending) | add order and order_item tables |

---

## Seeding
Single admin user. Run once:

    python seed/seed_admin.py

Default credentials: username: admin, password: changethispassword — change before shipping.
Seed file uses sys.path.append to resolve imports from parent directory.

---

## Known Issues / Bugs Encountered

| Bug | Cause | Fix |
|---|---|---|
| Could not parse SQLAlchemy URL | Inline comment in .env value | Remove everything after the URL value in .env |
| Peer authentication failed | psql called as wrong Linux user | Use sudo -u postgres psql |
| password authentication failed | Wrong password in DATABASE_URL | Set password with ALTER USER, match it in .env |
| relation does not exist | Migrations not run before seeding | Run alembic upgrade head first |
| ModuleNotFoundError: database | Seed script run from subdirectory | Added sys.path.append to seed file |
| SyntaxError on product_id | Missing = in keyword argument | product_id = product_id not product_id product_id |
| db.commit not committing | Missing parentheses | db.commit() not db.commit |
| Pylance condecimal error | Pydantic v1 style in v2 environment | Replaced with Annotated[Decimal, Field(...)] |

---

## Code Editing Convention
**ALL CODE IS WRITTEN IN CHAT. Under no circumstance should any file be downloaded or presented as a downloadable artifact. Every script, patch, or code block is written directly in the chat for the dev to copy and run in the terminal.**

**Single line change**: use sed -i

    sed -i 's/old line/new line/' filename.py

**Block/multi-line change**: save to /tmp/ then run with python. Confirmed working method — do NOT paste scripts directly into the terminal without saving to a file first.

    cat > /tmp/patch.py << PYEOF
    with open("filename.py", "r") as f:
        content = f.read()
    content = content.replace("<old>", "<new>")
    with open("filename.py", "w") as f:
        f.write(content)
    print("done")
    PYEOF
    python /tmp/patch.py

This avoids token waste on file orientation and manual edits.

---

## FE Notes (Future)
The current FE is considered amateur. A React rewrite is strongly being considered — not a visual change but a full behind-the-scenes revamp. The visual output stays the same, the architecture changes. Decision pending but the dev is inclined toward the switch.

---

## Pre-Ship Checklist
- [ ] Replace SECRET_KEY in auth.py with a strong random string
- [ ] Change default admin password
- [ ] Add updated_at DB triggers migration
- [x] Complete READ, UPDATE, DELETE routes
- [ ] Complete Order routes
- [ ] Add CORS middleware for FE integration
- [ ] Move all secrets to .env
- [ ] Test single session enforcement end to end
