import pool from "../utils/db.js";
import { createNotification, getUsersByRoles } from "./notification.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

async function ensureProductInStore(client, productId, storeId) {
    const productRes = await client.query(
        `SELECT id, name, min_stock
         FROM products
         WHERE id = $1 AND store_id = $2 AND is_active IS TRUE`,
        [productId, storeId]
    );
    if (productRes.rows.length === 0) {
        throw createAppError(ERROR_CODES.MOVEMENT_PRODUCT_NOT_FOUND, 400);
    }
    return productRes.rows[0];
}

async function ensureWarehouseInStore(client, warehouseId, storeId, errorCode) {
    if (!warehouseId) {return null;}
    const warehouseRes = await client.query(
        `SELECT id
         FROM warehouses
         WHERE id = $1 AND store_id = $2`,
        [warehouseId, storeId]
    );
    if (warehouseRes.rows.length === 0) {
        throw createAppError(errorCode, 400, { warehouseId });
    }
    return warehouseRes.rows[0];
}

export async function applyMovement({
    store_id,
    type,
    product_id,
    warehouse_from = null,
    warehouse_to = null,
    qty,
    user_id = null,
    reason = null,
    related_entity_id = null,
    client = null,
}) {
    if (!store_id || Number(store_id) <= 0) {
        throw createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
    }

    if (!type) {throw createAppError(ERROR_CODES.MOVEMENT_TYPE_REQUIRED, 400);}

    const validTypes = ["IN", "OUT", "TRANSFER", "SALE", "RETURN", "ADJUST"];
    if (!validTypes.includes(type)) {
        throw createAppError(ERROR_CODES.MOVEMENT_TYPE_INVALID, 400, { type });
    }

    if (!product_id || isNaN(product_id) || product_id <= 0) {
        throw createAppError(ERROR_CODES.MOVEMENT_PRODUCT_ID_INVALID, 400);
    }

    if (!qty || qty <= 0 || isNaN(qty)) {
        throw createAppError(ERROR_CODES.MOVEMENT_QTY_INVALID, 400);
    }

    if (!user_id || isNaN(user_id) || user_id <= 0) {
        throw createAppError(ERROR_CODES.MOVEMENT_USER_ID_INVALID, 400);
    }

    if (["IN", "RETURN", "ADJUST"].includes(type)) {
        if (!warehouse_to || isNaN(warehouse_to) || warehouse_to <= 0) {
            throw createAppError(ERROR_CODES.MOVEMENT_WAREHOUSE_TO_INVALID, 400);
        }
    }

    if (["OUT", "SALE"].includes(type)) {
        if (!warehouse_from || isNaN(warehouse_from) || warehouse_from <= 0) {
            throw createAppError(ERROR_CODES.MOVEMENT_WAREHOUSE_FROM_INVALID, 400);
        }
    }

    if (type === "TRANSFER") {
        if (
            !warehouse_from ||
            isNaN(warehouse_from) ||
            warehouse_from <= 0 ||
            !warehouse_to ||
            isNaN(warehouse_to) ||
            warehouse_to <= 0
        ) {
            throw createAppError(ERROR_CODES.MOVEMENT_WAREHOUSE_TRANSFER_INVALID, 400);
        }
    }

    const useExternalClient = client !== null;
    if (!useExternalClient) {client = await pool.connect();}

    try {
        if (!useExternalClient) {await client.query("BEGIN");}

        const product = await ensureProductInStore(client, product_id, store_id);
        await ensureWarehouseInStore(client, warehouse_from, store_id, ERROR_CODES.MOVEMENT_WAREHOUSE_FROM_NOT_FOUND);
        await ensureWarehouseInStore(client, warehouse_to, store_id, ERROR_CODES.MOVEMENT_WAREHOUSE_TO_NOT_FOUND);

        if (type === "IN" || type === "RETURN") {
            await client.query(
                `INSERT INTO stock (product_id, warehouse_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (product_id, warehouse_id)
                 DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity,
                               updated_at = CURRENT_TIMESTAMP`,
                [product_id, warehouse_to, qty]
            );
        } else if (type === "OUT" || type === "SALE") {
            const stockRes = await client.query(
                `SELECT st.id, st.quantity
                 FROM stock st
                 JOIN warehouses w ON w.id = st.warehouse_id
                 JOIN products p ON p.id = st.product_id
                 WHERE st.product_id = $1
                   AND st.warehouse_id = $2
                   AND w.store_id = $3
                   AND p.store_id = $3
                 FOR UPDATE`,
                [product_id, warehouse_from, store_id]
            );

            if (stockRes.rows.length === 0) {
                throw createAppError(ERROR_CODES.MOVEMENT_STOCK_NOT_FOUND, 400);
            }

            const stock = stockRes.rows[0];
            if (stock.quantity < qty) {
                throw createAppError(
                    ERROR_CODES.MOVEMENT_INSUFFICIENT_STOCK,
                    type === "SALE" ? 409 : 400,
                    { available: stock.quantity, required: qty }
                );
            }

            await client.query(
                `UPDATE stock SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [stock.quantity - qty, stock.id]
            );
        } else if (type === "TRANSFER") {
            const stockFromRes = await client.query(
                `SELECT st.id, st.quantity
                 FROM stock st
                 JOIN warehouses w ON w.id = st.warehouse_id
                 JOIN products p ON p.id = st.product_id
                 WHERE st.product_id = $1
                   AND st.warehouse_id = $2
                   AND w.store_id = $3
                   AND p.store_id = $3
                 FOR UPDATE`,
                [product_id, warehouse_from, store_id]
            );

            if (stockFromRes.rows.length === 0) {
                throw createAppError(ERROR_CODES.MOVEMENT_STOCK_FROM_NOT_FOUND, 400);
            }

            const stockFrom = stockFromRes.rows[0];
            if (stockFrom.quantity < qty) {
                throw createAppError(ERROR_CODES.MOVEMENT_INSUFFICIENT_STOCK_FROM, 400, {
                    available: stockFrom.quantity,
                    required: qty,
                });
            }

            await client.query(
                `UPDATE stock SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [stockFrom.quantity - qty, stockFrom.id]
            );

            await client.query(
                `INSERT INTO stock (product_id, warehouse_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (product_id, warehouse_id)
                 DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity,
                               updated_at = CURRENT_TIMESTAMP`,
                [product_id, warehouse_to, qty]
            );
        } else if (type === "ADJUST") {
            const stockRes = await client.query(
                `SELECT st.id
                 FROM stock st
                 JOIN warehouses w ON w.id = st.warehouse_id
                 JOIN products p ON p.id = st.product_id
                 WHERE st.product_id = $1
                   AND st.warehouse_id = $2
                   AND w.store_id = $3
                   AND p.store_id = $3
                 FOR UPDATE`,
                [product_id, warehouse_to, store_id]
            );

            if (stockRes.rows.length === 0) {
                throw createAppError(ERROR_CODES.MOVEMENT_STOCK_ADJUST_NOT_FOUND, 400);
            }

            await client.query(
                `UPDATE stock SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                [qty, stockRes.rows[0].id]
            );
        }

        const warehouseId = ["IN", "RETURN", "ADJUST", "TRANSFER"].includes(type)
            ? warehouse_to
            : warehouse_from;

        const direction = ["IN", "RETURN", "ADJUST", "TRANSFER"].includes(type) ? 1 : -1;

        const movementResult = await client.query(
            `INSERT INTO movements
                 (store_id, product_id, type, warehouse_id, direction, source_type, warehouse_from, warehouse_to, quantity, qty, reason, related_entity_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11, $12)
             RETURNING *`,
            [
                store_id,
                product_id,
                type,
                warehouseId,
                direction,
                type,
                warehouse_from,
                warehouse_to,
                qty,
                reason || null,
                related_entity_id,
                user_id,
            ]
        );

        const movement = movementResult.rows[0];
        const affectedWarehouseId = ["IN", "RETURN", "ADJUST", "TRANSFER"].includes(type)
            ? warehouse_to
            : warehouse_from;

        if (affectedWarehouseId) {
            const stockAfterRes = await client.query(
                `SELECT st.quantity
                 FROM stock st
                 JOIN warehouses w ON w.id = st.warehouse_id
                 WHERE st.product_id = $1 AND st.warehouse_id = $2 AND w.store_id = $3`,
                [product_id, affectedWarehouseId, store_id]
            );

            const quantityAfter = stockAfterRes.rows[0]?.quantity || 0;
            if (quantityAfter <= product.min_stock) {
                const userIds = await getUsersByRoles(store_id, ["owner", "manager"], client);
                if (userIds.length > 0) {
                    await createNotification({
                        store_id,
                        type: "LOW_STOCK",
                        userIds,
                        payload: {
                            product_id,
                            product_name: product.name,
                            warehouse_id: affectedWarehouseId,
                            quantity: quantityAfter,
                            min_stock: product.min_stock,
                        },
                        client,
                    });
                }
            }
        }

        if (!useExternalClient) {await client.query("COMMIT");}
        return { success: true, movement };
    } catch (err) {
        console.error("[applyMovement] SQL Error:", {
            message: err.message,
            code: err.code,
            detail: err.detail,
            constraint: err.constraint,
        });

        if (!useExternalClient) {await client.query("ROLLBACK");}
        throw err;
    } finally {
        if (!useExternalClient) {client.release();}
    }
}

export async function createMovementIn({ store_id, product_id, warehouse_id, quantity, reason, user_id }) {
    const result = await applyMovement({
        store_id,
        type: "IN",
        product_id,
        warehouse_to: warehouse_id,
        qty: quantity,
        reason,
        user_id,
    });
    return result.movement;
}

export async function createMovementOut({ store_id, product_id, warehouse_id, quantity, reason, user_id }) {
    const result = await applyMovement({
        store_id,
        type: "OUT",
        product_id,
        warehouse_from: warehouse_id,
        qty: quantity,
        reason,
        user_id,
    });
    return result.movement;
}

export async function getMovements({
    store_id,
    limit = 100,
    offset = 0,
    product_id = null,
    warehouse_id = null,
    type = null,
    date_from = null,
    date_to = null,
} = {}) {
    let query = `SELECT m.id,
                        m.product_id,
                        p.name AS product_name,
                        m.type,
                        m.warehouse_from,
                        wf.name AS warehouse_from_name,
                        m.warehouse_to,
                        wt.name AS warehouse_to_name,
                        m.quantity,
                        m.reason,
                        m.created_by,
                        u.email AS created_by_email,
                        m.created_at
                 FROM movements m
                 LEFT JOIN products p ON p.id = m.product_id AND p.store_id = m.store_id
                 LEFT JOIN warehouses wf ON wf.id = m.warehouse_from AND wf.store_id = m.store_id
                 LEFT JOIN warehouses wt ON wt.id = m.warehouse_to AND wt.store_id = m.store_id
                 LEFT JOIN users u ON u.id = m.created_by AND u.store_id = m.store_id
                 WHERE m.store_id = $1`;

    const params = [store_id];
    let paramIndex = 2;

    if (product_id) {
        query += ` AND m.product_id = $${paramIndex++}`;
        params.push(product_id);
    }

    if (warehouse_id) {
        query += ` AND (m.warehouse_from = $${paramIndex} OR m.warehouse_to = $${paramIndex})`;
        params.push(warehouse_id);
        paramIndex++;
    }

    if (type) {
        query += ` AND m.type = $${paramIndex++}`;
        params.push(type);
    }

    if (date_from) {
        query += ` AND m.created_at >= $${paramIndex++}`;
        params.push(date_from);
    }

    if (date_to) {
        query += ` AND m.created_at <= $${paramIndex++}`;
        params.push(date_to);
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
}
