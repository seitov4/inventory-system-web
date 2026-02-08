-- =====================================================
-- Inventory Management System - Unified Schema Initialization
-- This file ensures all tables and columns exist, matching backend code expectations
-- =====================================================

-- =====================================================
-- 1. USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    store_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'cashier',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT users_email_or_phone_chk CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

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
-- 3. WAREHOUSES
-- =====================================================
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(type);

-- =====================================================
-- 4. STOCK
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
-- 5. MOVEMENTS (base table - legacy columns added in migrations below)
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
-- 6. SALES (base table - legacy columns added in migrations below)
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
-- 7. SALE ITEMS (base table - legacy column added in migrations below)
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
-- 8. NOTIFICATIONS (base table - legacy columns added in migrations below)
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

