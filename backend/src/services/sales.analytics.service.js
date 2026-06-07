import pool from "../utils/db.js";

/**
 * Sales Analytics Service
 * Provides aggregated sales data for analytics and dashboards
 * Only includes completed sales (excludes returned/cancelled sales)
 */

function toIsoDateString(value) {
    return new Date(value).toISOString().split("T")[0];
}

function getStartOfWeek(date = new Date()) {
    const value = new Date(date);
    value.setUTCHours(0, 0, 0, 0);
    const day = value.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    value.setUTCDate(value.getUTCDate() + diff);
    return value;
}

function addDays(date, days) {
    const value = new Date(date);
    value.setUTCDate(value.getUTCDate() + days);
    return value;
}

/**
 * Get daily sales for current day
 * @returns {Promise<Object>} { date, totalRevenue, salesCount }
 */
export async function getDailySales(storeId) {
    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total_amount), 0) as total_revenue,
            CAST(COUNT(*) AS INTEGER) as sales_count
         FROM sales
         WHERE store_id = $1
           AND created_at::date = CURRENT_DATE
           AND LOWER(status) = 'completed'
         GROUP BY DATE(created_at)`,
        [storeId]
    );

    if (result.rows.length === 0) {
        return {
            date: toIsoDateString(new Date()),
            totalRevenue: 0,
            salesCount: 0,
        };
    }

    const row = result.rows[0];
    return {
        date: toIsoDateString(row.date),
        totalRevenue: parseFloat(row.total_revenue) || 0,
        salesCount: parseInt(row.sales_count) || 0,
    };
}

/**
 * Get weekly sales grouped by day for current week (Monday-Sunday)
 * @returns {Promise<Array>} [{ date, total }, ...]
 */
export async function getWeeklySales(storeId) {
    const fromDate = getStartOfWeek();
    const toDate = addDays(fromDate, 7);

    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total_amount), 0) as total
         FROM sales
         WHERE store_id = $1
           AND created_at >= $2
           AND created_at < $3
           AND LOWER(status) = 'completed'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [storeId, fromDate, toDate]
    );

    return result.rows.map((row) => ({
        date: toIsoDateString(row.date),
        total: parseFloat(row.total) || 0,
    }));
}

/**
 * Get monthly sales grouped by day for current month
 * @returns {Promise<Array>} [{ date, total }, ...]
 */
export async function getMonthlySales(storeId) {
    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total_amount), 0) as total
         FROM sales
         WHERE store_id = $1
           AND created_at >= date_trunc('month', NOW())
           AND LOWER(status) = 'completed'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [storeId]
    );

    return result.rows.map((row) => ({
        date: toIsoDateString(row.date),
        total: parseFloat(row.total) || 0,
    }));
}

/**
 * Get sales chart data (optimized for chart libraries)
 * @returns {Promise<Object>} { labels: [...], data: [...] }
 */
export async function getSalesChart(storeId) {
    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total_amount), 0) as total
         FROM sales
         WHERE store_id = $1
           AND created_at >= date_trunc('month', NOW())
           AND LOWER(status) = 'completed'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [storeId]
    );

    const labels = [];
    const data = [];

    result.rows.forEach((row) => {
        labels.push(toIsoDateString(row.date));
        data.push(parseFloat(row.total) || 0);
    });

    return { labels, data };
}

