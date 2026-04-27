import "dotenv/config";
import bcrypt from "bcryptjs";
import { closeDb, getDatabaseInfo, initDb, withTransaction } from "../src/utils/db.js";

const STORE = {
    name: "Inventix Demo Market",
    slug: "inventix-demo-market",
    ownerEmail: "owner@test.local",
    plan: "standard",
    region: "aws-eu-north-1",
    address: "Astana demo district, 10",
};

const USERS = [
    {
        email: "owner@test.local",
        phone: "+77006521158",
        firstName: "Test",
        lastName: "Owner",
        password: "test123",
        role: "owner",
    },
    {
        email: "manager@test.local",
        phone: "+77006521159",
        firstName: "Mira",
        lastName: "Manager",
        password: "test123",
        role: "manager",
    },
    {
        email: "cashier@test.local",
        phone: "+77006521160",
        firstName: "Dias",
        lastName: "Cashier",
        password: "test123",
        role: "cashier",
    },
];

const PRODUCTS = [
    ["Test Coffee Beans 1kg", "TEST-COFFEE-001", "2000000000011", "Groceries", 1800, 2490, 5, 28],
    ["Test Oat Milk 1L", "TEST-MILK-001", "2000000000042", "Dairy", 620, 990, 8, 34],
    ["Test Chocolate Bar", "TEST-CHOCO-001", "2000000000035", "Snacks", 220, 390, 12, 46],
    ["Test Mineral Water 0.5L", "TEST-WATER-001", "2000000000059", "Drinks", 110, 220, 24, 96],
    ["Test Thermal Receipt Paper", "TEST-PAPER-001", "2000000000028", "Supplies", 350, 650, 10, 7],
    ["Test Notebook A5", "TEST-NOTE-001", "2000000000066", "Stationery", 480, 890, 6, 18],
    ["Test Granola Pack", "TEST-GRANOLA-001", "2000000000073", "Groceries", 740, 1290, 10, 9],
    ["Test Green Tea", "TEST-TEA-001", "2000000000080", "Drinks", 950, 1590, 7, 22],
    ["Test USB Cable", "TEST-CABLE-001", "2000000000097", "Electronics", 700, 1490, 4, 11],
    ["Test Hand Sanitizer", "TEST-SANITIZER-001", "2000000000103", "Health", 420, 790, 10, 13],
].map(([name, sku, barcode, category, purchasePrice, salePrice, minStock, quantity]) => ({
    name,
    sku,
    barcode,
    category,
    purchasePrice,
    salePrice,
    minStock,
    quantity,
}));

const NOTIFICATIONS = [
    ["LOW_STOCK", "Receipt paper is below target stock"],
    ["LOW_STOCK", "Granola needs replenishment this week"],
    ["INFO", "AWS RDS demo dataset has been refreshed"],
    ["SALES_SUMMARY", "Daily sales summary is ready"],
];

function daysAgo(days, hour = 10, minute = 0) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(hour, minute, 0, 0);
    return date;
}

async function upsertUser(client, user) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const result = await client.query(
        `INSERT INTO users
             (email, phone, first_name, last_name, store_name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email)
         DO UPDATE SET
             phone = EXCLUDED.phone,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             store_name = EXCLUDED.store_name,
             password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             updated_at = CURRENT_TIMESTAMP
         RETURNING id, email, phone, first_name, last_name, store_name, role`,
        [
            user.email,
            user.phone,
            user.firstName,
            user.lastName,
            STORE.name,
            passwordHash,
            user.role,
        ]
    );
    return result.rows[0];
}

async function upsertStore(client) {
    const storeResult = await client.query(
        `INSERT INTO stores
             (name, slug, owner_email, status, plan, region, address, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (slug)
         DO UPDATE SET
             name = EXCLUDED.name,
             owner_email = EXCLUDED.owner_email,
             status = 'active',
             plan = EXCLUDED.plan,
             region = EXCLUDED.region,
             address = EXCLUDED.address,
             updated_at = CURRENT_TIMESTAMP
         RETURNING id, name, slug, primary_warehouse_id`,
        [STORE.name, STORE.slug, STORE.ownerEmail, STORE.plan, STORE.region, STORE.address]
    );
    const store = storeResult.rows[0];

    const warehouseResult = await client.query(
        `INSERT INTO warehouses (name, type, store_id, address, created_at, updated_at)
         VALUES ($1, 'store', $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [`${STORE.name} Main Warehouse`, store.id, STORE.address]
    );

    let warehouseId = warehouseResult.rows[0]?.id;
    if (!warehouseId) {
        const existing = await client.query(
            `SELECT id FROM warehouses WHERE store_id = $1 ORDER BY id LIMIT 1`,
            [store.id]
        );
        warehouseId = existing.rows[0].id;
    }

    await client.query(
        `UPDATE stores
         SET primary_warehouse_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [warehouseId, store.id]
    );

    return { ...store, primary_warehouse_id: warehouseId };
}

