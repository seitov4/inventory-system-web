DO $$
DECLARE
    v_store_id INT;
    v_owner_id INT;
    v_warehouse_id INT;
    v_product_id INT;
    v_sale_id INT;
    v_price NUMERIC;
    v_day INT;
    v_i INT;
    v_j INT;
    v_sale_date TIMESTAMP;
BEGIN
    SELECT id, store_id
    INTO v_owner_id, v_store_id
    FROM users
    WHERE email = 'owner@test.local'
    LIMIT 1;

    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'owner@test.local not found';
    END IF;

    IF v_store_id IS NULL THEN
        SELECT id INTO v_store_id
        FROM stores
        WHERE slug = 'default-store'
        LIMIT 1;

        IF v_store_id IS NULL THEN
            INSERT INTO stores (name, slug, owner_email, status, plan, region, address, created_at, updated_at)
            VALUES ('Default Store', 'default-store', 'owner@test.local', 'active', 'standard', 'Almaty', 'Almaty, Kazakhstan', NOW(), NOW())
            RETURNING id INTO v_store_id;
        END IF;

        UPDATE users
        SET store_id = v_store_id
        WHERE id = v_owner_id;
    END IF;

    SELECT id INTO v_warehouse_id
    FROM warehouses
    WHERE store_id = v_store_id
    ORDER BY id
    LIMIT 1;

    IF v_warehouse_id IS NULL THEN
        INSERT INTO warehouses (name, type, store_id, address, created_at, updated_at)
        VALUES ('Main Warehouse', 'warehouse', v_store_id, 'Main Warehouse', NOW(), NOW())
        RETURNING id INTO v_warehouse_id;
    END IF;

    FOR v_day IN 0..29 LOOP
        FOR v_i IN 1..(3 + (v_day % 6)) LOOP
            v_sale_date :=
                (CURRENT_DATE - v_day)
                + ((9 + (v_i % 10)) || ' hours')::INTERVAL
                + ((v_i * 7) || ' minutes')::INTERVAL;

            INSERT INTO sales
                (store_id, cashier_id, warehouse_id, total_amount, discount, payment_type, status, created_at)
            VALUES
                (
                    v_store_id,
                    v_owner_id,
                    v_warehouse_id,
                    0,
                    CASE WHEN v_i % 7 = 0 THEN 200 ELSE 0 END,
                    CASE
                        WHEN v_i % 3 = 0 THEN 'cash'
                        WHEN v_i % 3 = 1 THEN 'card'
                        ELSE 'kaspi'
                    END,
                    CASE
                        WHEN v_i % 20 = 0 THEN 'cancelled'
                        ELSE 'completed'
                    END,
                    v_sale_date
                )
            RETURNING id INTO v_sale_id;

            FOR v_j IN 1..(2 + (v_i % 4)) LOOP
                SELECT id, sale_price
                INTO v_product_id, v_price
                FROM products
                WHERE store_id = v_store_id
                  AND is_active = TRUE
                ORDER BY random()
                LIMIT 1;

                IF v_product_id IS NOT NULL THEN
                    INSERT INTO sale_items
                        (sale_id, product_id, qty, price, discount)
                    VALUES
                        (
                            v_sale_id,
                            v_product_id,
                            1 + (v_j % 3),
                            COALESCE(v_price, 1000),
                            CASE WHEN v_j % 5 = 0 THEN 100 ELSE 0 END
                        );

                    INSERT INTO movements
                        (store_id, product_id, warehouse_id, direction, source_type, qty, related_entity_id, created_by, comment, created_at)
                    VALUES
                        (
                            v_store_id,
                            v_product_id,
                            v_warehouse_id,
                            'OUT',
                            'sale',
                            1 + (v_j % 3),
                            v_sale_id,
                            v_owner_id,
                            'Demo sale movement for multi-day reports',
                            v_sale_date
                        );
                END IF;
            END LOOP;

            UPDATE sales
            SET total_amount = (
                SELECT COALESCE(SUM(qty * price - discount), 0)
                FROM sale_items
                WHERE sale_id = v_sale_id
            )
            WHERE id = v_sale_id;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'DONE. Sales created for last 30 days. store_id=%, owner_id=%', v_store_id, v_owner_id;
END $$;
