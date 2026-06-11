import pool from "../utils/db.js";

export const AI_TOOL_NAMES = Object.freeze({
    SALES_SUMMARY: "get_sales_summary",
    SALES_BY_PERIOD: "get_sales_by_period",
    LOW_STOCK_ITEMS: "get_low_stock_items",
    TOP_PRODUCTS: "get_top_products",
    PRODUCT_STOCK: "get_product_stock",
    CATEGORY_PERFORMANCE: "get_category_performance",
    RECENT_TRANSACTIONS: "get_recent_transactions",
    RESTOCK_RECOMMENDATIONS: "get_restock_recommendations",
});

const ALLOWED_PERIODS = new Set(["today", "yesterday", "week", "month", "custom"]);
const MAX_LIMIT = 20;
const MAX_PRODUCT_SEARCH_LIMIT = 10;
const DEFAULT_LIMIT = 10;

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : fallback;
}

function toIsoDate(value) {
    return new Date(value).toISOString().slice(0, 10);
}

function normalizeLimit(limit, defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT) {
    const parsed = toInteger(limit, defaultLimit);
    if (parsed <= 0) {
        return defaultLimit;
    }
    return Math.min(parsed, maxLimit);
}

function normalizePeriod(period = "today") {
    return ALLOWED_PERIODS.has(period) ? period : "today";
}

function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}

function endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

function resolvePeriodRange({ period = "today", from, to } = {}) {
    const normalizedPeriod = normalizePeriod(period);
    const now = new Date();

    if (normalizedPeriod === "custom" && from && to) {
        return {
            period: "custom",
            fromDate: startOfDay(from),
            toDate: endOfDay(to),
        };
    }

    if (normalizedPeriod === "yesterday") {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
            period: "yesterday",
            fromDate: startOfDay(yesterday),
            toDate: endOfDay(yesterday),
        };
    }

    if (normalizedPeriod === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 6);
        return {
            period: "week",
            fromDate: startOfDay(weekStart),
            toDate: endOfDay(now),
        };
    }

    if (normalizedPeriod === "month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            period: "month",
            fromDate: startOfDay(monthStart),
            toDate: endOfDay(now),
        };
    }

    return {
        period: "today",
        fromDate: startOfDay(now),
        toDate: endOfDay(now),
    };
}

function mapToolError(toolName, storeId, err) {
    console.error("[AI Tool] Safe tool error:", {
        tool: toolName,
        store_id: storeId,
        message: err?.message,
        code: err?.code,
    });

    return {
        tool: toolName,
        unavailable: true,
        message: "Some business data is temporarily unavailable. Please try again later.",
    };
}

async function runTool(toolName, storeId, callback) {
    if (!storeId) {
        return mapToolError(toolName, storeId, new Error("Missing backend-controlled storeId"));
    }

    try {
        return await callback();
    } catch (err) {
        return mapToolError(toolName, storeId, err);
    }
}

function buildEmployeeNameSql(alias) {
    return `COALESCE(
        NULLIF(BTRIM(${alias}.name), ''),
        NULLIF(BTRIM(CONCAT(COALESCE(${alias}.first_name, ''), ' ', COALESCE(${alias}.last_name, ''))), ''),
        'Employee'
    )`;
}

export async function getSalesSummary({ storeId, period = "today", from, to }) {
    return runTool(AI_TOOL_NAMES.SALES_SUMMARY, storeId, async () => {
        const range = resolvePeriodRange({ period, from, to });
        const result = await pool.query(
            `WITH sale_item_totals AS (
                 SELECT sale_id, COALESCE(SUM(qty), 0)::int AS items_sold
                 FROM sale_items
                 GROUP BY sale_id
             )
             SELECT
                 COALESCE(SUM(s.total_amount), 0) AS total_revenue,
                 COUNT(s.id)::int AS orders_count,
                 COALESCE(SUM(sit.items_sold), 0)::int AS items_sold
             FROM sales s
             LEFT JOIN sale_item_totals sit ON sit.sale_id = s.id
             WHERE s.store_id = $1
               AND s.created_at >= $2
               AND s.created_at <= $3
               AND LOWER(s.status) = 'completed'`,
            [storeId, range.fromDate, range.toDate]
        );

        const row = result.rows[0] || {};
        const totalRevenue = toNumber(row.total_revenue);
        const ordersCount = toInteger(row.orders_count);

        return {
            period: range.period,
            from: toIsoDate(range.fromDate),
            to: toIsoDate(range.toDate),
            total_revenue: totalRevenue,
            orders_count: ordersCount,
            items_sold: toInteger(row.items_sold),
            average_order_value: ordersCount ? Number((totalRevenue / ordersCount).toFixed(2)) : 0,
        };
    });
}

