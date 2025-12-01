// backend/src/services/sales.service.js
import pool from "../utils/db.js";

export async function createSale({
                                     cashier_id,
                                     store_id,
                                     warehouse_id,
                                     items,
                                     discount = 0,
                                     payment_type = "cash",
                                 }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("Список позиций продажи пуст");
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // проверка остатков
        for (const item of items) {
            const { product_id, quantity } = item;
            const stockRes = await client.query(
                `SELECT quantity
                 FROM stock
                 WHERE product_id = $1 AND warehouse_id = $2
                 FOR UPDATE`,
                [product_id, warehouse_id]
            );
            const currentQty = stockRes.rows[0]?.quantity || 0;
            if (currentQty < quantity) {
                throw new Error(
                    `Недостаточно товара (product_id=${product_id}) на складе`
                );
            }
        }

        let totalWithoutGlobalDiscount = 0;
        for (const item of items) {
            const linePrice = Number(item.price) || 0;
            const lineDiscount = Number(item.discount || 0);
            totalWithoutGlobalDiscount +=
                (linePrice - lineDiscount) * Number(item.quantity);
        }
        const total = totalWithoutGlobalDiscount - Number(discount || 0);

        const saleRes = await client.query(
            `INSERT INTO sales
                 (cashier_id, store_id, total, discount, payment_type, status)
             VALUES ($1, $2, $3, $4, $5, 'COMPLETED')
             RETURNING id, cashier_id, store_id, total, discount, payment_type, status, created_at`,
            [cashier_id, store_id, total, discount, payment_type]
        );
        const sale = saleRes.rows[0];

        for (const item of items) {
            const { product_id, quantity, price, discount: itemDiscount = 0 } =
                item;

            await client.query(
                `INSERT INTO sale_items
                     (sale_id, product_id, quantity, price, discount)
                 VALUES ($1, $2, $3, $4, $5)`,
                [sale.id, product_id, quantity, price, itemDiscount]
            );

            await client.query(
                `UPDATE stock
                 SET quantity = quantity - $3
                 WHERE product_id = $1 AND warehouse_id = $2`,
                [product_id, warehouse_id, quantity]
            );

            await client.query(
                `INSERT INTO movements
                     (product_id, type, warehouse_from, quantity, reason, created_by)
                 VALUES ($1, 'SALE', $2, $3, $4, $5)`,
                [
                    product_id,
                    warehouse_id,
                    quantity,
                    `Sale #${sale.id}`,
                    cashier_id || null,
                ]
            );

            // low stock → уведомление
            await client.query(
                `INSERT INTO notifications (type, user_id, payload)
                 SELECT 'LOW_STOCK',
                        u.id,
                        jsonb_build_object(
                            'product_id', p.id,
                            'product_name', p.name,
                            'quantity', s.quantity,
                            'min_stock', p.min_stock
                        )
                 FROM products p
                 JOIN stock s
                   ON s.product_id = p.id
                  AND s.warehouse_id = $2
                 JOIN users u
                   ON u.role IN ('manager','owner')
                 WHERE p.id = $1
                   AND s.quantity <= p.min_stock`,
                [product_id, warehouse_id]
            );
        }

        await client.query("COMMIT");
        return sale;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function getSaleById(id) {
    const saleRes = await pool.query(
        `SELECT id,
                cashier_id,
                store_id,
                total,
                discount,
                payment_type,
                status,
                created_at
         FROM sales
         WHERE id = $1`,
        [id]
    );

    const sale = saleRes.rows[0];
    if (!sale) return null;

    const itemsRes = await pool.query(
        `SELECT si.id,
                si.product_id,
                p.name AS product_name,
                si.quantity,
                si.price,
                si.discount
         FROM sale_items si
         JOIN products p ON p.id = si.product_id
         WHERE si.sale_id = $1`,
        [id]
    );

    sale.items = itemsRes.rows;
    return sale;
}

export async function returnSale({ sale_id, user_id, warehouse_id }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const saleRes = await client.query(
            `SELECT id, status
             FROM sales
             WHERE id = $1
             FOR UPDATE`,
            [sale_id]
        );
        const sale = saleRes.rows[0];
        if (!sale) throw new Error("Продажа не найдена");
        if (sale.status === "RETURNED") {
            throw new Error("Продажа уже возвращена");
        }

        const itemsRes = await client.query(
            `SELECT product_id, quantity, price, discount
             FROM sale_items
             WHERE sale_id = $1`,
            [sale_id]
        );
        const items = itemsRes.rows;

        for (const item of items) {
            const { product_id, quantity } = item;

            await client.query(
                `INSERT INTO stock (product_id, warehouse_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (product_id, warehouse_id)
                 DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity`,
                [product_id, warehouse_id, quantity]
            );

            await client.query(
                `INSERT INTO movements
                     (product_id, type, warehouse_to, quantity, reason, created_by)
                 VALUES ($1, 'RETURN', $2, $3, $4, $5)`,
                [
                    product_id,
                    warehouse_id,
                    quantity,
                    `Return of sale #${sale_id}`,
                    user_id || null,
                ]
            );
        }

        await client.query(
            `UPDATE sales
             SET status = 'RETURNED'
             WHERE id = $1`,
            [sale_id]
        );

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function getDailySales() {
    const res = await pool.query(
        `SELECT DATE(created_at) AS date,
                SUM(total)       AS total
         FROM sales
         WHERE status = 'COMPLETED'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`
    );
    return res.rows;
}

export async function getWeeklySales() {
    const res = await pool.query(
        `SELECT date_trunc('week', created_at)::date AS week,
                SUM(total)                        AS total
         FROM sales
         WHERE status = 'COMPLETED'
         GROUP BY date_trunc('week', created_at)
         ORDER BY week`
    );
    return res.rows;
}

export async function getMonthlySales() {
    const res = await pool.query(
        `SELECT date_trunc('month', created_at)::date AS month,
                SUM(total)                           AS total
         FROM sales
         WHERE status = 'COMPLETED'
         GROUP BY date_trunc('month', created_at)
         ORDER BY month`
    );
    return res.rows;
}

export async function getSalesChart() {
    const res = await pool.query(
        `SELECT created_at::date AS date,
                SUM(total)       AS total
         FROM sales
         WHERE status = 'COMPLETED'
         GROUP BY created_at::date
         ORDER BY created_at::date`
    );
    return res.rows;
}
