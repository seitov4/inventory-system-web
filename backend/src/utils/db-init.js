// backend/src/utils/db-init.js
// Development-friendly PostgreSQL auto-initialization:
// - waits for PostgreSQL server
// - ensures target database exists
// - applies unified schema (init.sql) with all required columns

import "dotenv/config";
import pkg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_NAME = process.env.DB_NAME;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_SSL =
    process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false;

/**
 * Basic validation of required env vars for DB connection.
 */
function validateDbEnv() {
    if (!DB_NAME || !DB_USER) {
        console.warn(
            "⚠️  Skipping DB auto-init: DB_NAME and DB_USER must be set in environment"
        );
        return false;
    }
    return true;
}

/**
 * Create pool for admin connection (to default 'postgres' DB).
 */
function createAdminPool() {
    return new Pool({
        host: DB_HOST,
        port: DB_PORT,
        database: "postgres",
        user: DB_USER,
        password: DB_PASSWORD,
        ssl: DB_SSL,
    });
}

/**
 * Create pool for target application database.
 */
function createAppPool() {
    return new Pool({
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASSWORD,
        ssl: DB_SSL,
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait until PostgreSQL is accepting connections on the admin database.
 */
async function waitForDatabaseServer(maxRetries = 10, delayMs = 3000) {
    const adminPool = createAdminPool();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const client = await adminPool.connect();
            client.release();
            console.log("✅ PostgreSQL server is reachable");
            await adminPool.end();
            return;
        } catch (err) {
            console.warn(
                `⚠️  PostgreSQL is not ready yet (attempt ${attempt}/${maxRetries}):`,
                err.message
            );
            if (attempt === maxRetries) {
                await adminPool.end();
                throw new Error(
                    "PostgreSQL server is not reachable after multiple attempts"
                );
            }
            await sleep(delayMs);
        }
    }
}

/**
 * Ensure the target database exists, creating it if missing.
 */
async function ensureDatabaseExists() {
    const adminPool = createAdminPool();
    const client = await adminPool.connect();

    try {
        console.log(`🔍 Checking if database '${DB_NAME}' exists...`);

        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [DB_NAME]
        );

        if (result.rows.length > 0) {
            console.log(`✅ Database '${DB_NAME}' already exists`);
        } else {
            console.log(`📦 Creating database '${DB_NAME}'...`);
            const safeDbName = DB_NAME.replace(/"/g, '""');
            await client.query(`CREATE DATABASE "${safeDbName}"`);
            console.log(`✅ Database '${DB_NAME}' created successfully`);
        }
    } catch (err) {
        if (err.code === "42P04") {
            console.log(`✅ Database '${DB_NAME}' already exists (42P04)`);
        } else if (err.code === "3D000") {
            console.error(
                `❌ PostgreSQL is running but database '${DB_NAME}' is missing`
            );
            throw err;
        } else {
            console.error("❌ Error ensuring database exists:", err);
            throw err;
        }
    } finally {
        client.release();
        await adminPool.end();
    }
}

/**
 * Apply unified schema to the target database.
 */
async function ensureSchema() {
    const appPool = createAppPool();
    const client = await appPool.connect();

    try {
        const initSqlPath = join(__dirname, "../db/init.sql");
        console.log(
            `📄 Applying unified schema from '${initSqlPath}' to database '${DB_NAME}'...`
        );

        const initSql = readFileSync(initSqlPath, "utf-8");
        await client.query(initSql);
        console.log("✅ Schema applied successfully");

        // Ensure default warehouse exists (idempotent)
        try {
            const warehouseCount = await client.query(
                "SELECT COUNT(*)::int AS count FROM warehouses"
            );
            if (warehouseCount.rows[0].count === 0) {
                const defaultWarehousePath = join(
                    __dirname,
                    "../../db/create_default_warehouse.sql"
                );
                console.log(
                    `📦 Creating default warehouse using '${defaultWarehousePath}'...`
                );
                const defaultWarehouseSql = readFileSync(
                    defaultWarehousePath,
                    "utf-8"
                );
                await client.query(defaultWarehouseSql);
                console.log("✅ Default warehouse created");
            } else {
                console.log(
                    `✅ Default warehouse already exists (count=${warehouseCount.rows[0].count})`
                );
            }
        } catch (seedErr) {
            console.error("⚠️  Error during default warehouse setup:", seedErr);
        }
    } catch (err) {
        console.error("❌ Error applying schema to database:", err);
        throw err;
    } finally {
        client.release();
        await appPool.end();
    }
}

/**
 * Public entry point used by server startup.
 * Always runs (no NODE_ENV check) to ensure schema is always up-to-date.
 */
export async function initializeDatabase() {
    if (!validateDbEnv()) {
        return;
    }

    console.log("🚀 Starting PostgreSQL initialization...");
    await waitForDatabaseServer();
    await ensureDatabaseExists();
    await ensureSchema();
    console.log("🎉 PostgreSQL initialization completed");
}