export async function getSalesByPeriod({ storeId, period = "week", from, to }) {
    return runTool(AI_TOOL_NAMES.SALES_BY_PERIOD, storeId, async () => {
        const range = resolvePeriodRange({ period, from, to });
        const result = await pool.query(
            `WITH sale_item_totals AS (
                 SELECT sale_id, COALESCE(SUM(qty), 0)::int AS items_sold
                 FROM sale_items
                 GROUP BY sale_id
             )
             SELECT
                 DATE(s.created_at) AS date,
                 COALESCE(SUM(s.total_amount), 0) AS revenue,
                 COUNT(s.id)::int AS orders_count,
                 COALESCE(SUM(sit.items_sold), 0)::int AS items_sold
             FROM sales s
             LEFT JOIN sale_item_totals sit ON sit.sale_id = s.id
             WHERE s.store_id = $1
               AND s.created_at >= $2
               AND s.created_at <= $3
               AND LOWER(s.status) = 'completed'
             GROUP BY DATE(s.created_at)
             ORDER BY DATE(s.created_at) ASC`,
            [storeId, range.fromDate, range.toDate]
        );

        const series = result.rows.map((row) => ({
            date: toIsoDate(row.date),
            revenue: toNumber(row.revenue),
            orders_count: toInteger(row.orders_count),
            items_sold: toInteger(row.items_sold),
        }));
        const summary = series.reduce(
            (acc, row) => {
                acc.total_revenue += row.revenue;
                acc.orders_count += row.orders_count;
                acc.items_sold += row.items_sold;
                return acc;
            },
            { total_revenue: 0, orders_count: 0, items_sold: 0 }
        );

        return {
            period: range.period,
            series,
            summary,
        };
    });
}

export async function getLowStockItems({ storeId, limit = DEFAULT_LIMIT }) {
    return runTool(AI_TOOL_NAMES.LOW_STOCK_ITEMS, storeId, async () => {
        const safeLimit = normalizeLimit(limit);
        const result = await pool.query(
            `WITH product_stock AS (
                 SELECT
                     p.id,
                     p.name,
                     p.sku,
                     p.category,
                     p.min_stock,
                     COALESCE(SUM(st.quantity), 0)::int AS current_stock
                 FROM products p
                 LEFT JOIN stock st ON st.product_id = p.id
                 LEFT JOIN warehouses w ON w.id = st.warehouse_id AND w.store_id = p.store_id
                 WHERE p.store_id = $1
                   AND p.is_active IS TRUE
                   AND (st.id IS NULL OR w.id IS NOT NULL)
                 GROUP BY p.id
             )
             SELECT *
             FROM product_stock
             WHERE current_stock <= min_stock
             ORDER BY (min_stock - current_stock) DESC, current_stock ASC, name ASC
             LIMIT $2`,
            [storeId, safeLimit]
        );

        const items = result.rows.map((row) => ({
            product_id: toInteger(row.id),
            name: row.name,
            sku: row.sku || null,
            category: row.category || "Uncategorized",
            current_stock: toInteger(row.current_stock),
            min_stock: toInteger(row.min_stock),
            shortage: Math.max(toInteger(row.min_stock) - toInteger(row.current_stock), 0),
            recommended_restock: Math.max(
                toInteger(row.min_stock) * 2 - toInteger(row.current_stock),
                0
            ),
        }));

        return {
            count: items.length,
            items,
        };
    });
}

export async function getTopProducts({ storeId, period = "month", from, to, limit = 5 }) {
    return runTool(AI_TOOL_NAMES.TOP_PRODUCTS, storeId, async () => {
        const range = resolvePeriodRange({ period, from, to });
        const safeLimit = normalizeLimit(limit, 5);
        const result = await pool.query(
            `SELECT
                 p.id AS product_id,
                 p.name AS product_name,
                 COALESCE(p.category, 'Uncategorized') AS category,
                 COALESCE(SUM(si.qty), 0)::int AS quantity_sold,
                 COALESCE(SUM(GREATEST((si.qty * si.price) - COALESCE(si.discount, 0), 0)), 0) AS revenue
             FROM sales s
             JOIN sale_items si ON si.sale_id = s.id
             JOIN products p ON p.id = si.product_id AND p.store_id = s.store_id
             WHERE s.store_id = $1
               AND s.created_at >= $2
               AND s.created_at <= $3
               AND LOWER(s.status) = 'completed'
             GROUP BY p.id, p.name, p.category
             ORDER BY quantity_sold DESC, revenue DESC, product_name ASC
             LIMIT $4`,
            [storeId, range.fromDate, range.toDate, safeLimit]
        );

        return {
            period: range.period,
            items: result.rows.map((row) => ({
                product_id: toInteger(row.product_id),
                product_name: row.product_name,
                category: row.category,
                quantity_sold: toInteger(row.quantity_sold),
                revenue: toNumber(row.revenue),
            })),
        };
    });
}

