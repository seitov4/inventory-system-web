/**
 * Validate multi-tenant data invariants without modifying data.
 *
 * Usage:
 *   npm run check:tenant-data
 *   npm run check:tenant-data -- owner@test.local
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

async function count(label, sql, params = []) {
    const result = await pool.query(sql, params);
    return { label, count: Number(result.rows[0]?.count || 0) };
}

async function main() {
    const checks = [
        await count("users_without_store_id", "SELECT COUNT(*) FROM users WHERE store_id IS NULL"),
        await count("products_without_store_id", "SELECT COUNT(*) FROM products WHERE store_id IS NULL"),
        await count("warehouses_without_store_id", "SELECT COUNT(*) FROM warehouses WHERE store_id IS NULL"),
        await count("sales_without_store_id", "SELECT COUNT(*) FROM sales WHERE store_id IS NULL"),
        await count("movements_without_store_id", "SELECT COUNT(*) FROM movements WHERE store_id IS NULL"),
        await count("notifications_without_store_id", "SELECT COUNT(*) FROM notifications WHERE store_id IS NULL"),
        await count("sale_items_without_qty", "SELECT COUNT(*) FROM sale_items WHERE qty IS NULL"),
        await count("movements_without_qty", "SELECT COUNT(*) FROM movements WHERE qty IS NULL"),
        await count(
            "sales_warehouse_store_mismatch",
            `SELECT COUNT(*)
             FROM sales s
             JOIN warehouses w ON w.id = s.warehouse_id
             WHERE s.store_id <> w.store_id`
        ),
        await count(
            "movements_product_store_mismatch",
            `SELECT COUNT(*)
             FROM movements m
             JOIN products p ON p.id = m.product_id
             WHERE m.store_id <> p.store_id`
        ),
        await count(
            "movements_warehouse_store_mismatch",
            `SELECT COUNT(*)
             FROM movements m
             JOIN warehouses w ON w.id = COALESCE(m.warehouse_id, m.warehouse_from, m.warehouse_to)
             WHERE m.store_id <> w.store_id`
        ),
    ];

    const dashboard = await pool.query(
        `SELECT store_id,
                COUNT(*)::int AS completed_sales,
                COALESCE(SUM(total_amount), 0)::numeric AS total_amount
         FROM sales
         WHERE LOWER(status) = 'completed'
         GROUP BY store_id
         ORDER BY store_id`
    );

    const owner = await pool.query(
        `SELECT u.id, u.store_id, u.email
         FROM users u
         WHERE LOWER(u.email) = LOWER($1)
         LIMIT 1`,
        [ownerEmail]
    );

    let ownerDashboard = null;
    if (owner.rows[0]) {
        const result = await pool.query(
            `SELECT COUNT(*)::int AS completed_sales,
                    COALESCE(SUM(total_amount), 0)::numeric AS total_amount
             FROM sales
             WHERE store_id = $1
               AND LOWER(status) = 'completed'`,
            [owner.rows[0].store_id]
        );
        ownerDashboard = result.rows[0];
    }

    console.log(
        JSON.stringify(
            {
                checks,
                dashboard: dashboard.rows,
                owner: owner.rows[0] || null,
                ownerDashboard,
            },
            null,
            2
        )
    );

    const failed = checks.filter((item) => item.count > 0);
    if (failed.length) {
        throw new Error(`Tenant data invariant failed: ${failed.map((item) => item.label).join(", ")}`);
    }

    if (owner.rows[0] && Number(ownerDashboard?.total_amount || 0) <= 0) {
        throw new Error(`Dashboard sales are empty for ${ownerEmail}`);
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
