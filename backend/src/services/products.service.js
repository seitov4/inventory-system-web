import pool from "../utils/db.js";
import { createAppError, resolveErrorMessage } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

async function getDefaultWarehouse(storeId, client = pool) {
    const result = await client.query(
        `SELECT id
         FROM warehouses
         WHERE store_id = $1
         ORDER BY id
         LIMIT 1`,
        [storeId]
    );
    if (result.rows.length === 0) {
        throw createAppError(ERROR_CODES.PRODUCT_DEFAULT_WAREHOUSE_NOT_FOUND, 400);
    }
    return result.rows[0].id;
}

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

function validateProductData({ name, sku, purchase_price, sale_price, min_stock }) {
    if (!name || typeof name !== "string" || name.trim() === "") {
        throw createAppError(ERROR_CODES.PRODUCT_NAME_REQUIRED, 400);
    }

    if (!sku || typeof sku !== "string" || sku.trim() === "") {
        throw createAppError(ERROR_CODES.PRODUCT_SKU_REQUIRED, 400);
    }

    const purchasePrice = parseDecimal(purchase_price);
    const salePrice = parseDecimal(sale_price);
    const minStock = parseDecimal(min_stock);

    if (isNaN(purchasePrice) || purchasePrice < 0) {
        throw createAppError(ERROR_CODES.PRODUCT_PURCHASE_PRICE_INVALID, 400);
    }

    if (isNaN(salePrice) || salePrice < 0) {
        throw createAppError(ERROR_CODES.PRODUCT_SALE_PRICE_INVALID, 400);
    }

    if (isNaN(minStock) || minStock < 0) {
        throw createAppError(ERROR_CODES.PRODUCT_MIN_STOCK_INVALID, 400);
    }
}

function normalizeProductData(data) {
    return {
        ...data,
        name: typeof data.name === "string" ? data.name.trim() : data.name,
        sku: typeof data.sku === "string" ? data.sku.trim() : data.sku,
        barcode:
            typeof data.barcode === "string" && data.barcode.trim() !== ""
                ? data.barcode.trim()
                : null,
        purchase_price: parseDecimal(data.purchase_price),
        sale_price: parseDecimal(data.sale_price),
        min_stock: parseDecimal(data.min_stock, 0),
    };
}

async function checkSkuExists(storeId, sku, excludeId = null, client = pool) {
    let query = `SELECT id FROM products WHERE store_id = $1 AND sku = $2`;
    const params = [storeId, sku];

    if (excludeId) {
        query += ` AND id <> $3`;
        params.push(excludeId);
    }

    const result = await client.query(query, params);
    return result.rows.length > 0;
}

async function checkBarcodeExists(storeId, barcode, excludeId = null, client = pool) {
    if (!barcode) {return false;}

    let query = `SELECT id FROM products WHERE store_id = $1 AND barcode = $2`;
    const params = [storeId, barcode];

    if (excludeId) {
        query += ` AND id <> $3`;
        params.push(excludeId);
    }

    const result = await client.query(query, params);
    return result.rows.length > 0;
}

function productSelect() {
    return `id,
            store_id,
            name,
            sku,
            category,
            barcode,
            purchase_price,
            sale_price,
            min_stock,
            created_at,
            updated_at`;
}

export async function getAllProducts(storeId) {
    const result = await pool.query(
        `SELECT ${productSelect()}
         FROM products
         WHERE store_id = $1 AND is_active IS TRUE
         ORDER BY name`,
        [storeId]
    );
    return result.rows;
}

export async function getProductById(storeId, id) {
    const result = await pool.query(
        `SELECT ${productSelect()}
         FROM products
         WHERE id = $1 AND store_id = $2 AND is_active IS TRUE`,
        [id, storeId]
    );
    return result.rows[0] || null;
}

export async function getProductByBarcode(storeId, barcode) {
    const result = await pool.query(
        `SELECT ${productSelect()}
         FROM products
         WHERE barcode = $1 AND store_id = $2 AND is_active IS TRUE`,
        [barcode, storeId]
    );
    return result.rows[0] || null;
}

export async function getProductsWithLeft(storeId) {
    const result = await pool.query(
        `SELECT p.id,
                p.store_id,
                p.name,
                p.sku,
                p.category,
                p.barcode,
                p.purchase_price,
                p.sale_price,
                p.min_stock,
                CAST(COALESCE(SUM(s.quantity), 0) AS INTEGER) AS quantity
         FROM products p
         LEFT JOIN stock s ON s.product_id = p.id
             AND s.warehouse_id IN (SELECT id FROM warehouses WHERE store_id = $1)
         WHERE p.store_id = $1 AND p.is_active IS TRUE
         GROUP BY p.id
         ORDER BY p.name`,
        [storeId]
    );
    return result.rows;
}

