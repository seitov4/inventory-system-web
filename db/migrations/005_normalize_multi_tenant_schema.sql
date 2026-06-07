-- Normalize legacy schema leftovers to the multi-tenant SaaS canonical model.
-- Canonical columns:
--   users.store_id
--   products.store_id
--   warehouses.store_id
--   sales.store_id, sales.total_amount
--   sale_items.qty
--   movements.store_id, movements.qty
--   notifications.store_id
--
-- This migration is intentionally non-destructive: no DROP TABLE, no TRUNCATE,
-- and no data deletion. Legacy columns may remain for compatibility, but new
-- application code should not depend on them.

INSERT INTO stores (name, slug, status, plan, region, created_at, updated_at)
VALUES ('Default Store', 'default-store', 'active', 'default', 'local', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO warehouses (store_id, name, type, address, created_at, updated_at)
SELECT s.id, 'Default Warehouse', 'warehouse', 'Default address', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM stores s
WHERE s.slug = 'default-store'
  AND NOT EXISTS (SELECT 1 FROM warehouses w WHERE w.store_id = s.id);

UPDATE stores s
SET primary_warehouse_id = w.id,
    updated_at = CURRENT_TIMESTAMP
FROM warehouses w
WHERE s.slug = 'default-store'
  AND w.store_id = s.id
  AND s.primary_warehouse_id IS NULL;

-- Users: tenant relation is users.store_id; users.store_name remains display-only.
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id INTEGER;
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

UPDATE users
SET is_active = TRUE
WHERE is_active IS NULL;

ALTER TABLE users ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_store_id_fkey') THEN
        ALTER TABLE users
            ADD CONSTRAINT users_store_id_fkey
            FOREIGN KEY (store_id) REFERENCES stores(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_store_id ON users(store_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_store_email_unique ON users(store_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_store_phone_unique ON users(store_id, phone) WHERE phone IS NOT NULL;

-- Warehouses.
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS store_id INTEGER;

UPDATE warehouses
SET store_id = (SELECT id FROM stores WHERE slug = 'default-store')
WHERE store_id IS NULL;

ALTER TABLE warehouses ALTER COLUMN store_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'warehouses_store_id_fkey') THEN
        ALTER TABLE warehouses
            ADD CONSTRAINT warehouses_store_id_fkey
            FOREIGN KEY (store_id) REFERENCES stores(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_warehouses_store_id ON warehouses(store_id);

-- Products.
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id INTEGER;

UPDATE products
SET store_id = (SELECT id FROM stores WHERE slug = 'default-store')
WHERE store_id IS NULL;

ALTER TABLE products ALTER COLUMN store_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_store_id_fkey') THEN
        ALTER TABLE products
            ADD CONSTRAINT products_store_id_fkey
            FOREIGN KEY (store_id) REFERENCES stores(id);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sku_key') THEN
        ALTER TABLE products DROP CONSTRAINT products_sku_key;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_barcode_key') THEN
        ALTER TABLE products DROP CONSTRAINT products_barcode_key;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE UNIQUE INDEX IF NOT EXISTS products_store_sku_unique
    ON products(store_id, sku)
    WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_store_barcode_unique
    ON products(store_id, barcode)
    WHERE barcode IS NOT NULL;

-- Sales: total_amount is canonical; total remains legacy if present.
ALTER TABLE sales ADD COLUMN IF NOT EXISTS store_id INTEGER;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales' AND column_name = 'total'
    ) THEN
        EXECUTE 'UPDATE sales SET total_amount = total WHERE (total_amount IS NULL OR total_amount = 0) AND total > 0';
    END IF;
END $$;

UPDATE sales sa
SET store_id = COALESCE(
    (SELECT w.store_id FROM warehouses w WHERE w.id = sa.warehouse_id),
    (SELECT id FROM stores WHERE slug = 'default-store')
)
WHERE sa.store_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = sa.store_id);

UPDATE sales
SET total_amount = 0
WHERE total_amount IS NULL;

UPDATE sales
SET status = LOWER(status)
WHERE status IS NOT NULL;

ALTER TABLE sales ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE sales ALTER COLUMN total_amount SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_store_id_fkey') THEN
        ALTER TABLE sales
            ADD CONSTRAINT sales_store_id_fkey
            FOREIGN KEY (store_id) REFERENCES stores(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_store_id ON sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_store_status_created_at ON sales(store_id, status, created_at);

-- Sale items: qty is canonical; quantity remains legacy if present.
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS qty INTEGER;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sale_items' AND column_name = 'quantity'
    ) THEN
        EXECUTE 'UPDATE sale_items SET qty = quantity WHERE qty IS NULL AND quantity IS NOT NULL';
    END IF;
END $$;

UPDATE sale_items
SET qty = 1
WHERE qty IS NULL;

ALTER TABLE sale_items ALTER COLUMN qty SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sale_items_qty_check') THEN
        ALTER TABLE sale_items
            ADD CONSTRAINT sale_items_qty_check CHECK (qty > 0);
    END IF;
END $$;

-- Movements: store_id and qty are canonical; quantity remains legacy if present.
ALTER TABLE movements ADD COLUMN IF NOT EXISTS store_id INTEGER;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS qty INTEGER;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'movements' AND column_name = 'quantity'
    ) THEN
        EXECUTE 'UPDATE movements SET qty = quantity WHERE qty IS NULL AND quantity IS NOT NULL';
    END IF;
END $$;

UPDATE movements m
SET store_id = COALESCE(
    (SELECT w.store_id FROM warehouses w WHERE w.id = m.warehouse_id),
    (SELECT w.store_id FROM warehouses w WHERE w.id = m.warehouse_from),
    (SELECT w.store_id FROM warehouses w WHERE w.id = m.warehouse_to),
    (SELECT p.store_id FROM products p WHERE p.id = m.product_id),
    (SELECT id FROM stores WHERE slug = 'default-store')
)
WHERE m.store_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = m.store_id);

UPDATE movements
SET qty = 1
WHERE qty IS NULL;

ALTER TABLE movements ALTER COLUMN store_id SET NOT NULL;
ALTER TABLE movements ALTER COLUMN qty SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movements_store_id_fkey') THEN
        ALTER TABLE movements
            ADD CONSTRAINT movements_store_id_fkey
            FOREIGN KEY (store_id) REFERENCES stores(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movements_qty_check') THEN
        ALTER TABLE movements
            ADD CONSTRAINT movements_qty_check CHECK (qty > 0);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_movements_store_id ON movements(store_id);
CREATE INDEX IF NOT EXISTS idx_movements_store_created_at ON movements(store_id, created_at);

-- Notifications.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS store_id INTEGER;

UPDATE notifications n
SET store_id = COALESCE(
    (SELECT u.store_id FROM users u WHERE u.id = n.user_id),
    (SELECT id FROM stores WHERE slug = 'default-store')
)
WHERE n.store_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM stores s WHERE s.id = n.store_id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_store_id_fkey') THEN
        ALTER TABLE notifications
            ADD CONSTRAINT notifications_store_id_fkey
            FOREIGN KEY (store_id) REFERENCES stores(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_store_id ON notifications(store_id);
