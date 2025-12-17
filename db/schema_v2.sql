-- =====================================================
-- Inventory Management System - Complete Data Model
-- Version: 2.0
-- =====================================================
-- 
-- Architectural Principles:
-- 1. Stock can only be changed through Movement
-- 2. Every stock change must be recorded in Movement
-- 3. Transactional integrity for sales, returns, transfers
-- 4. Support for multiple warehouses
-- 5. Full audit trail of all movements
--
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
    role VARCHAR(50) NOT NULL DEFAULT 'cashier', -- cashier | manager | owner | admin
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
    is_active BOOLEAN DEFAULT TRUE, -- Soft delete flag
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
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
    type VARCHAR(50), -- store | warehouse
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(type);

-- =====================================================
-- 4. STOCK (Derived entity - updated only via Movement)
-- =====================================================
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (product_id, warehouse_id)
);

-- Indexes for fast stock queries
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_product_warehouse ON stock(product_id, warehouse_id);

-- =====================================================
-- 5. MOVEMENTS (Core entity - all stock changes go through here)
-- =====================================================
-- Note: For TRANSFER operations, create 2 Movement records:
--   1. Movement with direction=-1 for warehouse_from
--   2. Movement with direction=+1 for warehouse_to
--
-- Each Movement record represents a change to ONE warehouse
CREATE TABLE IF NOT EXISTS movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id), -- Single warehouse per movement
    direction SMALLINT NOT NULL CHECK (direction IN (-1, 1)), -- -1 = OUT, +1 = IN
    qty INTEGER NOT NULL CHECK (qty > 0), -- Always positive
    source_type VARCHAR(20) NOT NULL, -- IN | OUT | SALE | RETURN | TRANSFER | ADJUST
    related_entity_id INTEGER, -- sale_id, transfer_id, etc. (flexible reference)
    created_by INTEGER REFERENCES users(id),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for movement queries
CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_warehouse ON movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_movements_source_type ON movements(source_type);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_created_by ON movements(created_by);
CREATE INDEX IF NOT EXISTS idx_movements_related_entity ON movements(related_entity_id) WHERE related_entity_id IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_movements_product_warehouse_date ON movements(product_id, warehouse_id, created_at DESC);

-- =====================================================
-- 6. SALES
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    cashier_id INTEGER REFERENCES users(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id), -- Changed from store_id for consistency
    total_amount NUMERIC(12,2) NOT NULL,
    discount NUMERIC(12,2) DEFAULT 0,
    payment_type VARCHAR(50), -- cash | card | mixed
    status VARCHAR(20) DEFAULT 'completed', -- completed | returned
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_warehouse ON sales(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- =====================================================
-- 7. SALE ITEMS
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
-- 8. NOTIFICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- low_stock | system | analytics
    user_id INTEGER REFERENCES users(id),
    payload JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE stock IS 'Stock quantities - updated ONLY through Movement table';
COMMENT ON TABLE movements IS 'All stock changes must go through this table';
COMMENT ON COLUMN movements.direction IS '-1 = stock decrease, +1 = stock increase';
COMMENT ON COLUMN movements.qty IS 'Always positive - direction determines increase/decrease';
COMMENT ON COLUMN movements.related_entity_id IS 'Optional reference to sale_id or other related entities';

