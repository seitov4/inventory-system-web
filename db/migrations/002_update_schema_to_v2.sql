-- Migration: Update schema to version 2.0 with improved data model
-- 
-- This migration updates the schema to match the complete data model requirements:
-- - Adds direction field to movements
-- - Adds source_type field to movements  
-- - Adds related_entity_id field to movements
-- - Adds is_active to products
-- - Updates sales.warehouse_id (from store_id)
-- - Adds updated_at timestamps where missing
-- - Adds proper indexes
-- - Adds constraints

-- =====================================================
-- 1. Add missing fields to existing tables
-- =====================================================

-- Add is_active to products (soft delete)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
    END IF;
END $$;

-- Add updated_at to users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Add updated_at to warehouses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'warehouses' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE warehouses ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Add updated_at to stock
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE stock ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- 2. Update movements table structure
-- =====================================================

-- Note: Current movements table uses warehouse_from/warehouse_to
-- The new model uses warehouse_id + direction
-- This migration adds new fields but keeps old ones for backward compatibility
-- Application code should be updated to use new structure gradually

-- Add direction field (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movements' AND column_name = 'direction'
    ) THEN
        ALTER TABLE movements ADD COLUMN direction SMALLINT;
        
        -- Migrate existing data: derive direction from type
        UPDATE movements SET direction = 1 WHERE type IN ('IN', 'RETURN');
        UPDATE movements SET direction = -1 WHERE type IN ('OUT', 'SALE');
        -- TRANSFER will need manual handling (2 movements)
        
        -- Add constraint
        ALTER TABLE movements ADD CONSTRAINT movements_direction_chk 
            CHECK (direction IN (-1, 1));
    END IF;
END $$;

-- Add source_type field (rename/alias for type)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movements' AND column_name = 'source_type'
    ) THEN
        ALTER TABLE movements ADD COLUMN source_type VARCHAR(20);
        -- Copy from type
        UPDATE movements SET source_type = type;
        -- Make NOT NULL after migration
        ALTER TABLE movements ALTER COLUMN source_type SET NOT NULL;
    END IF;
END $$;

-- Add warehouse_id field (consolidated from warehouse_from/warehouse_to)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movements' AND column_name = 'warehouse_id'
    ) THEN
        ALTER TABLE movements ADD COLUMN warehouse_id INTEGER REFERENCES warehouses(id);
        -- Migrate: use warehouse_to for IN/RETURN, warehouse_from for OUT/SALE
        UPDATE movements SET warehouse_id = warehouse_to WHERE warehouse_to IS NOT NULL;
        UPDATE movements SET warehouse_id = warehouse_from WHERE warehouse_id IS NULL AND warehouse_from IS NOT NULL;
        -- Make NOT NULL after ensuring all rows have value
        ALTER TABLE movements ALTER COLUMN warehouse_id SET NOT NULL;
    END IF;
END $$;

-- Add related_entity_id field
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movements' AND column_name = 'related_entity_id'
    ) THEN
        ALTER TABLE movements ADD COLUMN related_entity_id INTEGER;
        CREATE INDEX IF NOT EXISTS idx_movements_related_entity 
            ON movements(related_entity_id) WHERE related_entity_id IS NOT NULL;
    END IF;
END $$;

-- Rename quantity to qty for consistency
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movements' AND column_name = 'quantity'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movements' AND column_name = 'qty'
    ) THEN
        ALTER TABLE movements RENAME COLUMN quantity TO qty;
    END IF;
END $$;

-- Rename reason to comment for consistency
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movements' AND column_name = 'reason'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movements' AND column_name = 'comment'
    ) THEN
        ALTER TABLE movements RENAME COLUMN reason TO comment;
    END IF;
END $$;

-- =====================================================
-- 3. Update sales table
-- =====================================================

-- Add warehouse_id if store_id exists but warehouse_id doesn't
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'store_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'warehouse_id'
    ) THEN
        ALTER TABLE sales ADD COLUMN warehouse_id INTEGER REFERENCES warehouses(id);
        -- Copy from store_id
        UPDATE sales SET warehouse_id = store_id WHERE store_id IS NOT NULL;
        -- Make NOT NULL if all rows have value
        ALTER TABLE sales ALTER COLUMN warehouse_id SET NOT NULL;
    END IF;
END $$;

-- Rename total to total_amount for consistency
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'total'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE sales RENAME COLUMN total TO total_amount;
    END IF;
END $$;

-- Update status values to lowercase
UPDATE sales SET status = LOWER(status) WHERE status IS NOT NULL;

-- =====================================================
-- 4. Update notifications table
-- =====================================================

-- Change status to is_read boolean
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'status'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'is_read'
    ) THEN
        ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        -- Migrate: NEW/UNREAD = false, READ = true
        UPDATE notifications SET is_read = (status = 'READ' OR status = 'read');
        ALTER TABLE notifications ALTER COLUMN is_read SET NOT NULL;
    END IF;
END $$;

-- =====================================================
-- 5. Add missing indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(type);
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_product_warehouse ON stock(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_movements_product ON movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_warehouse ON movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_movements_source_type ON movements(source_type);
CREATE INDEX IF NOT EXISTS idx_movements_created_at ON movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_created_by ON movements(created_by);
CREATE INDEX IF NOT EXISTS idx_movements_product_warehouse_date ON movements(product_id, warehouse_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_warehouse ON sales(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- 6. Add constraints
-- =====================================================

-- Ensure stock quantity is non-negative
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'stock' AND constraint_name = 'stock_quantity_check'
    ) THEN
        ALTER TABLE stock ADD CONSTRAINT stock_quantity_check CHECK (quantity >= 0);
    END IF;
END $$;

-- Ensure movement qty is positive
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'movements' AND constraint_name = 'movements_qty_check'
    ) THEN
        ALTER TABLE movements ADD CONSTRAINT movements_qty_check CHECK (qty > 0);
    END IF;
END $$;

-- Ensure sale_item qty is positive
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sale_items' AND constraint_name = 'sale_items_qty_check'
    ) THEN
        ALTER TABLE sale_items ADD CONSTRAINT sale_items_qty_check CHECK (qty > 0);
    END IF;
END $$;

