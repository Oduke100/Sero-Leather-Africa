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