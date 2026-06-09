DO $$
DECLARE
    v_store_id INT;
    v_owner_id INT;
    v_warehouse_id INT;
    v_product_id INT;
    v_sale_id INT;
    v_price NUMERIC;
    v_i INT;
    v_j INT;
    v_sale_date TIMESTAMP;
BEGIN
    SELECT id, store_id
    INTO v_owner_id, v_store_id
    FROM users
    WHERE email = 'owner@test.local'
    LIMIT 1;

    SELECT id INTO v_warehouse_id
    FROM warehouses
    WHERE store_id = v_store_id
    ORDER BY id
    LIMIT 1;

    FOR v_i IN 1..4 LOOP
        v_sale_date :=
            (date_trunc('month', CURRENT_DATE)::date + INTERVAL '3 days')
            + ((10 + v_i) || ' hours')::INTERVAL
            + ((v_i * 8) || ' minutes')::INTERVAL;

        INSERT INTO sales
            (store_id, cashier_id, warehouse_id, total_amount, discount, payment_type, status, created_at)
        VALUES
            (
                v_store_id,
                v_owner_id,
                v_warehouse_id,
                0,
                0,
                CASE WHEN v_i % 2 = 0 THEN 'card' ELSE 'cash' END,
                'completed',
                v_sale_date
            )
        RETURNING id INTO v_sale_id;

        FOR v_j IN 1..3 LOOP
            SELECT id, sale_price
            INTO v_product_id, v_price
            FROM products
            WHERE store_id = v_store_id
              AND is_active = TRUE
            ORDER BY random()
            LIMIT 1;

            INSERT INTO sale_items
                (sale_id, product_id, qty, price, discount)
            VALUES
                (
                    v_sale_id,
                    v_product_id,
                    1 + (v_j % 2),
                    COALESCE(v_price, 5000),
                    0
                );
        END LOOP;

        UPDATE sales
        SET total_amount = (
            SELECT COALESCE(SUM(qty * price - discount), 0)
            FROM sale_items
            WHERE sale_id = v_sale_id
        )
        WHERE id = v_sale_id;
    END LOOP;

    RAISE NOTICE 'DONE. Normal demo sales added for day 4.';
END $$;