export async function getProductStock({ storeId, productName, limit = 5 }) {
    return runTool(AI_TOOL_NAMES.PRODUCT_STOCK, storeId, async () => {
        const safeLimit = normalizeLimit(limit, 5, MAX_PRODUCT_SEARCH_LIMIT);
        const searchText = typeof productName === "string" ? productName.trim().slice(0, 80) : "";
        const searchPattern = `%${searchText}%`;

        if (!searchText) {
            return { matches: [] };
        }

        const result = await pool.query(
            `WITH product_stock AS (
                 SELECT
                     p.id,
                     p.name,
                     p.sku,
                     p.category,
                     p.min_stock,
                     COALESCE(SUM(st.quantity), 0)::int AS current_stock
                 FROM products p
                 LEFT JOIN stock st ON st.product_id = p.id
                 LEFT JOIN warehouses w ON w.id = st.warehouse_id AND w.store_id = p.store_id
                 WHERE p.store_id = $1
                   AND p.is_active IS TRUE
                   AND (p.name ILIKE $2 OR p.sku ILIKE $2)
                   AND (st.id IS NULL OR w.id IS NOT NULL)
                 GROUP BY p.id
             )
             SELECT *
             FROM product_stock
             ORDER BY name ASC
             LIMIT $3`,
            [storeId, searchPattern, safeLimit]
        );

        return {
            matches: result.rows.map((row) => {
                const currentStock = toInteger(row.current_stock);
                const minStock = toInteger(row.min_stock);
                return {
                    product_id: toInteger(row.id),
                    name: row.name,
                    sku: row.sku || null,
                    category: row.category || "Uncategorized",
                    stock: currentStock,
                    current_stock: currentStock,
                    min_stock: minStock,
                    status: currentStock <= 0 ? "out_of_stock" : currentStock <= minStock ? "low_stock" : "in_stock",
                };
            }),
        };
    });
}

export async function getCategoryPerformance({ storeId, period = "month", from, to }) {
    return runTool(AI_TOOL_NAMES.CATEGORY_PERFORMANCE, storeId, async () => {
        const range = resolvePeriodRange({ period, from, to });
        const result = await pool.query(
            `SELECT
                 COALESCE(NULLIF(BTRIM(p.category), ''), 'Uncategorized') AS category,
                 COALESCE(SUM(GREATEST((si.qty * si.price) - COALESCE(si.discount, 0), 0)), 0) AS revenue,
                 COALESCE(SUM(si.qty), 0)::int AS quantity_sold,
                 COUNT(DISTINCT s.id)::int AS orders_count
             FROM sales s
             JOIN sale_items si ON si.sale_id = s.id
             JOIN products p ON p.id = si.product_id AND p.store_id = s.store_id
             WHERE s.store_id = $1
               AND s.created_at >= $2
               AND s.created_at <= $3
               AND LOWER(s.status) = 'completed'
             GROUP BY COALESCE(NULLIF(BTRIM(p.category), ''), 'Uncategorized')
             ORDER BY revenue DESC
             LIMIT $4`,
            [storeId, range.fromDate, range.toDate, MAX_LIMIT]
        );

        const totalRevenue = result.rows.reduce((sum, row) => sum + toNumber(row.revenue), 0);

        return {
            period: range.period,
            categories: result.rows.map((row) => {
                const revenue = toNumber(row.revenue);
                return {
                    category: row.category,
                    revenue,
                    quantity_sold: toInteger(row.quantity_sold),
                    orders_count: toInteger(row.orders_count),
                    share_percent: totalRevenue ? Number(((revenue / totalRevenue) * 100).toFixed(1)) : 0,
                };
            }),
        };
    });
}

export async function getRecentTransactions({ storeId, limit = DEFAULT_LIMIT }) {
    return runTool(AI_TOOL_NAMES.RECENT_TRANSACTIONS, storeId, async () => {
        const safeLimit = normalizeLimit(limit);
        const employeeName = buildEmployeeNameSql("u");
        const result = await pool.query(
            `WITH sale_item_counts AS (
                 SELECT sale_id, COALESCE(SUM(qty), 0)::int AS items_count
                 FROM sale_items
                 GROUP BY sale_id
             )
             SELECT
                 s.created_at AS date,
                 s.total_amount,
                 s.payment_type,
                 ${employeeName} AS employee_name,
                 COALESCE(sic.items_count, 0)::int AS items_count
             FROM sales s
             LEFT JOIN sale_item_counts sic ON sic.sale_id = s.id
             LEFT JOIN users u ON u.id = s.cashier_id AND u.store_id = s.store_id
             WHERE s.store_id = $1
               AND LOWER(s.status) = 'completed'
             ORDER BY s.created_at DESC
             LIMIT $2`,
            [storeId, safeLimit]
        );

        return {
            transactions: result.rows.map((row) => ({
                date: new Date(row.date).toISOString(),
                total_amount: toNumber(row.total_amount),
                payment_type: row.payment_type || null,
                employee_name: row.employee_name || null,
                items_count: toInteger(row.items_count),
            })),
        };
    });
}

