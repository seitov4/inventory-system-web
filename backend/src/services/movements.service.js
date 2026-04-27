import pool from "../utils/db.js";
import { createNotification, getUsersByRoles } from "./notification.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

export async function applyMovement({
    type,
    product_id,
    warehouse_from = null,
    warehouse_to = null,
    qty,
    user_id = null,
    reason = null,
    client = null,
}) {
    if (!type) {
        throw createAppError(ERROR_CODES.MOVEMENT_TYPE_REQUIRED, 400);
    }

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

    if (type === "IN" || type === "RETURN" || type === "ADJUST") {
        if (!warehouse_to || isNaN(warehouse_to) || warehouse_to <= 0) {
            throw createAppError(ERROR_CODES.MOVEMENT_WAREHOUSE_TO_INVALID, 400);
        }
    }

    if (type === "OUT" || type === "SALE") {
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
    if (!useExternalClient) {
        client = await pool.connect();
    }

    try {
        if (!useExternalClient) {
            await client.query("BEGIN");
        }

        const productRes = await client.query(
            `SELECT id, name, min_stock FROM products WHERE id = $1`,
            [product_id]
        );
        if (productRes.rows.length === 0) {
            throw createAppError(ERROR_CODES.MOVEMENT_PRODUCT_NOT_FOUND, 400);
        }
        const product = productRes.rows[0];

        if (warehouse_from) {
            const warehouseFromRes = await client.query(
                `SELECT id FROM warehouses WHERE id = $1`,
                [warehouse_from]
            );
            if (warehouseFromRes.rows.length === 0) {
                throw createAppError(ERROR_CODES.MOVEMENT_WAREHOUSE_FROM_NOT_FOUND, 400, {
                    warehouseId: warehouse_from,
                });
            }
        }

        if (warehouse_to) {
            const warehouseToRes = await client.query(
                `SELECT id FROM warehouses WHERE id = $1`,
                [warehouse_to]
            );
            if (warehouseToRes.rows.length === 0) {
                throw createAppError(ERROR_CODES.MOVEMENT_WAREHOUSE_TO_NOT_FOUND, 400, {
                    warehouseId: warehouse_to,
                });
            }
        }

        if (type === "IN" || type === "RETURN") {
            const targetWarehouseId = warehouse_to;

            await client.query(
                `INSERT INTO stock (product_id, warehouse_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (product_id, warehouse_id)
                 DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity`,
                [product_id, targetWarehouseId, qty]
            );
        } else if (type === "OUT" || type === "SALE") {
            const targetWarehouseId = warehouse_from;

            const stockRes = await client.query(
                `SELECT id, quantity FROM stock
                 WHERE product_id = $1 AND warehouse_id = $2
                 FOR UPDATE`,
                [product_id, targetWarehouseId]
            );

            if (stockRes.rows.length === 0) {
                throw createAppError(ERROR_CODES.MOVEMENT_STOCK_NOT_FOUND, 400);
            }

            const stock = stockRes.rows[0];

            if (stock.quantity < qty) {
                throw createAppError(
                    ERROR_CODES.MOVEMENT_INSUFFICIENT_STOCK,
                    type === "SALE" ? 409 : 400,
                    {
                        available: stock.quantity,
                        required: qty,
                    }
                );
            }

            const newQty = stock.quantity - qty;
            await client.query(`UPDATE stock SET quantity = $1 WHERE id = $2`, [
                newQty,
                stock.id,
            ]);
        } else if (type === "TRANSFER") {
            const stockFromRes = await client.query(
                `SELECT id, quantity FROM stock
                 WHERE product_id = $1 AND warehouse_id = $2
                 FOR UPDATE`,
                [product_id, warehouse_from]
            );

            if (stockFromRes.rows.length === 0) {
                throw createAppError(ERROR_CODES.MOVEMENT_STOCK_FROM_NOT_FOUND, 400);
            }

            const stockFrom = stockFromRes.rows[0];

            if (stockFrom.quantity < qty) {
                throw createAppError(
                    ERROR_CODES.MOVEMENT_INSUFFICIENT_STOCK_FROM,
                    400,
                    {
                        available: stockFrom.quantity,
                        required: qty,
                    }
                );
            }

            const newQtyFrom = stockFrom.quantity - qty;
            await client.query(`UPDATE stock SET quantity = $1 WHERE id = $2`, [
                newQtyFrom,
                stockFrom.id,
            ]);

            await client.query(
                `INSERT INTO stock (product_id, warehouse_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (product_id, warehouse_id)
                 DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity`,
                [product_id, warehouse_to, qty]
            );
        } else if (type === "ADJUST") {
            const targetWarehouseId = warehouse_to;

            const stockRes = await client.query(
                `SELECT id, quantity FROM stock
                 WHERE product_id = $1 AND warehouse_id = $2
                 FOR UPDATE`,
                [product_id, targetWarehouseId]
            );

            if (stockRes.rows.length === 0) {
                throw createAppError(ERROR_CODES.MOVEMENT_STOCK_ADJUST_NOT_FOUND, 400);
            }

            const stock = stockRes.rows[0];

            await client.query(`UPDATE stock SET quantity = $1 WHERE id = $2`, [
                qty,
                stock.id,
            ]);
        }

        const warehouseId =
            type === "IN" || type === "RETURN" || type === "ADJUST" || type === "TRANSFER"
                ? warehouse_to
                : warehouse_from;

        const direction =
            type === "IN" || type === "RETURN" || type === "ADJUST" || type === "TRANSFER"
                ? 1
                : -1;

        const reasonText = reason || null;
        const movementResult = await client.query(
            `INSERT INTO movements
                 (product_id, type, warehouse_id, direction, source_type, warehouse_from, warehouse_to, quantity, qty, reason, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [
                product_id,
                type,
                warehouseId,
                direction,
                type,
                warehouse_from,
                warehouse_to,
                qty,
                qty,
                reasonText,
                user_id,
            ]
        );

        const movement = movementResult.rows[0];

        let affectedWarehouseId = null;
        if (["IN", "RETURN", "ADJUST", "TRANSFER"].includes(type)) {
            affectedWarehouseId = warehouse_to;
        } else if (["OUT", "SALE"].includes(type)) {
            affectedWarehouseId = warehouse_from;
        }

        if (affectedWarehouseId) {
            const stockAfterRes = await client.query(
                `SELECT quantity
                 FROM stock
                 WHERE product_id = $1 AND warehouse_id = $2`,
                [product_id, affectedWarehouseId]
            );

            const quantityAfter = stockAfterRes.rows[0]?.quantity || 0;

            if (quantityAfter <= product.min_stock) {
                const userIds = await getUsersByRoles(["owner", "manager"], client);

                if (userIds.length > 0) {
                    await createNotification({
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

        if (!useExternalClient) {
            await client.query("COMMIT");
        }

        return {
            success: true,
            movement,
        };
    } catch (err) {
        console.error("[applyMovement] SQL Error:", {
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint,
            position: err.position,
            where: err.where,
            schema: err.schema,
            table: err.table,
            column: err.column,
            constraint: err.constraint,
            file: err.file,
            line: err.line,
            routine: err.routine,
        });

        if (!useExternalClient) {
            await client.query("ROLLBACK");
        }
        throw err;
    } finally {
        if (!useExternalClient) {
            client.release();
        }
    }
}

export async function createMovementIn({
    product_id,
    warehouse_id,
    quantity,
    reason,
    user_id,
}) {
    const result = await applyMovement({
        type: "IN",
        product_id,
        warehouse_to: warehouse_id,
        qty: quantity,
        reason,
        user_id,
    });
    return result.movement;
}

export async function createMovementOut({
    product_id,
    warehouse_id,
    quantity,
    reason,
    user_id,
}) {
    const result = await applyMovement({
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
                 LEFT JOIN products p ON p.id = m.product_id
                 LEFT JOIN warehouses wf ON wf.id = m.warehouse_from
                 LEFT JOIN warehouses wt ON wt.id = m.warehouse_to
                 LEFT JOIN users u ON u.id = m.created_by
                 WHERE 1=1`;

    const params = [];
    let paramIndex = 1;

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

