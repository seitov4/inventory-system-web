import pool from "../utils/db.js";

/**
 * Get default warehouse (first available warehouse)
 * If no warehouses exist, throws an error
 */
async function getDefaultWarehouse() {
    const result = await pool.query(
        `SELECT id FROM warehouses ORDER BY id LIMIT 1`
    );
    if (result.rows.length === 0) {
        throw new Error(
            "Не найден склад по умолчанию. Создайте хотя бы один склад перед добавлением товаров."
        );
    }
    return result.rows[0].id;
}

/**
 * Validate product data
 */
function validateProductData({ name, sku, purchase_price, sale_price, min_stock }) {
    if (!name || typeof name !== "string" || name.trim() === "") {
        throw new Error("Название товара обязательно и не может быть пустым");
    }

    if (!sku || typeof sku !== "string" || sku.trim() === "") {
        throw new Error("SKU товара обязателен и не может быть пустым");
    }

    const purchasePrice = Number(purchase_price);
    const salePrice = Number(sale_price);
    const minStock = Number(min_stock);

    if (isNaN(purchasePrice) || purchasePrice < 0) {
        throw new Error("Цена закупки должна быть неотрицательным числом");
    }

    if (isNaN(salePrice) || salePrice < 0) {
        throw new Error("Цена продажи должна быть неотрицательным числом");
    }

    if (isNaN(minStock) || minStock < 0) {
        throw new Error("Минимальный остаток должен быть неотрицательным числом");
    }
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
    if (!barcode) return false; // barcode can be null

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
         WHERE id = $1`,
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
         WHERE barcode = $1`,
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
                COALESCE(SUM(s.quantity), 0)::int AS quantity
         FROM products p
                  LEFT JOIN stock s ON s.product_id = p.id
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
                COALESCE(SUM(s.quantity), 0)::int AS quantity
         FROM products p
                  LEFT JOIN stock s ON s.product_id = p.id
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
    // Validate input
    validateProductData({ name, sku, purchase_price, sale_price, min_stock });

    // Check uniqueness
    if (await checkSkuExists(sku)) {
        throw new Error(`Товар с SKU "${sku}" уже существует`);
    }

    if (barcode && (await checkBarcodeExists(barcode))) {
        throw new Error(`Товар с штрихкодом "${barcode}" уже существует`);
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
    // Validate input
    validateProductData({ name, sku, purchase_price, sale_price, min_stock });

    // Check uniqueness (excluding current product)
    if (await checkSkuExists(sku, id)) {
        throw new Error(`Товар с SKU "${sku}" уже существует`);
    }

    if (barcode && (await checkBarcodeExists(barcode, id))) {
        throw new Error(`Товар с штрихкодом "${barcode}" уже существует`);
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
             updated_at     = NOW()
         WHERE id = $1
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
    // Stock will be deleted automatically due to ON DELETE CASCADE
    await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
}
