import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

process.env.NODE_ENV = "test";
process.env.DB_HOST ||= "localhost";
process.env.DB_PORT ||= "5432";
process.env.DB_NAME ||= "inventory_test";
process.env.DB_USER ||= "postgres";
process.env.DB_PASSWORD ||= "postgres_password_here";
process.env.DB_SSL ||= "false";
process.env.DB_INIT_MAX_RETRIES ||= "1";
process.env.DB_INIT_RETRY_DELAY_MS ||= "1";
process.env.JWT_SECRET ||= "reports-test-secret";

const { initializeDatabase } = await import("../src/utils/db-init.js");
const { initDb, closeDb, safeQuery } = await import("../src/utils/db.js");
const { default: app } = await import("../src/app.js");

let setupError = null;
let dbReady = false;
let server = null;
let baseUrl = "";

async function resetTestData() {
    await safeQuery(
        `TRUNCATE notifications, sale_items, sales, movements, stock, products, users, warehouses, stores
         RESTART IDENTITY CASCADE`
    );
}

async function seedReportsFixture() {
    const passwordHash = await bcrypt.hash("test123", 10);

    const storeResult = await safeQuery(
        `INSERT INTO stores (name, slug, status, plan, region, created_at, updated_at)
         VALUES ($1, $2, 'active', 'default', 'local', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        ["Reports Test Store", "reports-test-store"]
    );
    const storeId = Number(storeResult.rows[0].id);

    const warehouseResult = await safeQuery(
        `INSERT INTO warehouses (store_id, name, type, created_at, updated_at)
         VALUES ($1, $2, 'store', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [storeId, "Reports Main Warehouse"]
    );
    const warehouseId = Number(warehouseResult.rows[0].id);

    await safeQuery(
        `UPDATE stores
         SET primary_warehouse_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [warehouseId, storeId]
    );

    const usersResult = await safeQuery(
        `INSERT INTO users
             (store_id, email, first_name, last_name, store_name, password_hash, role, is_active)
         VALUES
             ($1, 'owner@test.local', 'Test', 'Owner', 'Reports Test Store', $2, 'owner', TRUE),
             ($1, 'manager@test.local', 'Mira', 'Manager', 'Reports Test Store', $2, 'manager', TRUE),
             ($1, 'cashier@test.local', 'Dias', 'Cashier', 'Reports Test Store', $2, 'cashier', TRUE),
             ($1, 'staff@test.local', 'Staff', 'Member', 'Reports Test Store', $2, 'staff', TRUE)
         RETURNING id, email, role`,
        [storeId, passwordHash]
    );

    const usersByEmail = Object.fromEntries(
        usersResult.rows.map((row) => [row.email, Number(row.id)])
    );

    const productsResult = await safeQuery(
        `INSERT INTO products
             (store_id, name, sku, category, purchase_price, sale_price, min_stock, is_active)
         VALUES
             ($1, 'Milk 1L', 'MILK-001', 'Food', 500, 800, 2, TRUE),
             ($1, 'Sparkling Water', 'WATER-001', 'Drinks', 120, 220, 5, TRUE)
         RETURNING id, sku`,
        [storeId]
    );
    const productsBySku = Object.fromEntries(
        productsResult.rows.map((row) => [row.sku, Number(row.id)])
    );

    await safeQuery(
        `INSERT INTO stock (product_id, warehouse_id, quantity)
         VALUES ($1, $3, 20), ($2, $3, 20)`,
        [productsBySku["MILK-001"], productsBySku["WATER-001"], warehouseId]
    );

    const completedSale = await safeQuery(
        `INSERT INTO sales
             (store_id, cashier_id, warehouse_id, total_amount, discount, payment_type, status, created_at)
         VALUES ($1, $2, $3, 2900, 0, 'CARD', 'completed', '2026-06-05T10:35:00.000Z')
         RETURNING id`,
        [storeId, usersByEmail["cashier@test.local"], warehouseId]
    );
    const completedSaleId = Number(completedSale.rows[0].id);

    await safeQuery(
        `INSERT INTO sale_items (sale_id, product_id, qty, price, discount)
         VALUES
             ($1, $2, 3, 800, 0),
             ($1, $3, 1, 500, 0)`,
        [completedSaleId, productsBySku["MILK-001"], productsBySku["WATER-001"]]
    );

    const returnedSale = await safeQuery(
        `INSERT INTO sales
             (store_id, cashier_id, warehouse_id, total_amount, discount, payment_type, status, created_at)
         VALUES ($1, $2, $3, 800, 0, 'CASH', 'returned', '2026-06-03T09:10:00.000Z')
         RETURNING id`,
        [storeId, usersByEmail["cashier@test.local"], warehouseId]
    );
    const returnedSaleId = Number(returnedSale.rows[0].id);

    await safeQuery(
        `INSERT INTO sale_items (sale_id, product_id, qty, price, discount)
         VALUES ($1, $2, 1, 800, 0)`,
        [returnedSaleId, productsBySku["MILK-001"]]
    );

    await safeQuery(
        `INSERT INTO movements
             (store_id, product_id, type, warehouse_id, direction, source_type, warehouse_from, warehouse_to, qty, reason, related_entity_id, created_by, created_at)
         VALUES
             ($1, $2, 'RETURN', $3, 1, 'RETURN', NULL, $3, 1, 'Return of sale', $4, $5, '2026-06-06T15:20:00.000Z'),
             ($1, $2, 'OUT', $3, -1, 'OUT', $3, NULL, 2, 'Damaged goods write-off', NULL, $6, '2026-06-07T08:00:00.000Z')`,
        [
            storeId,
            productsBySku["MILK-001"],
            warehouseId,
            returnedSaleId,
            usersByEmail["manager@test.local"],
            usersByEmail["manager@test.local"],
        ]
    );
}

async function startHttpServer() {
    return await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });
}

function skipWhenDatabaseUnavailable(t) {
    if (setupError) {
        t.skip(`PostgreSQL test database is unavailable: ${setupError.message}`);
        return true;
    }
    return false;
}

async function apiRequest(path, { method = "GET", token = null, body = null } = {}) {
    const headers = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    if (body) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const json = await response.json();
    return { status: response.status, body: json };
}

async function login(email) {
    const response = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password: "test123" },
    });
    assert.equal(response.status, 200);
    return response.body.data.token;
}

before(async () => {
    try {
        await initializeDatabase();
        await initDb();
        await resetTestData();
        await seedReportsFixture();
        server = await startHttpServer();
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        dbReady = true;
    } catch (err) {
        setupError = err;
    }
});

after(async () => {
    if (server) {
        await new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });
    }

    if (dbReady) {
        await resetTestData();
        await closeDb();
    }
});

test("reports filters endpoint returns scoped options for owner", async (t) => {
    if (skipWhenDatabaseUnavailable(t)) return;

    const token = await login("owner@test.local");
    const response = await apiRequest("/api/reports/filters", { token });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.products.length, 2);
    assert.deepEqual(response.body.data.categories, ["Drinks", "Food"]);
    assert.ok(response.body.data.employees.some((employee) => employee.role === "manager"));
    assert.equal(
        response.body.data.operationTypes.find((item) => item.value === "WRITE_OFF").supported,
        false
    );
    assert.equal(JSON.stringify(response.body).includes("password_hash"), false);
});

test("transactions endpoint supports sale, category, and employee filters", async (t) => {
    if (skipWhenDatabaseUnavailable(t)) return;

    const token = await login("owner@test.local");

    const allRows = await apiRequest("/api/reports/transactions?from=2026-06-01&to=2026-06-08", {
        token,
    });
    assert.equal(allRows.status, 200);
    assert.equal(allRows.body.data.pagination.total, 3);
    assert.deepEqual(
        allRows.body.data.transactions.map((row) => row.operation_type),
        ["RETURN", "SALE", "SALE"]
    );

    const saleRows = await apiRequest(
        "/api/reports/transactions?from=2026-06-01&to=2026-06-08&operation_type=SALE",
        { token }
    );
    assert.equal(saleRows.status, 200);
    assert.equal(saleRows.body.data.pagination.total, 2);
    assert.ok(saleRows.body.data.transactions.every((row) => row.operation_type === "SALE"));

    const categoryRows = await apiRequest(
        "/api/reports/transactions?from=2026-06-01&to=2026-06-08&category=Food",
        { token }
    );
    assert.equal(categoryRows.status, 200);
    assert.equal(categoryRows.body.data.pagination.total, 2);
    assert.ok(categoryRows.body.data.transactions.every((row) => row.category === "Food"));

    const employeeRows = await apiRequest(
        "/api/reports/transactions?from=2026-06-01&to=2026-06-08&employee_id=2",
        { token }
    );
    assert.equal(employeeRows.status, 200);
    assert.equal(employeeRows.body.data.pagination.total, 1);
    assert.equal(employeeRows.body.data.transactions[0].operation_type, "RETURN");
});

test("revenue daily endpoint returns completed sales summary only", async (t) => {
    if (skipWhenDatabaseUnavailable(t)) return;

    const token = await login("owner@test.local");

    const response = await apiRequest("/api/reports/revenue-daily?from=2026-06-01&to=2026-06-08", {
        token,
    });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data.period, {
        from: "2026-06-01",
        to: "2026-06-08",
    });
    assert.deepEqual(response.body.data.series, [
        {
            date: "2026-06-05",
            revenue: 2900,
            orders_count: 1,
            items_sold: 4,
        },
    ]);
    assert.deepEqual(response.body.data.summary, {
        total_revenue: 2900,
        orders_count: 1,
        items_sold: 4,
        average_order_value: 2900,
    });

    const returnsOnly = await apiRequest(
        "/api/reports/revenue-daily?from=2026-06-01&to=2026-06-08&operation_type=RETURN",
        { token }
    );
    assert.equal(returnsOnly.status, 200);
    assert.deepEqual(returnsOnly.body.data.series, []);
    assert.equal(returnsOnly.body.data.summary.total_revenue, 0);
});

test("reports endpoints reject invalid params and unauthorized roles", async (t) => {
    if (skipWhenDatabaseUnavailable(t)) return;

    const ownerToken = await login("owner@test.local");
    const cashierToken = await login("cashier@test.local");

    const invalid = await apiRequest("/api/reports/transactions?from=2026-06-40", {
        token: ownerToken,
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.success, false);

    const unauthorized = await apiRequest("/api/reports/filters");
    assert.equal(unauthorized.status, 401);

    const forbidden = await apiRequest("/api/reports/filters", {
        token: cashierToken,
    });
    assert.equal(forbidden.status, 403);
});
