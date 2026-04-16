import "dotenv/config";
import pkg from "pg";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { DB_PROVIDER } from "./db.js";

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
const SQLITE_PATH = resolve(
    __dirname,
    "..",
    "..",
    process.env.DB_SQLITE_PATH || "data/inventory.sqlite"
);

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

async function waitForDatabaseServer(maxRetries = 10, delayMs = 3000) {
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
        const initSqlPath = join(__dirname, "../db/init.sql");
        const initSql = readFileSync(initSqlPath, "utf-8");
        await client.query(initSql);
        console.log("PostgreSQL schema applied successfully");

        const warehouseCount = await client.query(
            "SELECT COUNT(*)::int AS count FROM warehouses"
        );

        if (warehouseCount.rows[0].count === 0) {
            const defaultWarehousePath = join(
                __dirname,
                "../../db/create_default_warehouse.sql"
            );
            const defaultWarehouseSql = readFileSync(
                defaultWarehousePath,
                "utf-8"
            );
            await client.query(defaultWarehouseSql);
            console.log("Default warehouse created");
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

async function initializeSqliteDatabase() {
    mkdirSync(dirname(SQLITE_PATH), { recursive: true });

    const db = new DatabaseSync(SQLITE_PATH);
    try {
        db.exec("PRAGMA foreign_keys = ON;");
        db.exec("PRAGMA journal_mode = WAL;");

        const initSqlPath = join(__dirname, "../db/init.sqlite.sql");
        const initSql = readFileSync(initSqlPath, "utf-8");
        db.exec(initSql);

        console.log(`SQLite database initialized at ${SQLITE_PATH}`);
    } finally {
        db.close();
    }
}

export async function initializeDatabase() {
    if (DB_PROVIDER === "sqlite") {
        await initializeSqliteDatabase();
        return;
    }

    if (DB_PROVIDER === "postgres") {
        await initializePostgresDatabase();
        return;
    }

    throw new Error(
        `Unsupported DB provider '${DB_PROVIDER}'. Use 'sqlite' or 'postgres'.`
    );
}
