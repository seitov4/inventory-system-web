import pool from "../utils/db.js";

/**
 * Sales Analytics Service
 * Provides aggregated sales data for analytics and dashboards
 * Only includes COMPLETED sales (excludes RETURNED)
 */

function toIsoDateString(value) {
    return new Date(value).toISOString().split("T")[0];
}

function getStartOfDay(date = new Date()) {
    const value = new Date(date);
    value.setUTCHours(0, 0, 0, 0);
    return value;
}

function getStartOfWeek(date = new Date()) {
    const value = getStartOfDay(date);
    const day = value.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    value.setUTCDate(value.getUTCDate() + diff);
    return value;
}

function getStartOfMonth(date = new Date()) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
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
export async function getDailySales() {
    const fromDate = getStartOfDay();
    const toDate = addDays(fromDate, 1);

    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total), 0) as total_revenue,
            CAST(COUNT(*) AS INTEGER) as sales_count
         FROM sales
         WHERE created_at >= $1
           AND created_at < $2
           AND status = 'COMPLETED'
         GROUP BY DATE(created_at)`,
        [fromDate, toDate]
    );

    if (result.rows.length === 0) {
        return {
            date: toIsoDateString(fromDate),
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
export async function getWeeklySales() {
    const fromDate = getStartOfWeek();
    const toDate = addDays(fromDate, 7);

    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total), 0) as total
         FROM sales
         WHERE created_at >= $1
           AND created_at < $2
           AND status = 'COMPLETED'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [fromDate, toDate]
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
export async function getMonthlySales() {
    const fromDate = getStartOfMonth();
    const toDate = new Date(
        Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() + 1, 1)
    );

    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total), 0) as total
         FROM sales
         WHERE created_at >= $1
           AND created_at < $2
           AND status = 'COMPLETED'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [fromDate, toDate]
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
export async function getSalesChart() {
    // Get last 30 days of sales data
    const fromDate = addDays(getStartOfDay(), -30);

    const result = await pool.query(
        `SELECT 
            DATE(created_at) as date,
            COALESCE(SUM(total), 0) as total
         FROM sales
         WHERE created_at >= $1
           AND status = 'COMPLETED'
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [fromDate]
    );

    const labels = [];
    const data = [];

    result.rows.forEach((row) => {
        labels.push(toIsoDateString(row.date));
        data.push(parseFloat(row.total) || 0);
    });

    return { labels, data };
}

