import pool from "../utils/db.js";
import { createAppError, resolveErrorMessage } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

/**
 * Get default warehouse (first available warehouse)
 * If no warehouses exist, throws an error
 */
async function getDefaultWarehouse() {
    const result = await pool.query(`SELECT id FROM warehouses ORDER BY id LIMIT 1`);
    if (result.rows.length === 0) {
        throw createAppError(ERROR_CODES.PRODUCT_DEFAULT_WAREHOUSE_NOT_FOUND, 400);
    }
    return result.rows[0].id;
}

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

/**
 * Validate product data
 */
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

/**
 * Check if SKU already exists
 */
async function checkSkuExists(sku, excludeId = null) {
    let query = `SELECT id FROM products WHERE sku = $1`;
    const params = [sku];

    if (excludeId) {
        query += ` AND id != $2`;
        params.push(excludeId);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0;
}

/**
 * Check if barcode already exists
 */
async function checkBarcodeExists(barcode, excludeId = null) {
    if (!barcode) {
        return false; // barcode can be null
    }

    let query = `SELECT id FROM products WHERE barcode = $1`;
    const params = [barcode];

    if (excludeId) {
        query += ` AND id != $2`;
        params.push(excludeId);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0;
}

export async function getAllProducts() {
    const result = await pool.query(
        `SELECT id,
                name,
                sku,
                category,
                barcode,
                purchase_price,
                sale_price,
                min_stock,
                created_at,
                updated_at
         FROM products
         WHERE is_active IS TRUE
         ORDER BY name`
    );
    return result.rows;
}

export async function getProductById(id) {
    const result = await pool.query(
        `SELECT id,
                name,
                sku,
                category,
                barcode,
                purchase_price,
                sale_price,
                min_stock,
                created_at,
                updated_at
         FROM products
         WHERE id = $1 AND is_active IS TRUE`,
        [id]
    );
    return result.rows[0] || null;
}

export async function getProductByBarcode(barcode) {
    const result = await pool.query(
        `SELECT id,
                name,
                sku,
                category,
                barcode,
                purchase_price,
                sale_price,
                min_stock,
                created_at,
                updated_at
         FROM products
         WHERE barcode = $1 AND is_active IS TRUE`,
        [barcode]
    );
    return result.rows[0] || null;
}

export async function getProductsWithLeft() {
    const result = await pool.query(
        `SELECT p.id,
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
         WHERE p.is_active IS TRUE
         GROUP BY p.id
         ORDER BY p.name`
    );
    return result.rows;
}

export async function getLowStockProducts() {
    const result = await pool.query(
        `SELECT p.id,
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
         WHERE p.is_active IS TRUE
         GROUP BY p.id
         HAVING COALESCE(SUM(s.quantity), 0) <= p.min_stock
         ORDER BY quantity ASC`
    );
    return result.rows;
}

/**
 * Create product and automatically create stock record with quantity = 0
 */
export async function createProduct({
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

    // Validate input
    validateProductData({ name, sku, purchase_price, sale_price, min_stock });

    // Check uniqueness
    if (await checkSkuExists(sku)) {
        throw createAppError(ERROR_CODES.PRODUCT_SKU_EXISTS, 409, { sku });
    }

    if (barcode && (await checkBarcodeExists(barcode))) {
        throw createAppError(ERROR_CODES.PRODUCT_BARCODE_EXISTS, 409, { barcode });
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Create product
        const productResult = await client.query(
            `INSERT INTO products
                 (name, sku, category, barcode, purchase_price, sale_price, min_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id,
                       name,
                       sku,
                       category,
                       barcode,
                       purchase_price,
                       sale_price,
                       min_stock,
                       created_at,
                       updated_at`,
            [name, sku, category || null, barcode || null, purchase_price, sale_price, min_stock]
        );

        const product = productResult.rows[0];

        // Get default warehouse and create stock record
        try {
            const warehouseId = await getDefaultWarehouse();
            await client.query(
                `INSERT INTO stock (product_id, warehouse_id, quantity)
                 VALUES ($1, $2, 0)
                 ON CONFLICT (product_id, warehouse_id) DO NOTHING`,
                [product.id, warehouseId]
            );
        } catch (warehouseError) {
            // If no warehouse exists, continue without stock (product is still created)
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

/**
 * Update product
 */
export async function updateProduct(
    id,
    { name, sku, category, barcode, purchase_price, sale_price, min_stock }
) {
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

    // Validate input
    validateProductData({ name, sku, purchase_price, sale_price, min_stock });

    // Check uniqueness (excluding current product)
    if (await checkSkuExists(sku, id)) {
        throw createAppError(ERROR_CODES.PRODUCT_SKU_EXISTS, 409, { sku });
    }

    if (barcode && (await checkBarcodeExists(barcode, id))) {
        throw createAppError(ERROR_CODES.PRODUCT_BARCODE_EXISTS, 409, { barcode });
    }

    const result = await pool.query(
        `UPDATE products
         SET name           = $2,
             sku            = $3,
             category       = $4,
             barcode        = $5,
             purchase_price = $6,
             sale_price     = $7,
             min_stock      = $8,
             updated_at     = CURRENT_TIMESTAMP
         WHERE id = $1 AND is_active IS TRUE
         RETURNING id,
                   name,
                   sku,
                   category,
                   barcode,
                   purchase_price,
                   sale_price,
                   min_stock,
                   created_at,
                   updated_at`,
        [id, name, sku, category || null, barcode || null, purchase_price, sale_price, min_stock]
    );

    return result.rows[0] || null;
}

/**
 * Delete product
 */
export async function deleteProduct(id) {
    const productResult = await pool.query(
        `SELECT id FROM products WHERE id = $1 AND is_active IS TRUE`,
        [id]
    );

    if (productResult.rows.length === 0) {
        return null;
    }

    const referenceResult = await pool.query(
        `SELECT
             (SELECT COUNT(*) FROM sale_items WHERE product_id = $1) AS sale_items,
             (SELECT COUNT(*) FROM movements WHERE product_id = $1) AS movements,
             (SELECT COUNT(*) FROM stock WHERE product_id = $1) AS stock`,
        [id]
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
             WHERE id = $1 AND is_active IS TRUE
             RETURNING id`,
            [id]
        );
        return { id: archivedResult.rows[0].id, archived: true };
    }

    const deletedResult = await pool.query(
        `DELETE FROM products WHERE id = $1 RETURNING id`,
        [id]
    );
    return deletedResult.rows[0] ? { id: deletedResult.rows[0].id, archived: false } : null;
}

/**
 * Bulk import products
 * Creates multiple products in a single transaction
 * Skips products with duplicate SKU/barcode
 * 
 * @param {Array} products - Array of product objects
 * @returns {Object} { created: number, skipped: number, errors: Array }
 */
export async function importProducts(products) {
    const client = await pool.connect();
    const errors = [];
    let created = 0;
    let skipped = 0;
    const addImportError = (code, params = {}) => {
        errors.push(resolveErrorMessage(code, params));
    };

    try {
        await client.query("BEGIN");

        // Get default warehouse for stock records
        let warehouseId = null;
        try {
            const whResult = await client.query(
                `SELECT id FROM warehouses ORDER BY id LIMIT 1`
            );
            if (whResult.rows.length > 0) {
                warehouseId = whResult.rows[0].id;
            }
        } catch (e) {
            console.warn("[Import] No warehouse found, skipping stock creation");
        }

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const rowNum = i + 1;

            try {
                // Validate required fields: name, sku, sale_price
                const missingFields = [];
                
                if (!product.name || String(product.name).trim() === '') {
                    missingFields.push('name');
                }
                if (!product.sku || String(product.sku).trim() === '') {
                    missingFields.push('sku');
                }
                if (product.sale_price === null || product.sale_price === undefined || product.sale_price === '') {
                    missingFields.push('sale_price');
                }
                
                if (missingFields.length > 0) {
                    addImportError(ERROR_CODES.PRODUCT_IMPORT_ROW_MISSING_FIELDS, {
                        row: rowNum,
                        fields: missingFields,
                    });
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
                
                // Validate sale_price is a valid number
                if (isNaN(salePrice) || salePrice < 0) {
                    addImportError(ERROR_CODES.PRODUCT_IMPORT_ROW_SALE_PRICE_INVALID, {
                        row: rowNum,
                    });
                    skipped++;
                    continue;
                }

                // Check for duplicate SKU
                const skuCheck = await client.query(
                    `SELECT id FROM products WHERE sku = $1`,
                    [sku]
                );
                if (skuCheck.rows.length > 0) {
                    addImportError(ERROR_CODES.PRODUCT_IMPORT_ROW_SKU_EXISTS, {
                        row: rowNum,
                        sku,
                    });
                    skipped++;
                    continue;
                }

                // Check for duplicate barcode
                if (barcode) {
                    const barcodeCheck = await client.query(
                        `SELECT id FROM products WHERE barcode = $1`,
                        [barcode]
                    );
                    if (barcodeCheck.rows.length > 0) {
                        addImportError(ERROR_CODES.PRODUCT_IMPORT_ROW_BARCODE_EXISTS, {
                            row: rowNum,
                            barcode,
                        });
                        skipped++;
                        continue;
                    }
                }

                // Insert product
                const insertResult = await client.query(
                    `INSERT INTO products
                         (name, sku, barcode, purchase_price, sale_price, min_stock)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     RETURNING id`,
                    [name, sku, barcode, purchasePrice, salePrice, minStock]
                );

                const productId = insertResult.rows[0].id;

                // Create stock record if warehouse exists
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
                addImportError(ERROR_CODES.PRODUCT_IMPORT_ROW_PROCESS_FAILED, {
                    row: rowNum,
                });
                skipped++;
            }
        }

        await client.query("COMMIT");

        return {
            created,
            skipped,
            errors: errors.slice(0, 50), // Limit error list
            total: products.length
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

