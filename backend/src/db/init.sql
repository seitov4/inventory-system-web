-- =====================================================
-- Inventory Management System - Unified Schema Initialization
-- This file ensures all tables and columns exist, matching backend code expectations
-- =====================================================

-- =====================================================
-- 1. USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    store_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cashier',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT users_email_or_phone_chk CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='name') THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    UPDATE users
    SET is_active = TRUE
    WHERE is_active IS NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- =====================================================
-- 1b. PLATFORM ADMINS
-- System administrators for the private SaaS platform panel.
-- Tenant users must never be authenticated from this table.
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT platform_admins_role_chk CHECK (role IN ('platform_super_admin', 'platform_admin'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);
CREATE INDEX IF NOT EXISTS idx_platform_admins_role ON platform_admins(role);
CREATE INDEX IF NOT EXISTS idx_platform_admins_is_active ON platform_admins(is_active);

UPDATE platform_admins SET is_active = TRUE WHERE is_active IS NULL;
UPDATE platform_admins SET created_at = NOW() WHERE created_at IS NULL;
UPDATE platform_admins SET updated_at = NOW() WHERE updated_at IS NULL;
ALTER TABLE platform_admins ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE platform_admins ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE platform_admins ALTER COLUMN updated_at SET NOT NULL;

-- =====================================================
-- 2. PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    category VARCHAR(255),
    purchase_price NUMERIC(10,2),
    sale_price NUMERIC(10,2),
    min_stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- =====================================================
-- 3. STORES (platform domain)
-- =====================================================
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    owner_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    plan VARCHAR(50) NOT NULL DEFAULT 'standard',
    region VARCHAR(100) NOT NULL DEFAULT 'local',
    address TEXT,
    primary_warehouse_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT stores_status_chk CHECK (status IN ('active', 'suspended', 'archived', 'provisioning'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_primary_warehouse ON stores(primary_warehouse_id) WHERE primary_warehouse_id IS NOT NULL;

-- =====================================================
-- 4. WAREHOUSES
-- =====================================================
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(type);
CREATE INDEX IF NOT EXISTS idx_warehouses_store_id ON warehouses(store_id);

-- =====================================================
-- 5. STOCK
-- =====================================================
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (product_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_product_warehouse ON stock(product_id, warehouse_id);

-- =====================================================
-- 6. MOVEMENTS (base table - legacy columns added in migrations below)
-- =====================================================
CREATE TABLE IF NOT EXISTS movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- New unified structure (from schema_v2.sql)
    warehouse_id INTEGER REFERENCES warehouses(id),
    direction SMALLINT CHECK (direction IN (-1, 1)),
    source_type VARCHAR(20),
    qty INTEGER CHECK (qty > 0),
    related_entity_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Base indexes (for columns that always exist)
CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_warehouse_id ON movements(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movements_source_type ON movements(source_type) WHERE source_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_created_by ON movements(created_by);
CREATE INDEX IF NOT EXISTS idx_movements_related_entity ON movements(related_entity_id) WHERE related_entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movements_product_warehouse_date ON movements(product_id, warehouse_id, created_at DESC) WHERE warehouse_id IS NOT NULL;

-- =====================================================
-- 7. SALES (base table - legacy columns added in migrations below)
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    cashier_id INTEGER REFERENCES users(id),
    warehouse_id INTEGER REFERENCES warehouses(id),
    total_amount NUMERIC(12,2),
    discount NUMERIC(12,2) DEFAULT 0,
    payment_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Base indexes (for columns that always exist)
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_warehouse ON sales(warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- =====================================================
-- 8. SALE ITEMS (base table - legacy column added in migrations below)
-- =====================================================
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    qty INTEGER NOT NULL CHECK (qty > 0),
    price NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- =====================================================
-- 9. NOTIFICATIONS (base table - legacy columns added in migrations below)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Base indexes (for columns that always exist)
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- MIGRATIONS: Add missing columns if they don't exist
-- =====================================================

-- Ensure warehouses.store_id exists for store -> warehouses relation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='warehouses' AND column_name='store_id'
    ) THEN
        ALTER TABLE warehouses ADD COLUMN store_id INTEGER REFERENCES stores(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_warehouses_store_id ON warehouses(store_id);

-- Backfill stores from legacy "store as warehouse.type" records
INSERT INTO stores (name, slug, owner_email, status, plan, region, address, primary_warehouse_id, created_at, updated_at)
SELECT w.name,
       CONCAT('store-', w.id),
       NULL,
       CASE
           WHEN w.type = 'suspended' THEN 'suspended'
           WHEN w.type = 'archived' THEN 'archived'
           ELSE 'active'
       END,
       'standard',
       'local',
       w.address,
       w.id,
       COALESCE(w.created_at, NOW()),
       COALESCE(w.updated_at, NOW())
FROM warehouses w
WHERE w.type IN ('store', 'suspended', 'archived')
  AND NOT EXISTS (
      SELECT 1
      FROM stores s
      WHERE s.primary_warehouse_id = w.id
  );

UPDATE warehouses w
SET store_id = s.id
FROM stores s
WHERE s.primary_warehouse_id = w.id
  AND w.store_id IS NULL;

-- Add legacy columns to movements if missing
DO $$
BEGIN
    -- Add warehouse_from if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movements' AND column_name='warehouse_from') THEN
        ALTER TABLE movements ADD COLUMN warehouse_from INTEGER REFERENCES warehouses(id);
    END IF;

    -- Add warehouse_to if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movements' AND column_name='warehouse_to') THEN
        ALTER TABLE movements ADD COLUMN warehouse_to INTEGER REFERENCES warehouses(id);
    END IF;

    -- Add type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movements' AND column_name='type') THEN
        ALTER TABLE movements ADD COLUMN type VARCHAR(20);
    END IF;

    -- Add quantity if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movements' AND column_name='quantity') THEN
        ALTER TABLE movements ADD COLUMN quantity INTEGER;
    END IF;

    -- Add reason if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='movements' AND column_name='reason') THEN
        ALTER TABLE movements ADD COLUMN reason TEXT;
    END IF;
END $$;

-- Create indexes on legacy columns (after they're added)
CREATE INDEX IF NOT EXISTS idx_movements_warehouse_from ON movements(warehouse_from) WHERE warehouse_from IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movements_warehouse_to ON movements(warehouse_to) WHERE warehouse_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movements_type ON movements(type) WHERE type IS NOT NULL;

-- Add legacy columns to notifications if missing
DO $$
BEGIN
    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='status') THEN
        ALTER TABLE notifications ADD COLUMN status VARCHAR(20) DEFAULT 'NEW';
    END IF;

    -- Add read_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP;
    END IF;

    -- Add is_read if missing (new field)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='is_read') THEN
        ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create indexes on legacy columns (after they're added)
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Add legacy columns to sales if missing
DO $$
BEGIN
    -- Add store_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales' AND column_name='store_id') THEN
        ALTER TABLE sales ADD COLUMN store_id INTEGER REFERENCES warehouses(id);
    END IF;

    -- Add total if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sales' AND column_name='total') THEN
        ALTER TABLE sales ADD COLUMN total NUMERIC(12,2);
    END IF;
END $$;

-- Create indexes on legacy columns (after they're added)
CREATE INDEX IF NOT EXISTS idx_sales_store ON sales(store_id) WHERE store_id IS NOT NULL;

-- Add legacy columns to sale_items if missing
DO $$
BEGIN
    -- Add quantity if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sale_items' AND column_name='quantity') THEN
        ALTER TABLE sale_items ADD COLUMN quantity INTEGER CHECK (quantity > 0);
    END IF;
END $$;


-- =====================================================
-- MULTI-TENANT SAAS MIGRATION (mirrors db/migrations/003_multi_tenant_saas.sql)
-- =====================================================

-- Migration: Multi-tenant SaaS isolation
--
-- This migration is intentionally non-destructive:
-- - no DROP TABLE
-- - no TRUNCATE
-- - legacy display columns such as users.store_name are kept
-- - existing rows without store_id are attached to Default Store
--
-- Rollback note:
-- If a rollback is required, keep the new columns in place and revert
-- application code first. Removing tenant columns after data has been written
-- would require a manual backup/restore plan.

-- =====================================================
-- 1. Platform admins are separate from tenant users
-- =====================================================
CREATE TABLE IF NOT EXISTS platform_admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT platform_admins_role_chk CHECK (role IN ('platform_super_admin', 'platform_admin'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_admins_email ON platform_admins(email);
CREATE INDEX IF NOT EXISTS idx_platform_admins_role ON platform_admins(role);
CREATE INDEX IF NOT EXISTS idx_platform_admins_is_active ON platform_admins(is_active);

-- =====================================================
-- 2. Stores are tenants/companies
-- =====================================================
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    owner_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    plan VARCHAR(50) DEFAULT 'default',
    region VARCHAR(100),
    address TEXT,
    primary_warehouse_id INTEGER NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE stores ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_email VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'default';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS primary_warehouse_id INTEGER NULL;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'stores_status_chk'
    ) THEN
        ALTER TABLE stores DROP CONSTRAINT stores_status_chk;
    END IF;
END $$;

UPDATE stores SET status = 'inactive' WHERE status IN ('archived', 'provisioning');
UPDATE stores SET status = 'active' WHERE status IS NULL;
UPDATE stores SET plan = 'default' WHERE plan IS NULL;
UPDATE stores SET slug = CONCAT('store-', id) WHERE slug IS NULL OR slug = '';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'stores_status_saas_chk'
    ) THEN
        ALTER TABLE stores
            ADD CONSTRAINT stores_status_saas_chk
            CHECK (status IN ('active', 'suspended', 'inactive'));
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);

INSERT INTO stores (name, slug, owner_email, status, plan, region, address, created_at, updated_at)
VALUES ('Default Store', 'default-store', NULL, 'active', 'default', 'local', NULL, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO warehouses (store_id, name, type, address, created_at, updated_at)
SELECT s.id, 'Default Warehouse', 'warehouse', 'Default address', NOW(), NOW()
FROM stores s
WHERE s.slug = 'default-store'
  AND NOT EXISTS (
      SELECT 1 FROM warehouses w WHERE w.store_id = s.id
  );

UPDATE stores s
SET primary_warehouse_id = w.id,
    updated_at = NOW()
FROM warehouses w
WHERE s.slug = 'default-store'
  AND w.store_id = s.id
  AND s.primary_warehouse_id IS NULL;

-- =====================================================
-- 3. Tenant users are attached to stores
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

UPDATE users u
SET store_id = s.id
FROM stores s
WHERE u.store_id IS NULL
  AND u.store_name IS NOT NULL
  AND LOWER(u.store_name) = LOWER(s.name);

UPDATE users
SET store_id = (SELECT id FROM stores WHERE slug = 'default-store')
WHERE store_id IS NULL;

UPDATE users SET is_active = TRUE WHERE is_active IS NULL;
UPDATE users SET role = 'owner' WHERE role = 'admin';
UPDATE users SET role = 'staff' WHERE role NOT IN ('owner', 'manager', 'cashier', 'staff');

ALTER TABLE users ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_tenant_role_chk'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_tenant_role_chk;
    END IF;

    ALTER TABLE users
        ADD CONSTRAINT users_tenant_role_chk
        CHECK (role IN ('owner', 'manager', 'cashier', 'staff'));
END $$;

CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_store_email_unique ON users(store_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_store_phone_unique ON users(store_id, phone) WHERE phone IS NOT NULL;

-- =====================================================
-- 4. Warehouses belong to stores
-- =====================================================
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);

UPDATE warehouses w
SET store_id = s.id
FROM stores s
WHERE w.store_id IS NULL
  AND s.primary_warehouse_id = w.id;

UPDATE warehouses
SET store_id = (SELECT id FROM stores WHERE slug = 'default-store')
WHERE store_id IS NULL;

ALTER TABLE warehouses ALTER COLUMN store_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warehouses_store_id ON warehouses(store_id);

-- =====================================================
-- 5. Products belong to stores; SKU/barcode are unique per store
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);

UPDATE products
SET store_id = (SELECT id FROM stores WHERE slug = 'default-store')
WHERE store_id IS NULL;

ALTER TABLE products ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE products ALTER COLUMN sku DROP NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_key'
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_sku_key;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_barcode_key'
    ) THEN
        ALTER TABLE products DROP CONSTRAINT products_barcode_key;
    END IF;
END $$;

DROP INDEX IF EXISTS idx_products_sku_unique;
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE UNIQUE INDEX IF NOT EXISTS products_store_sku_unique ON products(store_id, sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_store_barcode_unique ON products(store_id, barcode) WHERE barcode IS NOT NULL;

-- =====================================================
-- 6. Stock remains warehouse + product scoped
-- Cross-store validation is enforced in services.
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS stock_warehouse_product_unique ON stock(warehouse_id, product_id);

-- =====================================================
-- 7. Movements are tenant scoped
-- =====================================================
ALTER TABLE movements ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);

UPDATE movements m
SET store_id = COALESCE(
    (SELECT p.store_id FROM products p WHERE p.id = m.product_id),
    (SELECT w.store_id FROM warehouses w WHERE w.id = m.warehouse_id),
    (SELECT w.store_id FROM warehouses w WHERE w.id = m.warehouse_from),
    (SELECT w.store_id FROM warehouses w WHERE w.id = m.warehouse_to),
    (SELECT id FROM stores WHERE slug = 'default-store')
)
WHERE m.store_id IS NULL;

ALTER TABLE movements ALTER COLUMN store_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movements_store_id ON movements(store_id);

-- =====================================================
-- 8. Sales are tenant scoped
-- =====================================================
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
        WHERE t.relname = 'sales'
          AND a.attname = 'store_id'
          AND c.contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE sales DROP CONSTRAINT %I', constraint_record.conname);
    END LOOP;
END $$;

ALTER TABLE sales ADD COLUMN IF NOT EXISTS store_id INTEGER;

UPDATE sales sa
SET store_id = COALESCE(
    (SELECT w.store_id FROM warehouses w WHERE w.id = sa.warehouse_id),
    (SELECT w.store_id FROM warehouses w WHERE w.id = sa.store_id),
    (SELECT id FROM stores WHERE slug = 'default-store')
)
WHERE sa.store_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = sa.store_id);

ALTER TABLE sales ALTER COLUMN store_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sales_store_id_fkey'
    ) THEN
        ALTER TABLE sales
            ADD CONSTRAINT sales_store_id_fkey
            FOREIGN KEY (store_id) REFERENCES stores(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);

-- =====================================================
-- 9. Notifications are tenant scoped
-- =====================================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);

UPDATE notifications n
SET store_id = COALESCE(
    (SELECT u.store_id FROM users u WHERE u.id = n.user_id),
    (SELECT id FROM stores WHERE slug = 'default-store')
)
WHERE n.store_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON notifications(store_id);
