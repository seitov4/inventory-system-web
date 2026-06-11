import pool from "../utils/db.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { applyMovement } from "./movements.service.js";

const ALLOWED_PAYMENT_TYPES = new Set(["CASH", "CARD", "KASPI"]);

function parseDecimal(value, fallback = 0) {
    if (value === null || value === undefined || value === "") {return fallback;}
    if (typeof value === "number") {return Number.isFinite(value) ? value : NaN;}

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

async function ensureWarehouseBelongsToStore(client, warehouseId, storeId) {
    const result = await client.query(
        `SELECT id
         FROM warehouses
         WHERE id = $1 AND store_id = $2`,
        [warehouseId, storeId]
    );
    if (!result.rows.length) {
        throw createAppError(ERROR_CODES.MOVEMENT_WAREHOUSE_FROM_NOT_FOUND, 400, {
            warehouseId,
        });
    }
}

async function ensureProductBelongsToStore(client, productId, storeId) {
    const result = await client.query(
        `SELECT id, name, sale_price
         FROM products
         WHERE id = $1 AND store_id = $2 AND is_active IS TRUE`,
        [productId, storeId]
    );
    if (!result.rows.length) {
        throw createAppError(ERROR_CODES.MOVEMENT_PRODUCT_NOT_FOUND, 400);
    }
    return result.rows[0];
}

export async function createSale({
    store_id,
    cashier_id,
    warehouse_id,
    items,
    discount = 0,
    payment_type = "CASH",
}) {
    if (!store_id) {
        throw createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw createAppError(ERROR_CODES.SALES_ITEMS_REQUIRED, 400);
    }

    const normalizedItems = items.map((item) => ({
        product_id: parsePositiveInteger(item.product_id),
        qty: parsePositiveInteger(item.qty ?? item.quantity),
        discount: parseDecimal(item.discount, 0),
    }));

    for (const item of normalizedItems) {
        if (!item.product_id) {throw createAppError(ERROR_CODES.SALES_ITEM_PRODUCT_ID_REQUIRED, 400);}
        if (!item.qty || item.qty <= 0) {throw createAppError(ERROR_CODES.SALES_ITEM_QTY_INVALID, 400);}
        if (!Number.isFinite(item.discount) || item.discount < 0) {throw createAppError(ERROR_CODES.SALES_ITEM_PRICE_INVALID, 400);}
    }

    const effectiveWarehouseId = parsePositiveInteger(warehouse_id);
    if (!effectiveWarehouseId) {
        throw createAppError(ERROR_CODES.SALES_WAREHOUSE_OR_STORE_REQUIRED, 400);
    }

    const normalizedDiscount = parseDecimal(discount, 0);
    if (!Number.isFinite(normalizedDiscount) || normalizedDiscount < 0) {
        throw createAppError(ERROR_CODES.SALES_ITEM_PRICE_INVALID, 400);
    }

    const normalizedPaymentType = String(payment_type || "CASH").trim().toUpperCase();
    if (!ALLOWED_PAYMENT_TYPES.has(normalizedPaymentType)) {
        throw createAppError(ERROR_CODES.SALES_PAYMENT_TYPE_INVALID, 400, {
            paymentType: payment_type,
        });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await ensureWarehouseBelongsToStore(client, effectiveWarehouseId, store_id);

        const productDetails = new Map();
        for (const item of normalizedItems) {
            const product = await ensureProductBelongsToStore(client, item.product_id, store_id);
            productDetails.set(item.product_id, {
                ...product,
                sale_price: parseDecimal(product.sale_price, 0),
            });

            const stockRes = await client.query(
                `SELECT st.quantity
                 FROM stock st
                 JOIN warehouses w ON w.id = st.warehouse_id
                 JOIN products p ON p.id = st.product_id
                 WHERE st.product_id = $1
                   AND st.warehouse_id = $2
                   AND w.store_id = $3
                   AND p.store_id = $3
                 FOR UPDATE`,
                [item.product_id, effectiveWarehouseId, store_id]
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
            const product = productDetails.get(item.product_id);
            const price = product?.sale_price ?? 0;
            if (!Number.isFinite(price) || price < 0) {
                throw createAppError(ERROR_CODES.SALES_ITEM_PRICE_INVALID, 400);
            }
            if (item.discount > price) {
                throw createAppError(ERROR_CODES.SALES_ITEM_PRICE_INVALID, 400);
            }
            item.price = price;
            totalWithoutGlobalDiscount += (item.price - item.discount) * item.qty;
        }

        if (normalizedDiscount > totalWithoutGlobalDiscount) {
            throw createAppError(ERROR_CODES.SALES_DISCOUNT_INVALID, 400);
        }
        const totalAmount = totalWithoutGlobalDiscount - normalizedDiscount;

        const saleRes = await client.query(
            `INSERT INTO sales
                 (store_id, cashier_id, warehouse_id, total_amount, discount, payment_type, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'completed')
             RETURNING id, cashier_id, warehouse_id, store_id, total_amount, discount, payment_type, status, created_at`,
            [store_id, cashier_id, effectiveWarehouseId, totalAmount, normalizedDiscount, normalizedPaymentType]
        );
        const sale = saleRes.rows[0];
        const responseItems = [];

        for (const item of normalizedItems) {
            await client.query(
                `INSERT INTO sale_items
                     (sale_id, product_id, qty, price, discount)
                 VALUES ($1, $2, $3, $4, $5)`,
                [sale.id, item.product_id, item.qty, item.price, item.discount]
            );

            await applyMovement({
                store_id,
                type: "SALE",
                product_id: item.product_id,
                warehouse_from: effectiveWarehouseId,
                qty: item.qty,
                reason: `Sale #${sale.id}`,
                user_id: cashier_id || null,
                related_entity_id: sale.id,
                client,
            });

            const product = productDetails.get(item.product_id);
            responseItems.push({
                product_id: item.product_id,
                name: product?.name || "Product",
                qty: item.qty,
                price: item.price,
                discount: item.discount,
                line_total: (item.price - item.discount) * item.qty,
            });
        }

        await client.query("COMMIT");
        return {
            sale: {
                id: sale.id,
                total_amount: sale.total_amount,
                total: sale.total_amount,
                payment_type: sale.payment_type,
                status: sale.status,
                created_at: sale.created_at,
            },
            sale_id: sale.id,
            total_amount: sale.total_amount,
            total: sale.total_amount,
            items: responseItems,
            message: "Sale completed successfully.",
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

export async function getSaleById(storeId, id) {
    const saleRes = await pool.query(
        `SELECT s.id,
                s.status,
                s.payment_type,
                s.total_amount,
                s.discount,
                s.created_at,
                s.cashier_id,
                s.store_id
         FROM sales s
         WHERE s.id = $1 AND s.store_id = $2`,
        [id, storeId]
    );

    const sale = saleRes.rows[0];
    if (!sale) {return null;}

    const itemsRes = await pool.query(
        `SELECT si.product_id,
                si.qty,
                si.price,
                si.discount,
                p.name,
                p.sku,
                p.barcode
         FROM sale_items si
         JOIN products p ON p.id = si.product_id AND p.store_id = $2
         WHERE si.sale_id = $1
         ORDER BY si.id`,
        [id, storeId]
    );

    return {
        id: sale.id,
        status: sale.status,
        payment_type: sale.payment_type,
        total_amount: sale.total_amount,
        total: sale.total_amount,
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

export async function returnSale({ store_id, sale_id, user_id, warehouse_id }) {
    if (!warehouse_id) {
        throw createAppError(ERROR_CODES.SALES_RETURN_WAREHOUSE_REQUIRED, 400);
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        await ensureWarehouseBelongsToStore(client, warehouse_id, store_id);

        const saleRes = await client.query(
            `SELECT id, status, store_id
             FROM sales
             WHERE id = $1 AND store_id = $2
             FOR UPDATE`,
            [sale_id, store_id]
        );

        const sale = saleRes.rows[0];
        if (!sale) {throw createAppError(ERROR_CODES.SALES_NOT_FOUND, 404);}
        if (String(sale.status).toLowerCase() === "returned") {
            throw createAppError(ERROR_CODES.SALES_ALREADY_RETURNED, 409);
        }

        const itemsRes = await client.query(
            `SELECT si.product_id, si.qty
             FROM sale_items si
             JOIN products p ON p.id = si.product_id AND p.store_id = $2
             WHERE si.sale_id = $1`,
            [sale_id, store_id]
        );
        const items = itemsRes.rows;

        if (items.length === 0) {throw createAppError(ERROR_CODES.SALES_NO_ITEMS, 400);}

        for (const item of items) {
            await applyMovement({
                store_id,
                type: "RETURN",
                product_id: item.product_id,
                warehouse_to: warehouse_id,
                qty: item.qty,
                reason: `Return of sale #${sale_id}`,
                user_id: user_id || null,
                related_entity_id: sale_id,
                client,
            });
        }

        await client.query(
            `UPDATE sales
             SET status = 'returned'
             WHERE id = $1 AND store_id = $2`,
            [sale_id, store_id]
        );

        await client.query("COMMIT");
        return { sale_id: sale.id, status: "returned" };
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
