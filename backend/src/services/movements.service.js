import pool from "../utils/db.js";
import { createNotification, getUsersByRoles } from "./notification.service.js";

/**
 * Unified movement application service
 * This is the ONLY way to change stock quantities
 * 
 * @param {Object} params
 * @param {string} params.type - Movement type: IN | OUT | TRANSFER | SALE | RETURN | ADJUST
 * @param {number} params.product_id - Product ID
 * @param {number} [params.warehouse_from] - Source warehouse (required for OUT, SALE, TRANSFER)
 * @param {number} [params.warehouse_to] - Destination warehouse (required for IN, RETURN, TRANSFER)
 * @param {number} params.qty - Quantity (always positive)
 * @param {number} [params.user_id] - User who created the movement
 * @param {string} [params.reason] - Optional reason for movement
 * @param {Object} [params.client] - Optional database client for use within existing transaction
 * @returns {Object} { success: true, movement }
 */
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
    // Strict validation
    if (!type) {
        throw new Error("type обязателен");
    }

    const validTypes = ["IN", "OUT", "TRANSFER", "SALE", "RETURN", "ADJUST"];
    if (!validTypes.includes(type)) {
        throw new Error(`Недопустимый тип движения: ${type}`);
    }

    if (!product_id || isNaN(product_id) || product_id <= 0) {
        throw new Error("product_id обязателен и должен быть положительным числом");
    }

    if (!qty || qty <= 0 || isNaN(qty)) {
        throw new Error("qty должно быть > 0");
    }

    if (!user_id || isNaN(user_id) || user_id <= 0) {
        throw new Error("user_id обязателен и должен быть положительным числом");
    }

    // Domain-specific warehouse validation
    if (type === "IN") {
        if (!warehouse_to || isNaN(warehouse_to) || warehouse_to <= 0) {
            throw new Error("warehouse_to обязателен для IN и должен быть положительным числом");
        }
    }

    if (type === "OUT") {
        if (!warehouse_from || isNaN(warehouse_from) || warehouse_from <= 0) {
            throw new Error("warehouse_from обязателен для OUT и должен быть положительным числом");
        }
    }

    if (type === "TRANSFER") {
        if (!warehouse_from || isNaN(warehouse_from) || warehouse_from <= 0 ||
            !warehouse_to || isNaN(warehouse_to) || warehouse_to <= 0) {
            throw new Error("warehouse_from и warehouse_to обязательны для TRANSFER и должны быть положительными числами");
        }
    }

    if (type === "SALE") {
        if (!warehouse_from || isNaN(warehouse_from) || warehouse_from <= 0) {
            throw new Error("warehouse_from обязателен для SALE и должен быть положительным числом");
        }
    }

    if (type === "RETURN") {
        if (!warehouse_to || isNaN(warehouse_to) || warehouse_to <= 0) {
            throw new Error("warehouse_to обязателен для RETURN и должен быть положительным числом");
        }
    }

    if (type === "ADJUST") {
        if (!warehouse_to || isNaN(warehouse_to) || warehouse_to <= 0) {
            throw new Error("warehouse_to обязателен для ADJUST и должен быть положительным числом");
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

        // Validate product exists
        const productRes = await client.query(
            `SELECT id, name, min_stock FROM products WHERE id = $1`,
            [product_id]
        );
        if (productRes.rows.length === 0) {
            throw new Error("Товар не найден");
        }
        const product = productRes.rows[0];

        // Validate warehouses exist (only check warehouses that are required for this type)
        // This validation is important because FK constraints will fail later if warehouse doesn't exist
        if (warehouse_from) {
            const warehouseFromRes = await client.query(
                `SELECT id FROM warehouses WHERE id = $1`,
                [warehouse_from]
            );
            if (warehouseFromRes.rows.length === 0) {
                throw new Error(`Склад-источник с ID ${warehouse_from} не найден. Сначала создайте склад.`);
            }
        }

        if (warehouse_to) {
            const warehouseToRes = await client.query(
                `SELECT id FROM warehouses WHERE id = $1`,
                [warehouse_to]
            );
            if (warehouseToRes.rows.length === 0) {
                throw new Error(`Склад-назначение с ID ${warehouse_to} не найден. Сначала создайте склад.`);
            }
        }

        // Handle stock operations based on movement type
        // Determine which warehouse to work with
        const warehouseId =
            type === "IN" || type === "RETURN" || type === "ADJUST" || 
            (type === "TRANSFER" && true) // TRANSFER handles both warehouses separately
                ? warehouse_to
                : warehouse_from;

        if (type === "IN" || type === "RETURN") {
            // For IN and RETURN: work with warehouse_to, create if needed
            // Use INSERT ... ON CONFLICT DO UPDATE to atomically create or update stock
            const targetWarehouseId = warehouse_to;

            await client.query(
                `INSERT INTO stock (product_id, warehouse_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (product_id, warehouse_id)
                 DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity`,
                [product_id, targetWarehouseId, qty]
            );
        } else if (type === "OUT" || type === "SALE") {
            // For OUT and SALE: work with warehouse_from (stock must exist)
            const targetWarehouseId = warehouse_from;
            
            let stockRes = await client.query(
                `SELECT id, quantity FROM stock 
                 WHERE product_id = $1 AND warehouse_id = $2
                 FOR UPDATE`,
                [product_id, targetWarehouseId]
            );

            if (stockRes.rows.length === 0) {
                throw new Error("Остаток не найден для данного товара и склада");
            }

            const stock = stockRes.rows[0];
            
            // Check availability
            if (stock.quantity < qty) {
                throw new Error(
                    `Недостаточно товара на складе. Доступно: ${stock.quantity}, требуется: ${qty}`
                );
            }

            // Calculate new quantity and update
            const newQty = stock.quantity - qty;
            await client.query(
                `UPDATE stock SET quantity = $1 WHERE id = $2`,
                [newQty, stock.id]
            );
        } else if (type === "TRANSFER") {
            // For TRANSFER: handle both warehouses
            // First, warehouse_from (must exist)
            let stockFromRes = await client.query(
                `SELECT id, quantity FROM stock 
                 WHERE product_id = $1 AND warehouse_id = $2
                 FOR UPDATE`,
                [product_id, warehouse_from]
            );

            if (stockFromRes.rows.length === 0) {
                throw new Error("Остаток не найден для склада-источника");
            }

            const stockFrom = stockFromRes.rows[0];
            
            // Check availability
            if (stockFrom.quantity < qty) {
                throw new Error(
                    `Недостаточно товара на складе-источнике. Доступно: ${stockFrom.quantity}, требуется: ${qty}`
                );
            }

            // Decrease from warehouse_from
            const newQtyFrom = stockFrom.quantity - qty;
            await client.query(
                `UPDATE stock SET quantity = $1 WHERE id = $2`,
                [newQtyFrom, stockFrom.id]
            );

            // Second, warehouse_to (create if needed and increase quantity atomically)
            await client.query(
                `INSERT INTO stock (product_id, warehouse_id, quantity)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (product_id, warehouse_id)
                 DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity`,
                [product_id, warehouse_to, qty]
            );
        } else if (type === "ADJUST") {
            // For ADJUST: stock must exist
            const targetWarehouseId = warehouse_to;
            
            let stockRes = await client.query(
                `SELECT id, quantity FROM stock 
                 WHERE product_id = $1 AND warehouse_id = $2
                 FOR UPDATE`,
                [product_id, targetWarehouseId]
            );

            if (stockRes.rows.length === 0) {
                throw new Error("Запись stock не найдена для корректировки");
            }

            const stock = stockRes.rows[0];
            
            // Set to specific quantity
            await client.query(
                `UPDATE stock SET quantity = $1 WHERE id = $2`,
                [qty, stock.id]
            );
        }

        // Create movement record
        // Use quantity (legacy field name that exists in current DB schema)
        // Also use reason (legacy field name)
        const reasonText = reason || comment || null;
        const movementResult = await client.query(
            `INSERT INTO movements
                 (product_id, type, warehouse_from, warehouse_to, quantity, reason, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [product_id, type, warehouse_from, warehouse_to, qty, reasonText, user_id]
        );

        const movement = movementResult.rows[0];

        // Check min_stock and create notifications if needed
        // For IN, RETURN, ADJUST: use warehouse_to
        // For OUT, SALE: use warehouse_from
        // For TRANSFER: use warehouse_to (destination)
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
                // Get users with owner/manager roles
                const userIds = await getUsersByRoles(["owner", "manager"], client);

                if (userIds.length > 0) {
                    // Create notification for each user
                    await createNotification({
                        type: "LOW_STOCK",
                        userIds,
                        payload: {
                            product_id: product_id,
                            product_name: product.name,
                            warehouse_id: affectedWarehouseId,
                            quantity: quantityAfter,
                            min_stock: product.min_stock,
                        },
                        client, // Use existing transaction
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
        // Log detailed error information for debugging
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

/**
 * Legacy methods - kept for backward compatibility
 * These now use applyMovement internally
 */

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

/**
 * Get movements with filters
 */
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
