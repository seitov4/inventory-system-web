import pool from "../utils/db.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { applyMovement } from "./movements.service.js";

function parseDecimal(value, fallback = 0) {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : NaN;
    }

    const raw = String(value).trim().replace(/\s/g, "");
    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");

    let normalized = raw;
    if (lastComma >= 0 && lastDot >= 0) {
        const decimalSeparator = lastComma > lastDot ? "," : ".";
        const thousandsSeparator = decimalSeparator === "," ? "." : ",";
        normalized = raw
            .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
            .replace(decimalSeparator, ".");
    } else if (lastComma >= 0) {
        normalized = raw.replace(",", ".");
    }

    return Number(normalized);
}

function parsePositiveInteger(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

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
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw createAppError(ERROR_CODES.SALES_ITEMS_REQUIRED, 400);
    }

    const normalizedItems = items.map((item) => ({
        product_id: parsePositiveInteger(item.product_id),
        qty: parsePositiveInteger(item.qty ?? item.quantity),
        price: parseDecimal(item.price),
        discount: parseDecimal(item.discount, 0),
    }));

    for (const item of normalizedItems) {
        if (!item.product_id) {
            throw createAppError(ERROR_CODES.SALES_ITEM_PRODUCT_ID_REQUIRED, 400);
        }

        if (!item.qty || item.qty <= 0) {
            throw createAppError(ERROR_CODES.SALES_ITEM_QTY_INVALID, 400);
        }

        if (!Number.isFinite(item.price) || item.price < 0) {
            throw createAppError(ERROR_CODES.SALES_ITEM_PRICE_INVALID, 400);
        }

        if (!Number.isFinite(item.discount) || item.discount < 0) {
            throw createAppError(ERROR_CODES.SALES_ITEM_PRICE_INVALID, 400);
        }
    }

    const parsedWarehouseId = parsePositiveInteger(warehouse_id);
    const parsedStoreId = parsePositiveInteger(store_id);

    if (!parsedWarehouseId && !parsedStoreId) {
        throw createAppError(ERROR_CODES.SALES_WAREHOUSE_OR_STORE_REQUIRED, 400);
    }

    const effectiveWarehouseId = parsedWarehouseId || parsedStoreId;
    const normalizedDiscount = parseDecimal(discount, 0);
    if (!Number.isFinite(normalizedDiscount) || normalizedDiscount < 0) {
        throw createAppError(ERROR_CODES.SALES_ITEM_PRICE_INVALID, 400);
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const item of normalizedItems) {
            const stockRes = await client.query(
                `SELECT quantity
                 FROM stock
                 WHERE product_id = $1 AND warehouse_id = $2
                 FOR UPDATE`,
                [item.product_id, effectiveWarehouseId]
            );

            const currentQty = stockRes.rows[0]?.quantity || 0;
            if (currentQty < item.qty) {
                throw createAppError(ERROR_CODES.SALES_INSUFFICIENT_STOCK, 409, {
                    productId: item.product_id,
                    available: currentQty,
                    required: item.qty,
                });
            }
        }

        let totalWithoutGlobalDiscount = 0;
        for (const item of normalizedItems) {
            totalWithoutGlobalDiscount += (item.price - item.discount) * item.qty;
        }
        const total = Math.max(0, totalWithoutGlobalDiscount - normalizedDiscount);

        const saleRes = await client.query(
            `INSERT INTO sales
                 (cashier_id, warehouse_id, store_id, total, total_amount, discount, payment_type, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'COMPLETED')
             RETURNING id, cashier_id, warehouse_id, store_id, total, total_amount, discount, payment_type, status, created_at`,
            [
                cashier_id,
                effectiveWarehouseId,
                effectiveWarehouseId,
                total,
                total,
                normalizedDiscount,
                payment_type,
            ]
        );
        const sale = saleRes.rows[0];

        for (const item of normalizedItems) {
            await client.query(
                `INSERT INTO sale_items
                     (sale_id, product_id, qty, quantity, price, discount)
                 VALUES ($1, $2, $3, $3, $4, $5)`,
                [sale.id, item.product_id, item.qty, item.price, item.discount]
            );

            await applyMovement({
                type: "SALE",
                product_id: item.product_id,
                warehouse_from: effectiveWarehouseId,
                qty: item.qty,
                reason: `Sale #${sale.id}`,
                user_id: cashier_id || null,
                client,
            });
        }

        await client.query("COMMIT");
        return {
            sale_id: sale.id,
            total: sale.total,
        };
    } catch (err) {
        console.error("[Sales Service] Failed to create sale:", {
            message: err.message,
            code: err.code,
            detail: err.detail,
            constraint: err.constraint,
            warehouse_id: effectiveWarehouseId,
            item_count: normalizedItems.length,
        });
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
    if (!sale) {
        return null;
    }

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
        throw createAppError(ERROR_CODES.SALES_RETURN_WAREHOUSE_REQUIRED, 400);
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const saleRes = await client.query(
            `SELECT id, status, store_id
             FROM sales
             WHERE id = $1
             FOR UPDATE`,
            [sale_id]
        );

        const sale = saleRes.rows[0];
        if (!sale) {
            throw createAppError(ERROR_CODES.SALES_NOT_FOUND, 404);
        }

        if (sale.status === "RETURNED") {
            throw createAppError(ERROR_CODES.SALES_ALREADY_RETURNED, 409);
        }

        const itemsRes = await client.query(
            `SELECT product_id, quantity
             FROM sale_items
             WHERE sale_id = $1`,
            [sale_id]
        );
        const items = itemsRes.rows;

        if (items.length === 0) {
            throw createAppError(ERROR_CODES.SALES_NO_ITEMS, 400);
        }

        for (const item of items) {
            const { product_id, quantity } = item;
            await applyMovement({
                type: "RETURN",
                product_id,
                warehouse_to: warehouse_id,
                qty: quantity,
                reason: `Return of sale #${sale_id}`,
                user_id: user_id || null,
                client,
            });
        }

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

export {
    getDailySales,
    getWeeklySales,
    getMonthlySales,
    getSalesChart,
} from "./sales.analytics.service.js";
