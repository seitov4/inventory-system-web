-- Migration: Add UNIQUE constraint to products.sku
-- This ensures SKU uniqueness at database level

-- Add UNIQUE constraint if it doesn't exist
DO $$
BEGIN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'products_sku_key'
    ) THEN
        -- Add NOT NULL constraint first if needed
        ALTER TABLE products ALTER COLUMN sku SET NOT NULL;
        
        -- Add UNIQUE constraint
        ALTER TABLE products ADD CONSTRAINT products_sku_key UNIQUE (sku);
        
        RAISE NOTICE 'Added UNIQUE constraint to products.sku';
    ELSE
        RAISE NOTICE 'UNIQUE constraint on products.sku already exists';
    END IF;
END $$;

