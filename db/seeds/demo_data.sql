BEGIN;

CREATE TEMP TABLE seed_summary (
    table_name text PRIMARY KEY,
    rows_inserted integer NOT NULL
);

CREATE TEMP TABLE seed_categories (
    idx integer PRIMARY KEY,
    name text NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_categories (idx, name)
VALUES
    (1, 'Dairy'),
    (2, 'Bakery'),
    (3, 'Beverages'),
    (4, 'Produce'),
    (5, 'Frozen Foods'),
    (6, 'Household'),
    (7, 'Personal Care'),
    (8, 'Snacks'),
    (9, 'Meat and Seafood'),
    (10, 'Pantry'),
    (11, 'Baby Products'),
    (12, 'Pet Supplies');

CREATE TEMP TABLE seed_roles (
    idx integer PRIMARY KEY,
    role text NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_roles (idx, role)
VALUES
    (1, 'owner'),
    (2, 'admin'),
    (3, 'manager'),
    (4, 'manager'),
    (5, 'cashier'),
    (6, 'cashier'),
    (7, 'cashier'),
    (8, 'cashier'),
    (9, 'cashier'),
    (10, 'cashier'),
    (11, 'manager'),
    (12, 'cashier');

CREATE TEMP TABLE seed_product_words (
    idx integer PRIMARY KEY,
    brand text NOT NULL,
    item text NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_product_words (idx, brand, item)
SELECT n,
       (ARRAY['FreshWay','DailyMart','NorthField','Golden Grain','Urban Pantry','ClearSpring','HomeEase','PrimeChoice','Sunny Farm','GoodBite','PureLine','MarketPro'])[((n - 1) % 12) + 1],
       (ARRAY['Milk','Bread','Orange Juice','Apples','Dumplings','Dish Soap','Shampoo','Crackers','Chicken Fillet','Rice','Baby Wipes','Cat Food','Yogurt','Coffee','Tea','Pasta','Tomatoes','Cheese','Mineral Water','Chocolate'])[((n - 1) % 20) + 1]
FROM generate_series(1, 360) AS n;

CREATE TEMP TABLE demo_product_ids (id integer PRIMARY KEY) ON COMMIT DROP;
CREATE TEMP TABLE demo_warehouse_ids (id integer PRIMARY KEY) ON COMMIT DROP;
CREATE TEMP TABLE demo_user_ids (id integer PRIMARY KEY) ON COMMIT DROP;

INSERT INTO demo_product_ids
SELECT id FROM products WHERE sku LIKE 'DEMO-%';

INSERT INTO demo_warehouse_ids
SELECT w.id
FROM warehouses w
LEFT JOIN stores s ON s.id = w.store_id
WHERE w.name LIKE 'Demo %' OR s.slug LIKE 'demo-%';

INSERT INTO demo_user_ids
SELECT id FROM users WHERE email LIKE 'demo.%@inventory.local';

DELETE FROM notifications
WHERE type LIKE 'DEMO_%'
   OR payload ->> 'seed' = 'demo'
   OR user_id IN (SELECT id FROM demo_user_ids);

DELETE FROM sale_items
WHERE sale_id IN (
    SELECT id FROM sales
    WHERE cashier_id IN (SELECT id FROM demo_user_ids)
       OR warehouse_id IN (SELECT id FROM demo_warehouse_ids)
       OR store_id IN (SELECT id FROM demo_warehouse_ids)
);

DELETE FROM movements
WHERE product_id IN (SELECT id FROM demo_product_ids)
   OR warehouse_id IN (SELECT id FROM demo_warehouse_ids)
   OR warehouse_from IN (SELECT id FROM demo_warehouse_ids)
   OR warehouse_to IN (SELECT id FROM demo_warehouse_ids)
   OR created_by IN (SELECT id FROM demo_user_ids)
   OR reason LIKE 'Demo %'
   OR comment LIKE 'Demo %';

DELETE FROM stock
WHERE product_id IN (SELECT id FROM demo_product_ids)
   OR warehouse_id IN (SELECT id FROM demo_warehouse_ids);

DELETE FROM sales
WHERE cashier_id IN (SELECT id FROM demo_user_ids)
   OR warehouse_id IN (SELECT id FROM demo_warehouse_ids)
   OR store_id IN (SELECT id FROM demo_warehouse_ids);

DELETE FROM products WHERE sku LIKE 'DEMO-%';
DELETE FROM warehouses
WHERE id IN (SELECT id FROM demo_warehouse_ids)
   OR name LIKE 'Demo %';
DELETE FROM stores WHERE slug LIKE 'demo-%';
DELETE FROM users WHERE id IN (SELECT id FROM demo_user_ids);

INSERT INTO users (
    email,
    phone,
    first_name,
    last_name,
    store_name,
    password_hash,
    role,
    created_at,
    updated_at
)
SELECT
    'demo.user' || n || '@inventory.local',
    '+7700100' || lpad(n::text, 4, '0'),
    (ARRAY['Aidar','Dana','Timur','Aigerim','Murat','Saule','Arman','Aliya','Nursultan','Madina','Erik','Zarina'])[n],
    (ARRAY['Sultanov','Karimova','Omarov','Iskakova','Tuleuov','Nurgalieva','Bekov','Serikova','Akhmetov','Ibrayeva','Kim','Smagulova'])[n],
    'Demo Retail Network',
    COALESCE(
        (SELECT password_hash FROM users WHERE phone = '+77006521158' LIMIT 1),
        '$2a$10$210A24Sz7AdOThJQaMSoq.zNqmuheXyJqyC4KeWsHBF8xXRki1SLO'
    ),
    r.role,
    now() - (n * interval '18 days'),
    now() - (n * interval '2 days')
FROM generate_series(1, 12) AS n
JOIN seed_roles r ON r.idx = n;

INSERT INTO seed_summary
VALUES ('users', 12);

INSERT INTO stores (
    name,
    slug,
    owner_email,
    status,
    plan,
    region,
    address,
    created_at,
    updated_at
)
SELECT
    'Demo Store ' || n,
    'demo-store-' || n,
    'demo.owner' || n || '@inventory.local',
    (ARRAY['active','active','active','suspended','provisioning'])[n],
    (ARRAY['standard','premium','standard','standard','enterprise'])[n],
    (ARRAY['Almaty','Astana','Shymkent','Aktobe','Karaganda'])[n],
    (ARRAY[
        'Al-Farabi Ave 120, Almaty',
        'Mangilik El Ave 43, Astana',
        'Tauke Khan St 88, Shymkent',
        'Abilkayyr Khan Ave 12, Aktobe',
        'Bukhar Zhyrau Ave 57, Karaganda'
    ])[n],
    now() - (n * interval '45 days'),
    now() - (n * interval '5 days')
FROM generate_series(1, 5) AS n;

INSERT INTO seed_summary
VALUES ('stores', 5);

INSERT INTO warehouses (
    name,
    type,
    store_id,
    address,
    created_at,
    updated_at
)
SELECT
    'Demo ' || s.name || ' Main Warehouse',
    'store',
    s.id,
    s.address,
    s.created_at,
    now() - interval '1 day'
FROM stores s
WHERE s.slug LIKE 'demo-store-%';

INSERT INTO warehouses (name, type, store_id, address, created_at, updated_at)
VALUES
    ('Demo Central Distribution Center', 'central', NULL, 'Industrial Zone 7, Almaty', now() - interval '360 days', now() - interval '1 day'),
    ('Demo Returns Hub', 'returns', NULL, 'Logistics Park 4, Astana', now() - interval '300 days', now() - interval '1 day'),
    ('Demo Seasonal Overflow Warehouse', 'overflow', NULL, 'Warehouse Block C, Karaganda', now() - interval '240 days', now() - interval '1 day');

UPDATE stores s
SET primary_warehouse_id = w.id,
    updated_at = now()
FROM warehouses w
WHERE w.store_id = s.id
  AND w.type = 'store'
  AND s.slug LIKE 'demo-store-%';

INSERT INTO seed_summary
VALUES ('warehouses', 8);

INSERT INTO products (
    name,
    sku,
    barcode,
    category,
    purchase_price,
    sale_price,
    min_stock,
    is_active,
    created_at,
    updated_at
)
SELECT
    w.brand || ' ' || w.item || ' ' || ((n % 6) + 1) || ' pack',
    'DEMO-' || lpad(n::text, 5, '0'),
    '4870000' || lpad(n::text, 6, '0'),
    c.name,
    round((350 + (n % 80) * 37 + (n % 7) * 11)::numeric, 2),
    round(((350 + (n % 80) * 37 + (n % 7) * 11) * (1.18 + ((n % 9)::numeric / 100)))::numeric, 2),
    CASE
        WHEN n % 10 = 0 THEN 5
        WHEN n % 7 = 0 THEN 15
        ELSE 25 + (n % 40)
    END,
    n % 29 <> 0,
    now() - ((n % 365) * interval '1 day'),
    now() - ((n % 28) * interval '1 day')
FROM generate_series(1, 360) AS n
JOIN seed_product_words w ON w.idx = n
JOIN seed_categories c ON c.idx = ((n - 1) % 12) + 1;

INSERT INTO seed_summary
VALUES ('products', 360);

INSERT INTO stock (product_id, warehouse_id, quantity, updated_at)
SELECT
    p.id,
    w.id,
    CASE
        WHEN p.id % 17 = 0 THEN greatest(0, (p.min_stock / 2)::integer)
        WHEN p.id % 19 = 0 THEN 0
        WHEN p.id % 13 = 0 THEN 450 + (p.id % 90)
        ELSE 25 + ((p.id * w.id) % 180)
    END,
    now() - (((p.id + w.id) % 20) * interval '1 day')
FROM products p
CROSS JOIN warehouses w
WHERE p.sku LIKE 'DEMO-%'
  AND w.name LIKE 'Demo %'
ON CONFLICT (product_id, warehouse_id) DO UPDATE
SET quantity = EXCLUDED.quantity,
    updated_at = EXCLUDED.updated_at;

INSERT INTO seed_summary
SELECT 'stock', count(*)
FROM stock st
JOIN products p ON p.id = st.product_id
JOIN warehouses w ON w.id = st.warehouse_id
WHERE p.sku LIKE 'DEMO-%'
  AND w.name LIKE 'Demo %';

CREATE TEMP TABLE seed_sales_source (
    seed_no integer PRIMARY KEY,
    cashier_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    created_at timestamp NOT NULL,
    discount numeric NOT NULL,
    payment_type text NOT NULL,
    status text NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_sales_source
SELECT
    n,
    (SELECT id FROM users WHERE email LIKE 'demo.%@inventory.local' ORDER BY id OFFSET (n % 12) LIMIT 1),
    (SELECT id FROM warehouses WHERE name LIKE 'Demo %Main Warehouse' ORDER BY id OFFSET (n % 5) LIMIT 1),
    (current_date - interval '365 days' + (n * interval '9 hours 17 minutes'))::timestamp,
    CASE WHEN n % 9 = 0 THEN 300 ELSE 0 END,
    (ARRAY['CASH','CARD','QR','BANK_TRANSFER'])[(n % 4) + 1],
    CASE
        WHEN n % 23 = 0 THEN 'RETURNED'
        WHEN n % 31 = 0 THEN 'CANCELLED'
        ELSE 'COMPLETED'
    END
FROM generate_series(1, 900) AS n;

INSERT INTO sales (
    cashier_id,
    warehouse_id,
    store_id,
    total,
    total_amount,
    discount,
    payment_type,
    status,
    created_at
)
SELECT
    cashier_id,
    warehouse_id,
    warehouse_id,
    0,
    0,
    discount,
    payment_type,
    status,
    created_at
FROM seed_sales_source;

CREATE TEMP TABLE seed_sales (
    seed_no integer PRIMARY KEY,
    sale_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    cashier_id integer NOT NULL,
    status text NOT NULL,
    created_at timestamp NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_sales
SELECT src.seed_no, s.id, s.warehouse_id, s.cashier_id, s.status, s.created_at
FROM seed_sales_source src
JOIN sales s
  ON s.created_at = src.created_at
 AND s.cashier_id = src.cashier_id
 AND s.warehouse_id = src.warehouse_id;

INSERT INTO sale_items (
    sale_id,
    product_id,
    qty,
    quantity,
    price,
    discount
)
SELECT
    ss.sale_id,
    p.id,
    1 + ((ss.seed_no + line_no) % 5),
    1 + ((ss.seed_no + line_no) % 5),
    p.sale_price,
    CASE WHEN (ss.seed_no + line_no) % 11 = 0 THEN 50 ELSE 0 END
FROM seed_sales ss
CROSS JOIN LATERAL generate_series(1, 2 + (ss.seed_no % 3)) AS line_no
JOIN products p
  ON p.sku = 'DEMO-' || lpad((((ss.seed_no * 7 + line_no * 13) % 360) + 1)::text, 5, '0');

UPDATE sales s
SET total = totals.total_value,
    total_amount = totals.total_value
FROM (
    SELECT
        si.sale_id,
        greatest(0, sum((si.price - COALESCE(si.discount, 0)) * si.qty) - COALESCE(max(s2.discount), 0)) AS total_value
    FROM sale_items si
    JOIN sales s2 ON s2.id = si.sale_id
    JOIN seed_sales ss ON ss.sale_id = si.sale_id
    GROUP BY si.sale_id
) totals
WHERE s.id = totals.sale_id;

INSERT INTO seed_summary
VALUES ('sales', 900);

INSERT INTO seed_summary
SELECT 'sale_items', count(*)
FROM sale_items si
JOIN seed_sales ss ON ss.sale_id = si.sale_id;

INSERT INTO movements (
    product_id,
    warehouse_id,
    direction,
    source_type,
    qty,
    related_entity_id,
    created_by,
    comment,
    created_at,
    warehouse_from,
    warehouse_to,
    type,
    quantity,
    reason
)
SELECT
    si.product_id,
    ss.warehouse_id,
    -1,
    'sale',
    si.qty,
    ss.sale_id,
    ss.cashier_id,
    'Demo sale transaction',
    ss.created_at + interval '5 minutes',
    ss.warehouse_id,
    NULL,
    'SALE',
    si.qty,
    'Demo sale #' || ss.sale_id
FROM sale_items si
JOIN seed_sales ss ON ss.sale_id = si.sale_id
WHERE ss.status IN ('COMPLETED', 'RETURNED');

INSERT INTO movements (
    product_id,
    warehouse_id,
    direction,
    source_type,
    qty,
    related_entity_id,
    created_by,
    comment,
    created_at,
    warehouse_from,
    warehouse_to,
    type,
    quantity,
    reason
)
SELECT
    p.id,
    w.id,
    1,
    'purchase',
    30 + (n % 180),
    NULL,
    (SELECT id FROM users WHERE email LIKE 'demo.%@inventory.local' ORDER BY id OFFSET (n % 12) LIMIT 1),
    'Demo supplier delivery',
    current_date - interval '365 days' + (n * interval '14 hours'),
    NULL,
    w.id,
    'IN',
    30 + (n % 180),
    'Demo inbound purchase order'
FROM generate_series(1, 520) AS n
JOIN products p ON p.sku = 'DEMO-' || lpad((((n * 5) % 360) + 1)::text, 5, '0')
JOIN warehouses w ON w.id = (SELECT id FROM warehouses WHERE name LIKE 'Demo %' ORDER BY id OFFSET (n % 8) LIMIT 1);

INSERT INTO movements (
    product_id,
    warehouse_id,
    direction,
    source_type,
    qty,
    related_entity_id,
    created_by,
    comment,
    created_at,
    warehouse_from,
    warehouse_to,
    type,
    quantity,
    reason
)
SELECT
    p.id,
    wf.id,
    -1,
    'transfer',
    5 + (n % 45),
    NULL,
    (SELECT id FROM users WHERE email LIKE 'demo.%@inventory.local' ORDER BY id OFFSET (n % 12) LIMIT 1),
    'Demo warehouse transfer',
    current_date - interval '300 days' + (n * interval '18 hours'),
    wf.id,
    wt.id,
    'TRANSFER',
    5 + (n % 45),
    'Demo stock transfer'
FROM generate_series(1, 320) AS n
JOIN products p ON p.sku = 'DEMO-' || lpad((((n * 11) % 360) + 1)::text, 5, '0')
JOIN warehouses wf ON wf.id = (SELECT id FROM warehouses WHERE name LIKE 'Demo %' ORDER BY id OFFSET (n % 8) LIMIT 1)
JOIN warehouses wt ON wt.id = (SELECT id FROM warehouses WHERE name LIKE 'Demo %' ORDER BY id OFFSET ((n + 3) % 8) LIMIT 1)
WHERE wf.id <> wt.id;

INSERT INTO movements (
    product_id,
    warehouse_id,
    direction,
    source_type,
    qty,
    related_entity_id,
    created_by,
    comment,
    created_at,
    warehouse_from,
    warehouse_to,
    type,
    quantity,
    reason
)
SELECT
    si.product_id,
    ss.warehouse_id,
    1,
    'return',
    si.qty,
    ss.sale_id,
    ss.cashier_id,
    'Demo returned sale',
    ss.created_at + interval '2 days',
    NULL,
    ss.warehouse_id,
    'RETURN',
    si.qty,
    'Demo return for sale #' || ss.sale_id
FROM sale_items si
JOIN seed_sales ss ON ss.sale_id = si.sale_id
WHERE ss.status = 'RETURNED';

INSERT INTO seed_summary
SELECT 'movements', count(*)
FROM movements
WHERE reason LIKE 'Demo %'
   OR comment LIKE 'Demo %';

INSERT INTO notifications (
    type,
    user_id,
    payload,
    created_at,
    status,
    read_at,
    is_read
)
SELECT
    CASE
        WHEN n % 3 = 0 THEN 'DEMO_LOW_STOCK'
        WHEN n % 3 = 1 THEN 'DEMO_REPORT_READY'
        ELSE 'DEMO_STORE_HEALTH'
    END,
    (SELECT id FROM users WHERE email LIKE 'demo.%@inventory.local' ORDER BY id OFFSET (n % 12) LIMIT 1),
    jsonb_build_object(
        'seed', 'demo',
        'title', CASE
            WHEN n % 3 = 0 THEN 'Low stock alert'
            WHEN n % 3 = 1 THEN 'Monthly report generated'
            ELSE 'Store health update'
        END,
        'productSku', 'DEMO-' || lpad((((n * 17) % 360) + 1)::text, 5, '0'),
        'warehouse', (SELECT name FROM warehouses WHERE name LIKE 'Demo %' ORDER BY id OFFSET (n % 8) LIMIT 1),
        'severity', (ARRAY['info','warning','critical'])[(n % 3) + 1]
    ),
    now() - (n * interval '9 hours'),
    CASE WHEN n % 4 = 0 THEN 'READ' ELSE 'NEW' END,
    CASE WHEN n % 4 = 0 THEN now() - (n * interval '7 hours') ELSE NULL END,
    n % 4 = 0
FROM generate_series(1, 180) AS n;

INSERT INTO seed_summary
VALUES ('notifications', 180);

COMMIT;

SELECT table_name, rows_inserted
FROM seed_summary
ORDER BY table_name;
