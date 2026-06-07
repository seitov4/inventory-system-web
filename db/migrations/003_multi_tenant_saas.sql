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

UPDATE platform_admins SET is_active = TRUE WHERE is_active IS NULL;
UPDATE platform_admins SET created_at = NOW() WHERE created_at IS NULL;
UPDATE platform_admins SET updated_at = NOW() WHERE updated_at IS NULL;
ALTER TABLE platform_admins ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE platform_admins ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE platform_admins ALTER COLUMN updated_at SET NOT NULL;

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
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'stores_status_saas_chk'
    ) THEN
        ALTER TABLE stores DROP CONSTRAINT stores_status_saas_chk;
    END IF;
END $$;

UPDATE stores SET status = 'inactive' WHERE status IN ('archived', 'provisioning');
UPDATE stores SET status = 'active' WHERE status IS NULL;
UPDATE stores SET plan = 'default' WHERE plan IS NULL;
UPDATE stores SET slug = CONCAT('store-', id) WHERE slug IS NULL OR slug = '';

DO $$
BEGIN
    ALTER TABLE stores
        ADD CONSTRAINT stores_status_saas_chk
        CHECK (status IN ('active', 'suspended', 'inactive', 'deleted'));
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
