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

function normalizeProductsPageOptions({
    page = 1,
    limit = 30,
    search = "",
    filter = "all",
} = {}) {
    const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const normalizedLimit = Math.min(
        100,
        Math.max(1, Number.parseInt(limit, 10) || 30)
    );
    const normalizedSearch = typeof search === "string" ? search.trim().slice(0, 120) : "";
    const normalizedFilter = String(filter || "all").toLowerCase();
    const allowedFilters = new Set([
        "all",
        "low_stock",
        "no_movements_30",
        "no_movements_30_days",
    ]);

    return {
        page: normalizedPage,
        limit: normalizedLimit,
        search: normalizedSearch,
        filter: allowedFilters.has(normalizedFilter) ? normalizedFilter : "all",
        offset: (normalizedPage - 1) * normalizedLimit,
    };
}

function buildProductInventoryQuery(search) {
    const params = [];
    let paramIndex = 1;

    params.push(null);
    const storeParam = `$${paramIndex++}`;
    const where = [`p.store_id = ${storeParam}`, "p.is_active IS TRUE"];

    if (search) {
        params.push(`%${search}%`);
        const searchParam = `$${paramIndex++}`;
        where.push(
            `(p.name ILIKE ${searchParam} OR p.sku ILIKE ${searchParam} OR p.barcode ILIKE ${searchParam})`
        );
    }

    return {
        params,
        paramIndex,
        cte: `WITH product_inventory AS (
            SELECT p.id,
                   p.store_id,
                   p.name,
                   p.sku,
                   p.category,
                   p.barcode,
                   p.purchase_price,
                   p.sale_price,
                   p.min_stock,
                   p.created_at,
                   p.updated_at,
                   CAST(COALESCE(SUM(s.quantity), 0) AS INTEGER) AS quantity,
                   EXISTS (
                       SELECT 1
                       FROM movements m
                       WHERE m.store_id = p.store_id
                         AND m.product_id = p.id
                         AND m.created_at >= NOW() - INTERVAL '30 days'
                   ) AS has_recent_movement
            FROM products p
            LEFT JOIN stock s ON s.product_id = p.id
                AND s.warehouse_id IN (SELECT id FROM warehouses WHERE store_id = ${storeParam})
            WHERE ${where.join(" AND ")}
            GROUP BY p.id,
                     p.store_id,
                     p.name,
                     p.sku,
                     p.category,
                     p.barcode,
                     p.purchase_price,
                     p.sale_price,
                     p.min_stock,
                     p.created_at,
                     p.updated_at
        )`,
    };
}

function getProductsFilterClause(filter) {
    if (filter === "low_stock") {
        return "WHERE min_stock > 0 AND quantity <= min_stock";
    }

    if (filter === "no_movements_30" || filter === "no_movements_30_days") {
        return "WHERE has_recent_movement IS FALSE";
    }

    return "";
}

export async function getPaginatedProducts(storeId, options = {}) {
    const normalized = normalizeProductsPageOptions(options);
    const { cte, params: baseParams, paramIndex } = buildProductInventoryQuery(normalized.search);
    baseParams[0] = storeId;

    const filterClause = getProductsFilterClause(normalized.filter);

    const summaryResult = await pool.query(
        `${cte}
         SELECT COUNT(*)::int AS all_count,
                COUNT(*) FILTER (WHERE min_stock > 0 AND quantity <= min_stock)::int AS low_stock_count,
                COUNT(*) FILTER (WHERE has_recent_movement IS FALSE)::int AS no_movements_30_count
         FROM product_inventory`,
        baseParams
    );

    const countResult = await pool.query(
        `${cte}
         SELECT COUNT(*)::int AS total
         FROM product_inventory
         ${filterClause}`,
        baseParams
    );

    const total = Number(countResult.rows[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / normalized.limit));
    const safePage = Math.min(normalized.page, totalPages);
    const offset = (safePage - 1) * normalized.limit;

    const dataParams = [...baseParams, normalized.limit, offset];
    const limitParam = `$${paramIndex}`;
    const offsetParam = `$${paramIndex + 1}`;

    const dataResult = await pool.query(
        `${cte}
         SELECT id,
                store_id,
                name,
                sku,
                category,
                barcode,
                purchase_price,
                sale_price,
                min_stock,
                created_at,
                updated_at,
                quantity,
                (min_stock > 0 AND quantity <= min_stock) AS is_low_stock,
                has_recent_movement
         FROM product_inventory
         ${filterClause}
         ORDER BY name, id
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        dataParams
    );

    const summary = summaryResult.rows[0] || {};

    return {
        products: dataResult.rows,
        pagination: {
            page: safePage,
            limit: normalized.limit,
            total,
            total_pages: totalPages,
            has_next: safePage < totalPages,
            has_prev: safePage > 1,
        },
        counts: {
            all: Number(summary.all_count || 0),
            low_stock: Number(summary.low_stock_count || 0),
            no_movements_30: Number(summary.no_movements_30_count || 0),
        },
    };
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

export async function lookupProducts(storeId, query, limit = 10, warehouseId = null) {
    const searchText = typeof query === "string" ? query.trim().slice(0, 120) : "";
    const safeLimit = Math.min(20, Math.max(1, Number.parseInt(limit, 10) || 10));
    const safeWarehouseId = Number.parseInt(warehouseId, 10) > 0
        ? Number.parseInt(warehouseId, 10)
        : null;

    if (!searchText) {
        return [];
    }

    const stockJoin = safeWarehouseId
        ? `LEFT JOIN stock s ON s.product_id = p.id
             AND s.warehouse_id = $6
             AND EXISTS (
                 SELECT 1 FROM warehouses w WHERE w.id = s.warehouse_id AND w.store_id = $1
             )`
        : `LEFT JOIN stock s ON s.product_id = p.id
             AND s.warehouse_id IN (SELECT id FROM warehouses WHERE store_id = $1)`;
    const params = [
        storeId,
        searchText,
        `%${searchText}%`,
        /^\d+$/.test(searchText) ? searchText : null,
        safeLimit,
    ];

    if (safeWarehouseId) {
        params.push(safeWarehouseId);
    }

    const result = await pool.query(
        `SELECT p.id,
                p.name,
                p.sku,
                p.category,
                p.barcode,
                p.sale_price,
                p.min_stock,
                CAST(COALESCE(SUM(s.quantity), 0) AS INTEGER) AS stock
         FROM products p
         ${stockJoin}
         WHERE p.store_id = $1
           AND p.is_active IS TRUE
           AND (
               p.barcode = $2
               OR p.sku = $2
               OR p.name ILIKE $3
               OR ($4::text IS NOT NULL AND p.id::text = $4::text)
           )
         GROUP BY p.id
         ORDER BY
             CASE
                 WHEN p.barcode = $2 THEN 0
                 WHEN p.sku = $2 THEN 1
                 WHEN $4::text IS NOT NULL AND p.id::text = $4::text THEN 2
                 ELSE 3
             END,
             p.name
         LIMIT $5`,
        params
    );

    return result.rows;
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

    const archivedResult = await pool.query(
        `UPDATE products
         SET is_active = FALSE,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND store_id = $2 AND is_active IS TRUE
         RETURNING id`,
        [id, storeId]
    );
    return archivedResult.rows[0] ? { id: archivedResult.rows[0].id, archived: true } : null;
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
