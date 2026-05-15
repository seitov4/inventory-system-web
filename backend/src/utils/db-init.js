import "./load-env.js";
import pkg from "pg";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_ROOT = resolve(__dirname, "../..");
const PROJECT_ROOT = resolve(BACKEND_ROOT, "..");

const DB_NAME = process.env.DB_NAME;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_SSL =
    process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false;
const DB_INIT_MAX_RETRIES = Number(process.env.DB_INIT_MAX_RETRIES || 10);
const DB_INIT_RETRY_DELAY_MS = Number(process.env.DB_INIT_RETRY_DELAY_MS || 3000);

function validatePostgresEnv() {
    if (!DB_NAME || !DB_USER) {
        console.warn(
            "Skipping Postgres auto-init: DB_NAME and DB_USER must be set"
        );
        return false;
    }
    return true;
}

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

function resolveOptionalPath(pathValue) {
    if (!pathValue) {
        return null;
    }
    return resolve(process.cwd(), pathValue);
}

function readSqlFile(label, candidatePaths) {
    const existingPath = candidatePaths.filter(Boolean).find((candidatePath) =>
        existsSync(candidatePath)
    );

    if (!existingPath) {
        throw new Error(
            `${label} SQL file not found. Looked in: ${candidatePaths
                .filter(Boolean)
                .join(", ")}`
        );
    }

    console.log(`${label} SQL file: ${existingPath}`);
    return readFileSync(existingPath, "utf-8");
}

async function waitForDatabaseServer(
    maxRetries = DB_INIT_MAX_RETRIES,
    delayMs = DB_INIT_RETRY_DELAY_MS
) {
    const adminPool = createAdminPool();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const client = await adminPool.connect();
            client.release();
            await adminPool.end();
            console.log("PostgreSQL server is reachable");
            return;
        } catch (err) {
            console.warn(
                `PostgreSQL is not ready yet (attempt ${attempt}/${maxRetries}):`,
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

async function ensureDatabaseExists() {
    const adminPool = createAdminPool();
    const client = await adminPool.connect();

    try {
        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [DB_NAME]
        );

        if (result.rows.length === 0) {
            const safeDbName = DB_NAME.replace(/"/g, '""');
            await client.query(`CREATE DATABASE "${safeDbName}"`);
            console.log(`PostgreSQL database '${DB_NAME}' created`);
        }
    } finally {
        client.release();
        await adminPool.end();
    }
}

async function ensurePostgresSchema() {
    const appPool = createAppPool();
    const client = await appPool.connect();

    try {
        const initSql = readSqlFile("Schema", [
            resolveOptionalPath(process.env.DB_SCHEMA_SQL_PATH),
            resolve(BACKEND_ROOT, "src/db/init.sql"),
        ]);
        await client.query(initSql);
        console.log("PostgreSQL schema applied successfully");

        const warehouseCount = await client.query(
            "SELECT COUNT(*)::int AS count FROM warehouses"
        );

        if (warehouseCount.rows[0].count === 0) {
            const defaultWarehouseSql = readSqlFile("Default warehouse seed", [
                resolveOptionalPath(process.env.DEFAULT_WAREHOUSE_SQL_PATH),
                resolve(PROJECT_ROOT, "db/create_default_warehouse.sql"),
                resolve(BACKEND_ROOT, "db/create_default_warehouse.sql"),
                resolve(BACKEND_ROOT, "src/db/create_default_warehouse.sql"),
            ]);
            await client.query(defaultWarehouseSql);
            console.log("Default warehouse created");
        } else {
            console.log("Default warehouse already exists");
        }
    } finally {
        client.release();
        await appPool.end();
    }
}

async function initializePostgresDatabase() {
    if (!validatePostgresEnv()) {
        return;
    }

    console.log("Starting PostgreSQL initialization...");
    await waitForDatabaseServer();
    await ensureDatabaseExists();
    await ensurePostgresSchema();
    console.log("PostgreSQL initialization completed");
}

export async function initializeDatabase() {
    await initializePostgresDatabase();
}
