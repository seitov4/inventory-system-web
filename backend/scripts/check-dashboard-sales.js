/**
 * Verify dashboard sales inputs for a tenant owner.
 *
 * Run against the Docker backend environment:
 *   docker exec inventory-backend npm --workspace backend run check:dashboard-sales -- owner@test.local
 *
 * To run from host, set DASHBOARD_DATABASE_URL for the target database first.
 */

import "../src/utils/load-env.js";
import pkg from "pg";

const { Pool } = pkg;

const ownerEmail = process.argv[2] || "owner@test.local";
const connectionString = process.env.DASHBOARD_DATABASE_URL || process.env.DATABASE_URL || "";

const pool = new Pool({
    connectionString: connectionString || undefined,
    host: connectionString ? undefined : process.env.DB_HOST || "localhost",
    port: connectionString ? undefined : Number(process.env.DB_PORT || 5432),
    database: connectionString ? undefined : process.env.DB_NAME || "inventory_db",
    user: connectionString ? undefined : process.env.DB_USER || "postgres",
    password: connectionString ? undefined : process.env.DB_PASSWORD || "postgres_password_here",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function queryOne(text, params) {
    const result = await pool.query(text, params);
    return result.rows[0] || null;
}

async function main() {
    const owner = await queryOne(
        `SELECT u.id,
                u.email,
                u.role,
                u.store_id,
                s.name AS store_name,
                s.slug
         FROM users u
         LEFT JOIN stores s ON s.id = u.store_id
         WHERE u.email = $1`,
        [ownerEmail]
    );

    if (!owner) {
        throw new Error(`Owner user not found: ${ownerEmail}`);
    }

    const statusBuckets = await pool.query(
        `SELECT status,
                COUNT(*)::int AS sales_count,
                COALESCE(SUM(total_amount), 0)::numeric AS total_amount,
                MIN(created_at) AS first_sale,
                MAX(created_at) AS last_sale
         FROM sales
         WHERE store_id = $1
         GROUP BY status
         ORDER BY status`,
        [owner.store_id]
    );

    const today = await queryOne(
        `SELECT COUNT(*)::int AS completed_sales_today,
                COALESCE(SUM(total_amount), 0)::numeric AS sales_today
         FROM sales
         WHERE store_id = $1
           AND status = 'completed'
           AND created_at::date = CURRENT_DATE`,
        [owner.store_id]
    );

    const month = await queryOne(
        `SELECT COUNT(*)::int AS completed_sales_this_month,
                COALESCE(SUM(total_amount), 0)::numeric AS sales_this_month
         FROM sales
         WHERE store_id = $1
           AND status = 'completed'
           AND created_at >= date_trunc('month', NOW())`,
        [owner.store_id]
    );

    const days = await pool.query(
        `SELECT DATE(created_at) AS day,
                COUNT(*)::int AS sales_count,
                COALESCE(SUM(total_amount), 0)::numeric AS total
         FROM sales
         WHERE store_id = $1
           AND status = 'completed'
           AND created_at >= date_trunc('month', NOW())
         GROUP BY DATE(created_at)
         ORDER BY day`,
        [owner.store_id]
    );

    console.log(JSON.stringify({ owner, statusBuckets: statusBuckets.rows, today, month, days: days.rows }, null, 2));

    if (Number(today.sales_today) <= 0 || Number(month.sales_this_month) <= 0 || days.rows.length === 0) {
        throw new Error("Dashboard sales verification failed: today/month/day buckets are empty.");
    }
}

main()
    .catch((err) => {
        console.error(err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