async function upsertProduct(client, product, warehouseId) {
    const productResult = await client.query(
        `INSERT INTO products
             (name, sku, barcode, category, purchase_price, sale_price, min_stock, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (sku)
         DO UPDATE SET
             name = EXCLUDED.name,
             barcode = EXCLUDED.barcode,
             category = EXCLUDED.category,
             purchase_price = EXCLUDED.purchase_price,
             sale_price = EXCLUDED.sale_price,
             min_stock = EXCLUDED.min_stock,
             is_active = TRUE,
             updated_at = CURRENT_TIMESTAMP
         RETURNING id, name, sku, sale_price, min_stock`,
        [
            product.name,
            product.sku,
            product.barcode,
            product.category,
            product.purchasePrice,
            product.salePrice,
            product.minStock,
        ]
    );
    const saved = productResult.rows[0];

    await client.query(
        `INSERT INTO stock (product_id, warehouse_id, quantity, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (product_id, warehouse_id)
         DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP`,
        [saved.id, warehouseId, product.quantity]
    );

    return { ...saved, quantity: product.quantity, salePrice: product.salePrice };
}

async function clearDemoActivity(client, userIds, warehouseId) {
    await client.query(
        `DELETE FROM sales
         WHERE warehouse_id = $1
            OR cashier_id = ANY($2::int[])`,
        [warehouseId, userIds]
    );
    await client.query(
        `DELETE FROM movements
         WHERE warehouse_id = $1
            OR warehouse_from = $1
            OR warehouse_to = $1
            OR source_type = 'seed'
            OR reason LIKE 'Demo %'`,
        [warehouseId]
    );
    await client.query(
        `DELETE FROM notifications
         WHERE user_id = ANY($1::int[])
           AND type IN ('LOW_STOCK', 'INFO', 'SALES_SUMMARY', 'seed.ready')`,
        [userIds]
    );
}

async function seedMovements(client, products, warehouseId, users) {
    for (const [index, product] of products.entries()) {
        await client.query(
            `INSERT INTO movements
                 (product_id, warehouse_id, direction, source_type, warehouse_to, quantity, qty, type, reason, created_by, created_at)
             VALUES ($1, $2, 1, 'seed', $2, $3, $3, 'IN', $4, $5, $6)`,
            [
                product.id,
                warehouseId,
                Math.max(product.quantity, 1),
                "Demo initial stock",
                users.manager.id,
                daysAgo(14 - (index % 5), 9 + (index % 4), 15),
            ]
        );
    }

    for (const product of products.slice(3, 6)) {
        await client.query(
            `INSERT INTO movements
                 (product_id, warehouse_id, direction, source_type, warehouse_from, quantity, qty, type, reason, created_by, created_at)
             VALUES ($1, $2, -1, 'seed', $2, 2, 2, 'OUT', 'Demo damaged goods write-off', $3, $4)`,
            [product.id, warehouseId, users.manager.id, daysAgo(3, 16, 30)]
        );
    }
}

