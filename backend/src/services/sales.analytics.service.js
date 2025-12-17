import pool from "../utils/db.js";

/**
 * Sales Analytics Service
 * Provides aggregated sales data for analytics and dashboards
 * Only includes COMPLETED sales (excludes RETURNED)
 */

/**
 * Get daily sales for current day
 * @returns {Promise<Object>} { date, totalRevenue, salesCount }
 */
export async function getDailySales() {
    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total), 0) as total_revenue,
            COUNT(*)::int as sales_count
         FROM sales
         WHERE DATE(created_at) = CURRENT_DATE
           AND status = 'COMPLETED'
         GROUP BY DATE(created_at)`
    );

    if (result.rows.length === 0) {
        return {
            date: new Date().toISOString().split("T")[0],
            totalRevenue: 0,
            salesCount: 0,
        };
    }

    const row = result.rows[0];
    return {
        date: row.date.toISOString().split("T")[0],
        totalRevenue: parseFloat(row.total_revenue) || 0,
        salesCount: parseInt(row.sales_count) || 0,
    };
}

/**
 * Get weekly sales grouped by day for current week (Monday-Sunday)
 * @returns {Promise<Array>} [{ date, total }, ...]
 */
export async function getWeeklySales() {
    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total), 0) as total
         FROM sales
         WHERE DATE_TRUNC('week', created_at) = DATE_TRUNC('week', CURRENT_DATE)
           AND status = 'COMPLETED'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`
    );

    return result.rows.map((row) => ({
        date: row.date.toISOString().split("T")[0],
        total: parseFloat(row.total) || 0,
    }));
}

/**
 * Get monthly sales grouped by day for current month
 * @returns {Promise<Array>} [{ date, total }, ...]
 */
export async function getMonthlySales() {
    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total), 0) as total
         FROM sales
         WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
           AND status = 'COMPLETED'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`
    );

    return result.rows.map((row) => ({
        date: row.date.toISOString().split("T")[0],
        total: parseFloat(row.total) || 0,
    }));
}

/**
 * Get sales chart data (optimized for chart libraries)
 * @returns {Promise<Object>} { labels: [...], data: [...] }
 */
export async function getSalesChart() {
    // Get last 30 days of sales data
    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total), 0) as total
         FROM sales
         WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
           AND status = 'COMPLETED'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`
    );

    const labels = [];
    const data = [];

    result.rows.forEach((row) => {
        labels.push(row.date.toISOString().split("T")[0]);
        data.push(parseFloat(row.total) || 0);
    });

    return { labels, data };
}