export async function getRestockRecommendations({ storeId, limit = DEFAULT_LIMIT }) {
    return runTool(AI_TOOL_NAMES.RESTOCK_RECOMMENDATIONS, storeId, async () => {
        const safeLimit = normalizeLimit(limit);
        const result = await pool.query(
            `WITH product_stock AS (
                 SELECT
                     p.id,
                     p.name,
                     p.category,
                     p.min_stock,
                     COALESCE(SUM(st.quantity), 0)::int AS current_stock
                 FROM products p
                 LEFT JOIN stock st ON st.product_id = p.id
                 LEFT JOIN warehouses w ON w.id = st.warehouse_id AND w.store_id = p.store_id
                 WHERE p.store_id = $1
                   AND p.is_active IS TRUE
                   AND (st.id IS NULL OR w.id IS NOT NULL)
                 GROUP BY p.id
             ),
             recent_sales AS (
                 SELECT
                     si.product_id,
                     COALESCE(SUM(si.qty), 0)::int AS recent_quantity_sold
                 FROM sales s
                 JOIN sale_items si ON si.sale_id = s.id
                 JOIN products p ON p.id = si.product_id AND p.store_id = s.store_id
                 WHERE s.store_id = $1
                   AND s.created_at >= NOW() - INTERVAL '30 days'
                   AND LOWER(s.status) = 'completed'
                 GROUP BY si.product_id
             )
             SELECT
                 ps.id AS product_id,
                 ps.name AS product_name,
                 COALESCE(ps.category, 'Uncategorized') AS category,
                 ps.current_stock,
                 ps.min_stock,
                 COALESCE(rs.recent_quantity_sold, 0)::int AS recent_quantity_sold
             FROM product_stock ps
             LEFT JOIN recent_sales rs ON rs.product_id = ps.id
             WHERE ps.current_stock <= ps.min_stock
             ORDER BY (ps.min_stock - ps.current_stock) DESC,
                      COALESCE(rs.recent_quantity_sold, 0) DESC,
                      ps.name ASC
             LIMIT $2`,
            [storeId, safeLimit]
        );

        return {
            recommendations: result.rows.map((row) => {
                const currentStock = toInteger(row.current_stock);
                const minStock = toInteger(row.min_stock);
                const recentQuantitySold = toInteger(row.recent_quantity_sold);
                return {
                    product_id: toInteger(row.product_id),
                    product_name: row.product_name,
                    category: row.category,
                    current_stock: currentStock,
                    min_stock: minStock,
                    recent_quantity_sold: recentQuantitySold,
                    recommended_quantity: Math.max(minStock * 2 - currentStock, recentQuantitySold, 0),
                    reason: "Current stock is below minimum stock level",
                };
            }),
        };
    });
}

export async function getSafeBusinessContext({ storeId }) {
    const [salesSummary, lowStockItems, topProducts] = await Promise.all([
        getSalesSummary({ storeId, period: "today" }),
        getLowStockItems({ storeId, limit: 5 }),
        getTopProducts({ storeId, period: "month", limit: 5 }),
    ]);

    return {
        sales_summary: salesSummary,
        low_stock_items: lowStockItems,
        top_products: topProducts,
    };
}

export const AI_SAFE_TOOLS = Object.freeze({
    [AI_TOOL_NAMES.SALES_SUMMARY]: getSalesSummary,
    [AI_TOOL_NAMES.SALES_BY_PERIOD]: getSalesByPeriod,
    [AI_TOOL_NAMES.LOW_STOCK_ITEMS]: getLowStockItems,
    [AI_TOOL_NAMES.TOP_PRODUCTS]: getTopProducts,
    [AI_TOOL_NAMES.PRODUCT_STOCK]: getProductStock,
    [AI_TOOL_NAMES.CATEGORY_PERFORMANCE]: getCategoryPerformance,
    [AI_TOOL_NAMES.RECENT_TRANSACTIONS]: getRecentTransactions,
    [AI_TOOL_NAMES.RESTOCK_RECOMMENDATIONS]: getRestockRecommendations,
});
