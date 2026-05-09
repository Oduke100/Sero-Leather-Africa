-- ─────────────────────────────────────────────
--  schema.sql
--  Run once to initialise the database.
--  psql -d your_db -f schema.sql
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inventory (
    id                   SERIAL        PRIMARY KEY,
    product_name         VARCHAR(255)  NOT NULL,
    product_description  TEXT,
    product_story        TEXT,
    product_price        DECIMAL(10,2) NOT NULL,
    product_picture_url  VARCHAR(255),
    product_quantity     INT           NOT NULL,
    product_is_available BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL        PRIMARY KEY,
    customer_name    VARCHAR(255)  NOT NULL,
    phone            VARCHAR(20)   NOT NULL,
    delivery_address TEXT          NOT NULL,
    items            JSONB         NOT NULL,
    total_price      DECIMAL(10,2) NOT NULL,
    status           VARCHAR(50)   NOT NULL DEFAULT 'Pending',
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id               SERIAL PRIMARY KEY,
    order_id         INT REFERENCES orders(id),
    transaction_id   VARCHAR(100) UNIQUE,
    payment_method   VARCHAR(20),
    payer_name       VARCHAR(200),
    payer_contact    VARCHAR(100),
    amount           DECIMAL(10,2),
    currency         VARCHAR(10) DEFAULT 'KES',
    status           VARCHAR(20) DEFAULT 'pending',
    created_at       TIMESTAMP DEFAULT NOW()
);