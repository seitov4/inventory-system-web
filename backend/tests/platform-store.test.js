import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { ERROR_CODES } from "../src/errors/error-codes.js";

process.env.NODE_ENV = "test";
process.env.DB_HOST ||= "localhost";
process.env.DB_PORT ||= "5432";
process.env.DB_NAME ||= "inventory_test";
process.env.DB_USER ||= "postgres";
process.env.DB_PASSWORD ||= "postgres_password_here";
process.env.DB_SSL ||= "false";
process.env.DB_INIT_MAX_RETRIES ||= "1";
process.env.DB_INIT_RETRY_DELAY_MS ||= "1";

const { initializeDatabase } = await import("../src/utils/db-init.js");
const { initDb, closeDb, safeQuery } = await import("../src/utils/db.js");
const platformService = await import("../src/services/platform.service.js");

let setupError = null;
let dbReady = false;

async function resetTestData() {
    await safeQuery(
        `TRUNCATE notifications, sale_items, sales, movements, stock, products, users, warehouses, stores
         RESTART IDENTITY CASCADE`
    );
}

before(async () => {
    try {
        await initializeDatabase();
        await initDb();
        await resetTestData();
        dbReady = true;
    } catch (err) {
        setupError = err;
    }
});

after(async () => {
    if (dbReady) {
        await resetTestData();
        await closeDb();
    }
});

function skipWhenDatabaseUnavailable(t) {
    if (setupError) {
        t.skip(`PostgreSQL test database is unavailable: ${setupError.message}`);
        return true;
    }
    return false;
}

test(
    "platform stores are isolated from standalone warehouses",
    { concurrency: false },
    async (t) => {
        if (skipWhenDatabaseUnavailable(t)) return;
        const initialStores = await platformService.listStores();
        assert.equal(initialStores.length, 0);

        const created = await platformService.createStore({
            name: "Alpha Store",
            slug: "alpha-store",
            ownerEmail: "owner@alpha.test",
            address: "Alpha Address",
        });

        assert.ok(created.id > 0);
        assert.equal(created.slug, "alpha-store");
        assert.ok(created.primaryWarehouseId > 0);

        const stores = await platformService.listStores();
        assert.equal(stores.length, 1);
        assert.equal(stores[0].name, "Alpha Store");
        assert.equal(stores[0].status, "active");
    }
);

test(
    "store lifecycle transitions are explicit and validated",
    { concurrency: false },
    async (t) => {
        if (skipWhenDatabaseUnavailable(t)) return;
        const store = await platformService.createStore({
            name: "Lifecycle Store",
            slug: "lifecycle-store",
            ownerEmail: "owner@lifecycle.test",
        });

        const suspended = await platformService.updateStoreStatus(store.id, "suspended");
        assert.equal(suspended.status, "suspended");

        const resumed = await platformService.updateStoreStatus(store.id, "active");
        assert.equal(resumed.status, "active");

        const inactive = await platformService.updateStoreStatus(store.id, "inactive");
        assert.equal(inactive.status, "inactive");

        await assert.rejects(
            () => platformService.updateStoreStatus(store.id, "active"),
            (err) => err?.code === ERROR_CODES.PLATFORM_STORE_STATUS_TRANSITION_INVALID
        );

        const deleted = await platformService.updateStoreStatus(store.id, "deleted");
        assert.equal(deleted.status, "deleted");
    }
);

test(
    "store delete is soft and keeps related tenant data",
    { concurrency: false },
    async (t) => {
        if (skipWhenDatabaseUnavailable(t)) return;
        const timestamp = Date.now();
        const store = await platformService.createStore({
            name: `Soft Delete Store ${timestamp}`,
            slug: `soft-delete-store-${timestamp}`,
            ownerEmail: `owner-${timestamp}@soft-delete.test`,
        });

        const userResult = await safeQuery(
            `INSERT INTO users (store_id, email, first_name, last_name, store_name, password_hash, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                store.id,
                `cashier-${timestamp}@soft-delete.test`,
                "Cashier",
                "User",
                store.name,
                "test-hash",
                "cashier",
            ]
        );
        const userId = Number(userResult.rows[0].id);

        const productResult = await safeQuery(
            `INSERT INTO products (store_id, name, sku, purchase_price, sale_price, min_stock)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [store.id, `Product ${timestamp}`, `SOFT-${timestamp}`, 10, 20, 1]
        );
        const productId = Number(productResult.rows[0].id);

        await safeQuery(
            `INSERT INTO sales (cashier_id, warehouse_id, store_id, total, total_amount, discount, payment_type, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, store.primaryWarehouseId, store.id, 50, 50, 0, "CASH", "COMPLETED"]
        );

        const deleted = await platformService.updateStoreStatus(store.id, "deleted");
        assert.equal(deleted.status, "deleted");

        const counts = await safeQuery(
            `SELECT
                (SELECT COUNT(*)::int FROM stores WHERE id = $1 AND status = 'deleted') AS stores,
                (SELECT COUNT(*)::int FROM warehouses WHERE store_id = $1) AS warehouses,
                (SELECT COUNT(*)::int FROM users WHERE store_id = $1) AS users,
                (SELECT COUNT(*)::int FROM products WHERE id = $2 AND store_id = $1) AS products,
                (SELECT COUNT(*)::int FROM sales WHERE store_id = $1) AS sales`,
            [store.id, productId]
        );

        assert.equal(counts.rows[0].stores, 1);
        assert.equal(counts.rows[0].warehouses, 1);
        assert.equal(counts.rows[0].users, 1);
        assert.equal(counts.rows[0].products, 1);
        assert.equal(counts.rows[0].sales, 1);
    }
);

test(
    "store health and activity are resolved through store -> warehouses relation",
    { concurrency: false },
    async (t) => {
        if (skipWhenDatabaseUnavailable(t)) return;
        const timestamp = Date.now();
        const store = await platformService.createStore({
            name: `Observability Store ${timestamp}`,
            slug: `observability-store-${timestamp}`,
            ownerEmail: `owner-${timestamp}@obs.test`,
        });

        assert.ok(store.primaryWarehouseId);

        const userResult = await safeQuery(
            `INSERT INTO users (store_id, email, first_name, last_name, store_name, password_hash, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                store.id,
                `cashier-${timestamp}@obs.test`,
                "Cashier",
                "User",
                store.name,
                "test-hash",
                "cashier",
            ]
        );
        const userId = Number(userResult.rows[0].id);

        const productResult = await safeQuery(
            `INSERT INTO products (store_id, name, sku, purchase_price, sale_price, min_stock)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [store.id, `Product ${timestamp}`, `SKU-${timestamp}`, 10, 20, 1]
        );
        const productId = Number(productResult.rows[0].id);

        await safeQuery(
            `INSERT INTO stock (product_id, warehouse_id, quantity)
             VALUES ($1, $2, $3)`,
            [productId, store.primaryWarehouseId, 5]
        );

        const saleResult = await safeQuery(
            `INSERT INTO sales (cashier_id, warehouse_id, store_id, total, total_amount, discount, payment_type, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [userId, store.primaryWarehouseId, store.id, 100, 100, 0, "CASH", "COMPLETED"]
        );
        const saleId = Number(saleResult.rows[0].id);

        const health = await platformService.getStoreHealth(store.id);
        assert.equal(health.stockCount, 1);
        assert.equal(health.salesCount, 1);
        assert.equal(health.userCount, 1);

        const activity = await platformService.getStoreActivity(store.id);
        assert.ok(activity.some((event) => Number(event.id) === saleId));
    }
);
