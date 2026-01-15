import pool from "../utils/db.js";

/**
 * Get sales report data for a date range
 * Returns detailed rows from sale_items joined with sales and products
 * 
 * @param {Date} fromDate - Start date
 * @param {Date} toDate - End date (inclusive)
 * @returns {Array} Array of sale items with product details
 */
export async function getSalesReportData(fromDate, toDate) {
    // Set toDate to end of day for inclusive range
    const toDateEnd = new Date(toDate);
    toDateEnd.setHours(23, 59, 59, 999);

    const query = `
        SELECT 
            s.created_at AS date,
            s.id AS sale_id,
            p.id AS product_id,
            p.name AS product_name,
            p.sku,
            si.qty AS quantity,
            si.price AS sale_price,
            (si.qty * si.price) AS total
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        JOIN products p ON p.id = si.product_id
        WHERE s.created_at >= $1 
          AND s.created_at <= $2
          AND s.status = 'COMPLETED'
        ORDER BY s.created_at DESC, s.id, si.id
    `;

    const result = await pool.query(query, [fromDate, toDateEnd]);

    return result.rows.map(row => ({
        date: row.date,
        sale_id: row.sale_id,
        product_id: row.product_id,
        product_name: row.product_name,
        sku: row.sku || '',
        quantity: Number(row.quantity),
        sale_price: Number(row.sale_price),
        total: Number(row.total)
    }));
}

