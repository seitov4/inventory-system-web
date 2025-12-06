// backend/src/services/products.service.js
import pool from "../utils/db.js";

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

// /products/left
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

export async function createProduct({
                                        name,
                                        sku,
                                        category,
                                        barcode,
                                        purchase_price,
                                        sale_price,
                                        min_stock,
                                    }) {
    const result = await pool.query(
        `INSERT INTO products
             (name, sku, category, barcode, purchase_price, sale_price, min_stock)
         VALUES ($1,   $2,  $3,       $4,      $5,             $6,        $7)
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
        [name, sku, category, barcode, purchase_price, sale_price, min_stock]
    );
    return result.rows[0];
}

export async function updateProduct(
    id,
    { name, sku, category, barcode, purchase_price, sale_price, min_stock }
) {
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
        [id, name, sku, category, barcode, purchase_price, sale_price, min_stock]
    );

    return result.rows[0] || null;
}

export async function deleteProduct(id) {
    await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
}