export async function getLowStockProducts(storeId) {
    const result = await pool.query(
        `SELECT p.id,
                p.store_id,
                p.name,
                p.sku,
                p.category,
                p.barcode,
                p.purchase_price,
                p.sale_price,
                p.min_stock,
                CAST(COALESCE(SUM(s.quantity), 0) AS INTEGER) AS quantity
         FROM products p
         LEFT JOIN stock s ON s.product_id = p.id
             AND s.warehouse_id IN (SELECT id FROM warehouses WHERE store_id = $1)
         WHERE p.store_id = $1 AND p.is_active IS TRUE
         GROUP BY p.id
         HAVING COALESCE(SUM(s.quantity), 0) <= p.min_stock
         ORDER BY quantity ASC`,
        [storeId]
    );
    return result.rows;
}

export async function createProduct(storeId, {
    name,
    sku,
    category,
    barcode,
    purchase_price,
    sale_price,
    min_stock = 0,
}) {
    const normalized = normalizeProductData({
        name,
        sku,
        category,
        barcode,
        purchase_price,
        sale_price,
        min_stock,
    });
    ({ name, sku, category, barcode, purchase_price, sale_price, min_stock } = normalized);

    validateProductData({ name, sku, purchase_price, sale_price, min_stock });

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        if (await checkSkuExists(storeId, sku, null, client)) {
            throw createAppError(ERROR_CODES.PRODUCT_SKU_EXISTS, 409, { sku });
        }

        if (barcode && (await checkBarcodeExists(storeId, barcode, null, client))) {
            throw createAppError(ERROR_CODES.PRODUCT_BARCODE_EXISTS, 409, { barcode });
        }

        const productResult = await client.query(
            `INSERT INTO products
                 (store_id, name, sku, category, barcode, purchase_price, sale_price, min_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING ${productSelect()}`,
            [storeId, name, sku, category || null, barcode || null, purchase_price, sale_price, min_stock]
        );

        const product = productResult.rows[0];

        try {
            const warehouseId = await getDefaultWarehouse(storeId, client);
            await client.query(
                `INSERT INTO stock (product_id, warehouse_id, quantity)
                 VALUES ($1, $2, 0)
                 ON CONFLICT (product_id, warehouse_id) DO NOTHING`,
                [product.id, warehouseId]
            );
        } catch (warehouseError) {
            console.warn(
                `[Products Service] Could not create stock for product ${product.id}:`,
                warehouseError.message
            );
        }

        await client.query("COMMIT");
        return product;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function updateProduct(storeId, id, {
    name,
    sku,
    category,
    barcode,
    purchase_price,
    sale_price,
    min_stock,
}) {
    const normalized = normalizeProductData({
        name,
        sku,
        category,
        barcode,
        purchase_price,
        sale_price,
        min_stock,
    });
    ({ name, sku, category, barcode, purchase_price, sale_price, min_stock } = normalized);

    validateProductData({ name, sku, purchase_price, sale_price, min_stock });

    if (await checkSkuExists(storeId, sku, id)) {
        throw createAppError(ERROR_CODES.PRODUCT_SKU_EXISTS, 409, { sku });
    }

    if (barcode && (await checkBarcodeExists(storeId, barcode, id))) {
        throw createAppError(ERROR_CODES.PRODUCT_BARCODE_EXISTS, 409, { barcode });
    }

    const result = await pool.query(
        `UPDATE products
         SET name           = $3,
             sku            = $4,
             category       = $5,
             barcode        = $6,
             purchase_price = $7,
             sale_price     = $8,
             min_stock      = $9,
             updated_at     = CURRENT_TIMESTAMP
         WHERE id = $1 AND store_id = $2 AND is_active IS TRUE
         RETURNING ${productSelect()}`,
        [id, storeId, name, sku, category || null, barcode || null, purchase_price, sale_price, min_stock]
    );

    return result.rows[0] || null;
}

export async function deleteProduct(storeId, id) {
    const productResult = await pool.query(
        `SELECT id FROM products WHERE id = $1 AND store_id = $2 AND is_active IS TRUE`,
        [id, storeId]
    );

    if (productResult.rows.length === 0) {return null;}

    const referenceResult = await pool.query(
        `SELECT
             (SELECT COUNT(*) FROM sale_items si JOIN sales sa ON sa.id = si.sale_id WHERE si.product_id = $1 AND sa.store_id = $2) AS sale_items,
             (SELECT COUNT(*) FROM movements WHERE product_id = $1 AND store_id = $2) AS movements,
             (SELECT COUNT(*) FROM stock st JOIN warehouses w ON w.id = st.warehouse_id WHERE st.product_id = $1 AND w.store_id = $2) AS stock`,
        [id, storeId]
    );

    const references = referenceResult.rows[0] || {};
    const hasHistory =
        Number(references.sale_items || 0) > 0 ||
        Number(references.movements || 0) > 0 ||
        Number(references.stock || 0) > 0;

    if (hasHistory) {
        const archivedResult = await pool.query(
            `UPDATE products
             SET is_active = FALSE,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND store_id = $2 AND is_active IS TRUE
             RETURNING id`,
            [id, storeId]
        );
        return { id: archivedResult.rows[0].id, archived: true };
    }

    const deletedResult = await pool.query(
        `DELETE FROM products WHERE id = $1 AND store_id = $2 RETURNING id`,
        [id, storeId]
    );
    return deletedResult.rows[0] ? { id: deletedResult.rows[0].id, archived: false } : null;
}

export async function importProducts(storeId, products) {
    const client = await pool.connect();
    const errors = [];
    let created = 0;
    let skipped = 0;
    const addImportError = (code, params = {}) => {
        errors.push(resolveErrorMessage(code, params));
    };

    try {
        await client.query("BEGIN");

        let warehouseId = null;
        try {
            warehouseId = await getDefaultWarehouse(storeId, client);
        } catch (e) {
            console.warn("[Import] No warehouse found for store, skipping stock creation");
        }

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const rowNum = i + 1;

            try {
                const missingFields = [];
                if (!product.name || String(product.name).trim() === "") {missingFields.push("name");}
                if (!product.sku || String(product.sku).trim() === "") {missingFields.push("sku");}
                if (product.sale_price === null || product.sale_price === undefined || product.sale_price === "") {
                    missingFields.push("sale_price");
                }

                if (missingFields.length > 0) {
                    addImportError(ERROR_CODES.PRODUCT_IMPORT_ROW_MISSING_FIELDS, { row: rowNum, fields: missingFields });
                    skipped++;
                    continue;
                }

                const name = String(product.name).trim();
                const sku = String(product.sku).trim();
                const barcode = product.barcode ? String(product.barcode).trim() : null;
                const purchasePrice = product.purchase_price !== null && product.purchase_price !== undefined
                    ? parseDecimal(product.purchase_price, 0)
                    : 0;
                const salePrice = parseDecimal(product.sale_price, NaN);
                const minStock = product.min_stock !== null && product.min_stock !== undefined
                    ? parseDecimal(product.min_stock, 0)
                    : 0;

                if (isNaN(salePrice) || salePrice < 0) {
                    addImportError(ERROR_CODES.PRODUCT_IMPORT_ROW_SALE_PRICE_INVALID, { row: rowNum });
                    skipped++;
                    continue;
                }

                if (await checkSkuExists(storeId, sku, null, client)) {
                    addImportError(ERROR_CODES.PRODUCT_IMPORT_ROW_SKU_EXISTS, { row: rowNum, sku });
                    skipped++;
                    continue;
                }

                if (barcode && (await checkBarcodeExists(storeId, barcode, null, client))) {
                    addImportError(ERROR_CODES.PRODUCT_IMPORT_ROW_BARCODE_EXISTS, { row: rowNum, barcode });
                    skipped++;
                    continue;
                }

                const insertResult = await client.query(
                    `INSERT INTO products
                         (store_id, name, sku, barcode, purchase_price, sale_price, min_stock)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     RETURNING id`,
                    [storeId, name, sku, barcode, purchasePrice, salePrice, minStock]
                );

                const productId = insertResult.rows[0].id;

                if (warehouseId) {
                    await client.query(
                        `INSERT INTO stock (product_id, warehouse_id, quantity)
                         VALUES ($1, $2, 0)
                         ON CONFLICT (product_id, warehouse_id) DO NOTHING`,
                        [productId, warehouseId]
                    );
                }

                created++;
            } catch (err) {
                console.error(`[Import] Error on row ${rowNum}:`, err.message);
                addImportError(ERROR_CODES.PRODUCT_IMPORT_ROW_PROCESS_FAILED, { row: rowNum });
                skipped++;
            }
        }

        await client.query("COMMIT");

        return {
            created,
            skipped,
            errors: errors.slice(0, 50),
            total: products.length,
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}
