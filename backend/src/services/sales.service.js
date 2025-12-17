import pool from "../utils/db.js";
import { applyMovement } from "./movements.service.js";

/**
 * Create sale - atomic transaction
 */
export async function createSale({
    cashier_id,
    store_id,
    warehouse_id,
    items,
    discount = 0,
    payment_type = "CASH",
}) {
    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("Список позиций продажи пуст");
    }

    for (const item of items) {
        if (!item.product_id) {
            throw new Error("product_id обязателен для каждой позиции");
        }
        const qty = item.qty || item.quantity;
        if (!qty || qty <= 0) {
            throw new Error("qty должен быть положительным числом");
        }
        if (!item.price || item.price < 0) {
            throw new Error("price обязателен и должен быть неотрицательным");
        }
    }

    if (!warehouse_id && !store_id) {
        throw new Error("warehouse_id или store_id обязателен");
    }

    // Use warehouse_id if provided, otherwise use store_id
    const effectiveWarehouseId = warehouse_id || store_id;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Check stock availability for all items (validation before creating sale)
        for (const item of items) {
            const { product_id } = item;
            const qty = item.qty || item.quantity;

            const stockRes = await client.query(
                `SELECT quantity
                 FROM stock
                 WHERE product_id = $1 AND warehouse_id = $2
                 FOR UPDATE`,
                [product_id, effectiveWarehouseId]
            );

            const currentQty = stockRes.rows[0]?.quantity || 0;
            if (currentQty < qty) {
                throw new Error(
                    `Недостаточно товара (product_id=${product_id}) на складе. Доступно: ${currentQty}, требуется: ${qty}`
                );
            }
        }

        // Calculate total
        let totalWithoutGlobalDiscount = 0;
        for (const item of items) {
            const qty = item.qty || item.quantity;
            const linePrice = Number(item.price) || 0;
            const lineDiscount = Number(item.discount || 0);
            totalWithoutGlobalDiscount += (linePrice - lineDiscount) * qty;
        }
        const total = Math.max(0, totalWithoutGlobalDiscount - Number(discount || 0));

        // Create sale record
        const saleRes = await client.query(
            `INSERT INTO sales
                 (cashier_id, store_id, total, discount, payment_type, status)
             VALUES ($1, $2, $3, $4, $5, 'COMPLETED')
             RETURNING id, cashier_id, store_id, total, discount, payment_type, status, created_at`,
            [cashier_id, store_id || effectiveWarehouseId, total, discount, payment_type]
        );
        const sale = saleRes.rows[0];

        // Create sale items and apply movements
        for (const item of items) {
            const { product_id } = item;
            const qty = item.qty || item.quantity;
            const price = Number(item.price) || 0;
            const itemDiscount = Number(item.discount || 0);

            // Insert sale item
            await client.query(
                `INSERT INTO sale_items
                     (sale_id, product_id, quantity, price, discount)
                 VALUES ($1, $2, $3, $4, $5)`,
                [sale.id, product_id, qty, price, itemDiscount]
            );

            // Apply SALE movement (updates stock, creates movement, checks min_stock)
            await applyMovement({
                type: "SALE",
                product_id,
                warehouse_from: effectiveWarehouseId,
                qty: qty,
                reason: `Sale #${sale.id}`,
                user_id: cashier_id || null,
                client, // Use existing transaction
            });
        }

        await client.query("COMMIT");
        return {
            sale_id: sale.id,
            total: sale.total,
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Get sale by ID with items
 */
export async function getSaleById(id) {
    const saleRes = await pool.query(
        `SELECT s.id,
                s.status,
                s.payment_type,
                s.total,
                s.discount,
                s.created_at,
                s.cashier_id,
                s.store_id
         FROM sales s
         WHERE s.id = $1`,
        [id]
    );

    const sale = saleRes.rows[0];
    if (!sale) return null;

    const itemsRes = await pool.query(
        `SELECT si.product_id,
                si.quantity AS qty,
                si.price,
                si.discount,
                p.name,
                p.sku,
                p.barcode
         FROM sale_items si
         JOIN products p ON p.id = si.product_id
         WHERE si.sale_id = $1
         ORDER BY si.id`,
        [id]
    );

    return {
        id: sale.id,
        status: sale.status,
        payment_type: sale.payment_type,
        total: sale.total,
        discount: sale.discount,
        created_at: sale.created_at,
        items: itemsRes.rows.map((item) => ({
            product_id: item.product_id,
            qty: item.qty,
            price: item.price,
            discount: item.discount,
            name: item.name,
            sku: item.sku,
            barcode: item.barcode,
        })),
    };
}

/**
 * Return sale - atomic transaction
 */
export async function returnSale({ sale_id, user_id, warehouse_id }) {
    if (!warehouse_id) {
        throw new Error("warehouse_id обязателен для возврата");
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Read sale with lock
        const saleRes = await client.query(
            `SELECT id, status, store_id
             FROM sales
             WHERE id = $1
             FOR UPDATE`,
            [sale_id]
        );

        const sale = saleRes.rows[0];
        if (!sale) {
            throw new Error("Продажа не найдена");
        }

        if (sale.status === "RETURNED") {
            throw new Error("Продажа уже возвращена");
        }

        // Get sale items
        const itemsRes = await client.query(
            `SELECT product_id, quantity
             FROM sale_items
             WHERE sale_id = $1`,
            [sale_id]
        );
        const items = itemsRes.rows;

        if (items.length === 0) {
            throw new Error("Продажа не содержит позиций");
        }

        // Return items: increase stock and create movements
        for (const item of items) {
            const { product_id, quantity } = item;

            await applyMovement({
                type: "RETURN",
                product_id,
                warehouse_to: warehouse_id,
                qty: quantity,
                reason: `Return of sale #${sale_id}`,
                user_id: user_id || null,
                client, // Use existing transaction
            });
        }

        // Update sale status
        await client.query(
            `UPDATE sales
             SET status = 'RETURNED'
             WHERE id = $1`,
            [sale_id]
        );

        await client.query("COMMIT");
        return {
            sale_id: sale.id,
            status: "RETURNED",
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

// Re-export analytics functions from analytics service
export {
    getDailySales,
    getWeeklySales,
    getMonthlySales,
    getSalesChart,
} from "./sales.analytics.service.js";
