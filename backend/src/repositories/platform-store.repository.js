import { safeQuery, withTransaction } from "../utils/db.js";
import { mapStoreRow, normalizeStoreStatus, statusToWarehouseType } from "../domain/platform-store.domain.js";

async function getStoreByIdWithExecutor(executor, id) {
    const result = await executor(
        `SELECT s.id,
                s.name,
                s.slug,
                s.owner_email,
                s.status,
                s.plan,
                s.region,
                s.address,
                s.primary_warehouse_id,
                s.created_at,
                MAX(sa.created_at) AS last_active_at,
                COUNT(DISTINCT w.id) AS warehouse_count
         FROM stores s
         LEFT JOIN warehouses w ON w.store_id = s.id
         LEFT JOIN sales sa ON sa.warehouse_id = w.id
         WHERE s.id = $1
         GROUP BY s.id, s.name, s.slug, s.owner_email, s.status, s.plan, s.region, s.address, s.primary_warehouse_id, s.created_at`,
        [id]
    );

    return mapStoreRow(result.rows?.[0] || null);
}

export async function listStoresRepo() {
    const result = await safeQuery(
        `SELECT s.id,
                s.name,
                s.slug,
                s.owner_email,
                s.status,
                s.plan,
                s.region,
                s.address,
                s.primary_warehouse_id,
                s.created_at,
                MAX(sa.created_at) AS last_active_at,
                COUNT(DISTINCT w.id) AS warehouse_count
         FROM stores s
         LEFT JOIN warehouses w ON w.store_id = s.id
         LEFT JOIN sales sa ON sa.warehouse_id = w.id
         GROUP BY s.id, s.name, s.slug, s.owner_email, s.status, s.plan, s.region, s.address, s.primary_warehouse_id, s.created_at
         ORDER BY s.created_at DESC`
    );

    return (result.rows || []).map(mapStoreRow);
}

export async function findStoreByIdRepo(id) {
    return getStoreByIdWithExecutor((q, p) => safeQuery(q, p), id);
}

export async function findStoreBySlugRepo(slug) {
    const result = await safeQuery(
        `SELECT id
         FROM stores
         WHERE slug = $1
         LIMIT 1`,
        [slug]
    );

    return result.rows?.[0] || null;
}

export async function createStoreRepo({
    name,
    slug,
    ownerEmail = null,
    plan = "standard",
    region = "local",
    address = null,
    status = "active",
}) {
    const normalizedStatus = normalizeStoreStatus(status);
    const warehouseType = statusToWarehouseType(normalizedStatus);

    const createdStoreId = await withTransaction(async (client) => {
        const insertStoreResult = await client.query(
            `INSERT INTO stores (name, slug, owner_email, status, plan, region, address, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id`,
            [name, slug, ownerEmail, normalizedStatus, plan, region, address]
        );

        const storeId = Number(insertStoreResult.rows[0].id);

        const insertWarehouseResult = await client.query(
            `INSERT INTO warehouses (name, type, address, store_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id`,
            [name, warehouseType, address, storeId]
        );

        const primaryWarehouseId = Number(insertWarehouseResult.rows[0].id);

        await client.query(
            `UPDATE stores
             SET primary_warehouse_id = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [primaryWarehouseId, storeId]
        );

        return storeId;
    });

    return findStoreByIdRepo(createdStoreId);
}

export async function updateStoreStatusRepo(id, targetStatus) {
    const normalizedStatus = normalizeStoreStatus(targetStatus);
    const warehouseType = statusToWarehouseType(normalizedStatus);

    const updatedId = await withTransaction(async (client) => {
        const updateStore = await client.query(
            `UPDATE stores
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, primary_warehouse_id`,
            [normalizedStatus, id]
        );

        if (!updateStore.rows.length) {
            return null;
        }

        const store = updateStore.rows[0];

        if (store.primary_warehouse_id) {
            await client.query(
                `UPDATE warehouses
                 SET type = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [warehouseType, store.primary_warehouse_id]
            );
        }

        return Number(store.id);
    });

    if (!updatedId) {
        return null;
    }

    return findStoreByIdRepo(updatedId);
}

export async function getStoreHealthRepo(id) {
    const summaryResult = await safeQuery(
        `SELECT s.id,
                s.name,
                COUNT(DISTINCT w.id) AS warehouse_count,
                COUNT(DISTINCT st.id) AS stock_count,
                COUNT(DISTINCT sa.id) AS sales_count
         FROM stores s
         LEFT JOIN warehouses w ON w.store_id = s.id
         LEFT JOIN stock st ON st.warehouse_id = w.id
         LEFT JOIN sales sa ON sa.warehouse_id = w.id
         WHERE s.id = $1
         GROUP BY s.id, s.name`,
        [id]
    );

    const row = summaryResult.rows?.[0] || null;
    if (!row) {
        return null;
    }

    const userCountResult = await safeQuery(
        `SELECT COUNT(*) AS user_count
         FROM users
         WHERE store_name = $1`,
        [row.name]
    );

    return {
        storeId: Number(row.id),
        warehouseCount: Number(row.warehouse_count || 0),
        stockCount: Number(row.stock_count || 0),
        salesCount: Number(row.sales_count || 0),
        userCount: Number(userCountResult.rows?.[0]?.user_count || 0),
    };
}

export async function getStoreActivityRepo(id, limit = 50) {
    const result = await safeQuery(
        `SELECT sa.id,
                sa.total_amount,
                sa.payment_type,
                sa.status,
                sa.created_at
         FROM sales sa
         WHERE sa.warehouse_id IN (
             SELECT w.id
             FROM warehouses w
             WHERE w.store_id = $1
         )
         ORDER BY sa.created_at DESC
         LIMIT $2`,
        [id, limit]
    );

    return result.rows || [];
}

export async function getPlatformActivityFeedRepo(limit = 20) {
    const result = await safeQuery(
        `SELECT sa.id,
                sa.total_amount,
                sa.status,
                sa.created_at,
                s.name AS store_name
         FROM sales sa
         LEFT JOIN warehouses w ON w.id = sa.warehouse_id
         LEFT JOIN stores s ON s.id = w.store_id
         ORDER BY sa.created_at DESC
         LIMIT $1`,
        [limit]
    );

    return result.rows || [];
}

export async function getPlatformMetricsSummaryRepo() {
    const thresholdDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const storesResult = await safeQuery(
        `SELECT COUNT(*) AS total_stores,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_stores
         FROM stores`
    );

    const productsResult = await safeQuery(
        `SELECT COUNT(*) AS products
         FROM products`
    );

    const salesResult = await safeQuery(
        `SELECT COUNT(*) AS recent_sales
         FROM sales
         WHERE created_at >= $1`,
        [thresholdDate]
    );

    return {
        totalStores: Number(storesResult.rows?.[0]?.total_stores || 0),
        activeStores: Number(storesResult.rows?.[0]?.active_stores || 0),
        products: Number(productsResult.rows?.[0]?.products || 0),
        recentSales: Number(salesResult.rows?.[0]?.recent_sales || 0),
    };
}

export async function getPlatformMetricsGrowthRepo(days = 7) {
    const thresholdDate = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = await safeQuery(
        `SELECT created_at
         FROM stores
         WHERE created_at >= $1
         ORDER BY created_at ASC`,
        [thresholdDate]
    );

    const buckets = new Map();
    for (const row of result.rows || []) {
        const day = new Date(row.created_at).toISOString().slice(0, 10);
        buckets.set(day, (buckets.get(day) || 0) + 1);
    }

    return [...buckets.entries()].map(([day, count]) => ({
        day,
        count,
    }));
}
