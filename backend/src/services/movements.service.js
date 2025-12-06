// backend/src/services/movements.service.js
import pool from "../utils/db.js";

export async function createMovementIn({
                                           product_id,
                                           warehouse_id,
                                           quantity,
                                           reason,
                                           user_id,
                                       }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        await client.query(
            `INSERT INTO stock (product_id, warehouse_id, quantity)
             VALUES ($1, $2, $3)
                 ON CONFLICT (product_id, warehouse_id)
             DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity`,
            [product_id, warehouse_id, quantity]
        );

        const movementResult = await client.query(
            `INSERT INTO movements
                 (product_id, type, warehouse_to, quantity, reason, created_by)
             VALUES ($1, 'IN', $2, $3, $4, $5)
                 RETURNING *`,
            [product_id, warehouse_id, quantity, reason || null, user_id || null]
        );

        await client.query("COMMIT");
        return movementResult.rows[0];
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function createMovementOut({
                                            product_id,
                                            warehouse_id,
                                            quantity,
                                            reason,
                                            user_id,
                                        }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const stockRes = await client.query(
            `SELECT quantity
             FROM stock
             WHERE product_id = $1 AND warehouse_id = $2
                 FOR UPDATE`,
            [product_id, warehouse_id]
        );

        const currentQty = stockRes.rows[0]?.quantity || 0;
        if (currentQty < quantity) {
            throw new Error("Недостаточно товара на складе");
        }

        await client.query(
            `UPDATE stock
             SET quantity = quantity - $3
             WHERE product_id = $1 AND warehouse_id = $2`,
            [product_id, warehouse_id, quantity]
        );

        const movementResult = await client.query(
            `INSERT INTO movements
                 (product_id, type, warehouse_from, quantity, reason, created_by)
             VALUES ($1, 'OUT', $2, $3, $4, $5)
                 RETURNING *`,
            [product_id, warehouse_id, quantity, reason || null, user_id || null]
        );

        await client.query("COMMIT");
        return movementResult.rows[0];
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function getMovements({ limit = 100, offset = 0 } = {}) {
    const result = await pool.query(
        `SELECT m.id,
                m.product_id,
                p.name  AS product_name,
                m.type,
                m.warehouse_from,
                m.warehouse_to,
                m.quantity,
                m.reason,
                m.created_by,
                u.email AS created_by_email,
                m.created_at
         FROM movements m
         LEFT JOIN products p ON p.id = m.product_id
         LEFT JOIN users u ON u.id = m.created_by
         ORDER BY m.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    return result.rows;
}
