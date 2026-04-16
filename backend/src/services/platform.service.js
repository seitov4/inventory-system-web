import { safeQuery, getDatabaseInfo } from "../utils/db.js";
import { loginUser, getCurrentUser } from "./auth.service.js";

// Auth helpers
export async function loginPlatformUser(identifier, password) {
    // Reuse existing auth service
    return await loginUser(identifier, password);
}

export async function getPlatformProfile(userId) {
    return await getCurrentUser(userId);
}

// Stores
export async function listStores() {
    const q = `SELECT id, name, type, address, created_at FROM warehouses ORDER BY id DESC`;
    const r = await safeQuery(q);
    const rows = r.rows || [];
    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.name ? r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : String(r.id),
        ownerEmail: null,
        status: r.type === "suspended" ? "suspended" : r.type === "archived" ? "archived" : "active",
        plan: "standard",
        region: null,
        createdAt: r.created_at,
        lastActiveAt: null,
    }));
}

export async function createStore(payload) {
    const name = payload.name || payload.storeName || payload.name;
    const address = payload.address || null;
    if (!name) throw new Error("Store name required");
    const q = `INSERT INTO warehouses (name, type, address) VALUES ($1, $2, $3) RETURNING id, name, type, address, created_at`;
    const r = await safeQuery(q, [name, "store", address]);
    const row = (r.rows && r.rows[0]) || null;
    return row;
}

export async function updateStoreStatus(id, status) {
    const type = status === "active" ? "store" : status;
    const q = `UPDATE warehouses SET type=$1 WHERE id=$2 RETURNING id, name, type, address, created_at`;
    const r = await safeQuery(q, [type, id]);
    return (r.rows && r.rows[0]) || null;
}

export async function getStoreDetails(id) {
    const q = `SELECT id, name, type, address, created_at FROM warehouses WHERE id=$1`;
    const r = await safeQuery(q, [id]);
    return (r.rows && r.rows[0]) || null;
}

export async function getStoreHealth(id) {
    const q = `SELECT
        (SELECT COUNT(*) FROM stock WHERE warehouse_id=$1) AS stock_count,
        (SELECT COUNT(*) FROM sales WHERE warehouse_id=$1) AS sales_count,
        (SELECT COUNT(*) FROM users WHERE store_name = (SELECT name FROM warehouses WHERE id=$1)) AS user_count
        `;
    const r = await safeQuery(q, [id]);
    const row = (r.rows && r.rows[0]) || { stock_count: 0, sales_count: 0, user_count: 0 };
    return {
        stockCount: Number(row.stock_count || 0),
        salesCount: Number(row.sales_count || 0),
        userCount: Number(row.user_count || 0),
    };
}

export async function getStoreActivity(id) {
    const q = `SELECT id, total_amount, payment_type, status, created_at FROM sales WHERE warehouse_id=$1 ORDER BY created_at DESC LIMIT 50`;
    const r = await safeQuery(q, [id]);
    const rows = r.rows || [];
    return rows.map((s) => ({
        id: s.id,
        type: "sale",
        message: `Sale ${s.id}`,
        amount: s.total_amount,
        payment_type: s.payment_type,
        status: s.status,
        created_at: s.created_at,
    }));
}

// Health
export async function getBackendHealth() {
    return {
        status: "ok",
        env: process.env.NODE_ENV || "local",
        uptime: process.uptime(),
        version: process.env.npm_package_version || process.env.npm_package_version || "unknown",
    };
}

export async function getDatabaseHealth() {
    // Run a quick SELECT 1
    try {
        await safeQuery("SELECT 1");
        return {
            ok: true,
            info: getDatabaseInfo(),
        };
    } catch (err) {
        return {
            ok: false,
            error: err.message,
        };
    }
}

export async function getSystemHealth() {
    const backend = await getBackendHealth();
    const db = await getDatabaseHealth();
    return {
        backend,
        database: db,
    };
}

// Logs / activity
export async function getPlatformLogs(params = {}) {
    // No centralized logs table yet - return empty array for now
    return [];
}

export async function getActivityFeed() {
    const q = `SELECT id, total_amount, status, created_at FROM sales ORDER BY created_at DESC LIMIT 20`;
    const r = await safeQuery(q);
    const rows = r.rows || [];
    return rows.map((s) => ({
        id: s.id,
        type: "sale",
        message: `Sale ${s.id}`,
        amount: s.total_amount,
        status: s.status,
        created_at: s.created_at,
    }));
}

// Metrics
export async function getMetricsSummary() {
    const q = `SELECT
        (SELECT COUNT(*) FROM warehouses) AS stores,
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM sales WHERE created_at > now() - interval '7 days') AS recent_sales
    `;
    try {
        const r = await safeQuery(q);
        const row = (r.rows && r.rows[0]) || {};
        return {
            stores: Number(row.stores || 0),
            products: Number(row.products || 0),
            recentSales: Number(row.recent_sales || 0),
        };
    } catch (err) {
        // For sqlite fallback, try simpler queries
        const r2 = await safeQuery(`SELECT COUNT(*) AS stores FROM warehouses`);
        const r3 = await safeQuery(`SELECT COUNT(*) AS products FROM products`);
        return {
            stores: Number((r2.rows && r2.rows[0].stores) || 0),
            products: Number((r3.rows && r3.rows[0].products) || 0),
            recentSales: 0,
        };
    }
}

export async function getMetricsGrowth() {
    // Provide a simple placeholder: counts per day for last 7 days based on sales
    const q = `SELECT DATE(created_at) as day, COUNT(*) as count FROM sales GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 7`;
    try {
        const r = await safeQuery(q);
        return (r.rows || []).map((row) => ({ day: row.day, count: Number(row.count) }));
    } catch (err) {
        return [];
    }
}