async function seedSales(client, products, warehouseId, users) {
    const patterns = [
        [13, 10, 20, [["TEST-COFFEE-001", 2], ["TEST-CHOCO-001", 4]]],
        [12, 15, 5, [["TEST-WATER-001", 6], ["TEST-SANITIZER-001", 1]]],
        [10, 12, 40, [["TEST-MILK-001", 3], ["TEST-GRANOLA-001", 2]]],
        [9, 18, 10, [["TEST-TEA-001", 1], ["TEST-NOTE-001", 2]]],
        [7, 11, 25, [["TEST-COFFEE-001", 1], ["TEST-CABLE-001", 1]]],
        [6, 14, 55, [["TEST-WATER-001", 8], ["TEST-CHOCO-001", 5]]],
        [4, 16, 15, [["TEST-MILK-001", 2], ["TEST-TEA-001", 2]]],
        [3, 13, 30, [["TEST-PAPER-001", 1], ["TEST-NOTE-001", 1]]],
        [2, 17, 45, [["TEST-COFFEE-001", 2], ["TEST-GRANOLA-001", 1]]],
        [1, 12, 10, [["TEST-WATER-001", 10], ["TEST-CHOCO-001", 3]]],
        [0, 10, 35, [["TEST-TEA-001", 2], ["TEST-SANITIZER-001", 2]]],
        [0, 18, 5, [["TEST-CABLE-001", 1], ["TEST-MILK-001", 1]]],
    ];

    const bySku = new Map(products.map((product) => [product.sku, product]));

    for (const [days, hour, minute, items] of patterns) {
        const saleItems = items.map(([sku, qty]) => {
            const product = bySku.get(sku);
            return { product, qty, price: Number(product.salePrice) };
        });
        const total = saleItems.reduce((sum, item) => sum + item.qty * item.price, 0);
        const createdAt = daysAgo(days, hour, minute);
        const status = days === 9 ? "RETURNED" : "COMPLETED";

        const saleResult = await client.query(
            `INSERT INTO sales
                 (cashier_id, warehouse_id, store_id, total, total_amount, discount, payment_type, status, created_at)
             VALUES ($1, $2, $2, $3, $3, 0, $4, $5, $6)
             RETURNING id`,
            [
                users.cashier.id,
                warehouseId,
                total,
                days % 2 === 0 ? "CARD" : "CASH",
                status,
                createdAt,
            ]
        );
        const saleId = saleResult.rows[0].id;

        for (const item of saleItems) {
            await client.query(
                `INSERT INTO sale_items (sale_id, product_id, qty, quantity, price, discount)
                 VALUES ($1, $2, $3, $3, $4, 0)`,
                [saleId, item.product.id, item.qty, item.price]
            );

            await client.query(
                `INSERT INTO movements
                     (product_id, warehouse_id, direction, source_type, warehouse_from, quantity, qty, type, reason, related_entity_id, created_by, created_at)
                 VALUES ($1, $2, -1, 'SALE', $2, $3, $3, 'SALE', $4, $5, $6, $7)`,
                [
                    item.product.id,
                    warehouseId,
                    item.qty,
                    `Demo sale #${saleId}`,
                    saleId,
                    users.cashier.id,
                    createdAt,
                ]
            );
        }
    }
}

async function seedNotifications(client, users) {
    for (const user of [users.owner, users.manager]) {
        for (const [index, [type, message]] of NOTIFICATIONS.entries()) {
            await client.query(
                `INSERT INTO notifications (type, user_id, payload, status, is_read, created_at)
                 VALUES ($1, $2, $3::jsonb, $4, $5, $6)`,
                [
                    type,
                    user.id,
                    JSON.stringify({ message, store: STORE.name }),
                    index === 3 ? "READ" : "NEW",
                    index === 3,
                    daysAgo(index, 9 + index, 0),
                ]
            );
        }
    }
}

async function seed() {
    await initDb();
    const dbInfo = getDatabaseInfo();
    console.log(`Seeding demo data into ${dbInfo.target}`);

    const summary = await withTransaction(async (client) => {
        const store = await upsertStore(client);
        const usersArray = [];
        for (const user of USERS) {
            usersArray.push(await upsertUser(client, user));
        }
        const users = {
            owner: usersArray.find((user) => user.role === "owner"),
            manager: usersArray.find((user) => user.role === "manager"),
            cashier: usersArray.find((user) => user.role === "cashier"),
        };

        await clearDemoActivity(
            client,
            usersArray.map((user) => user.id),
            store.primary_warehouse_id
        );

        const products = [];
        for (const product of PRODUCTS) {
            products.push(await upsertProduct(client, product, store.primary_warehouse_id));
        }

        await seedMovements(client, products, store.primary_warehouse_id, users);
        await seedSales(client, products, store.primary_warehouse_id, users);
        await seedNotifications(client, users);

        const counts = {};
        for (const table of ["users", "products", "stock", "movements", "sales", "notifications"]) {
            const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
            counts[table] = result.rows[0].count;
        }

        return { store, usersArray, products, counts };
    });

    console.log("Demo seed completed.");
    console.log(`Login: ${USERS[0].phone} / ${USERS[0].password}`);
    console.log(`Store: ${summary.store.name} (#${summary.store.id})`);
    console.log(`Warehouse ID: ${summary.store.primary_warehouse_id}`);
    console.log(`Demo products added: ${summary.products.length}`);
    console.log("Table counts:", summary.counts);
}

seed()
    .catch((error) => {
        console.error("Demo seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeDb();
    });
