-- Create default warehouse for Default Store if it does not exist.
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

SELECT w.id, w.name, w.store_id
FROM warehouses w
JOIN stores s ON s.id = w.store_id
WHERE s.slug = 'default-store'
ORDER BY w.id
LIMIT 1;
