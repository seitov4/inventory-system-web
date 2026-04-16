import "dotenv/config";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { DatabaseSync } from "node:sqlite";
import pkg from "pg";

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const DB_PROVIDER = (
    process.env.DB_CLIENT ||
    process.env.DB_PROVIDER ||
    "sqlite"
).toLowerCase();

const SQLITE_RELATIVE_PATH =
    process.env.DB_SQLITE_PATH || "data/inventory.sqlite";
export const SQLITE_DB_PATH = resolve(__dirname, "..", "..", SQLITE_RELATIVE_PATH);
const POSTGRES_SSL = process.env.DB_SSL === "true";

function normalizeSqliteParam(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (typeof value === "boolean") {
        return value ? 1 : 0;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
        return JSON.stringify(value);
    }

    return value;
}

function transformSqliteQuery(text) {
    return text
        .replace(/\bFOR\s+UPDATE\b/gi, "")
        .replace(/\bNOW\(\)/gi, "CURRENT_TIMESTAMP")
        .replace(
            /\bCURRENT_TIMESTAMP\b/gi,
            "STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')"
        )
        .replace(/::\s*[a-zA-Z_][a-zA-Z0-9_\[\]]*/g, "")
        .replace(/\$\d+/g, "?");
}

function isRowReturningQuery(sql) {
    return (
        /^\s*(select|pragma|with)\b/i.test(sql) ||
        /\breturning\b/i.test(sql)
    );
}

function executeSqliteQuery(db, text, params = []) {
    const sql = transformSqliteQuery(text);
    const normalizedParams = params.map(normalizeSqliteParam);
    const statement = db.prepare(sql);

    if (isRowReturningQuery(sql)) {
        const rows = statement.all(...normalizedParams);
        return {
            rows,
            rowCount: rows.length,
        };
    }

    const result = statement.run(...normalizedParams);
    return {
        rows: [],
        rowCount: Number(result.changes || 0),
        lastInsertRowid: Number(result.lastInsertRowid || 0),
    };
}

class SQLiteClient {
    constructor(db) {
        this.db = db;
    }

    async query(text, params = []) {
        return executeSqliteQuery(this.db, text, params);
    }

    release() {}
}

class SQLitePool {
    constructor(filePath) {
        this.filePath = filePath;
        mkdirSync(dirname(filePath), { recursive: true });
        this.db = new DatabaseSync(filePath);
        this.db.exec("PRAGMA foreign_keys = ON;");
        this.db.exec("PRAGMA journal_mode = WAL;");
        this.db.exec("PRAGMA synchronous = NORMAL;");
    }

    on() {
        return this;
    }

    async query(text, params = []) {
        return executeSqliteQuery(this.db, text, params);
    }

    async connect() {
        return new SQLiteClient(this.db);
    }

    async end() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

function createPostgresPool() {
    return new Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: POSTGRES_SSL ? { rejectUnauthorized: false } : false,
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
    });
}

// Internal runtime state
let internalPool = null;
let keepAliveInterval = null;

function ensurePoolInitialized() {
    if (!internalPool) {
        throw new Error(
            "Database pool is not initialized. Call initDb() before using the DB API."
        );
    }
}

export async function initDb() {
    if (internalPool) return;

    if (DB_PROVIDER === "sqlite") {
        internalPool = new SQLitePool(SQLITE_DB_PATH);
    } else {
        internalPool = createPostgresPool();

        internalPool.on("connect", (client) => {
            console.log("PostgreSQL client connected");
            client.on("error", (err) => {
                console.error("PostgreSQL client error:", err.message);
            });
        });

        internalPool.on("error", (err) => {
            console.error("PostgreSQL pool error:", {
                message: err.message,
                code: err.code,
                severity: err.severity,
            });
        });
    }

    // Run an initial lightweight readiness check
    try {
        await internalPool.query("SELECT 1");
        if (DB_PROVIDER === "sqlite") {
            console.log(`SQLite connection ready: ${SQLITE_DB_PATH}`);
        } else {
            console.log("PostgreSQL pool initialized successfully");
        }
    } catch (err) {
        console.error("Failed to initialize database connection:", err.message);
        throw err;
    }

    // Start keep-alive only after explicit init
    startKeepAlive();
}

export async function closeDb() {
    stopKeepAlive();
    if (internalPool) {
        try {
            await internalPool.end();
        } catch (err) {
            console.warn("Error while closing DB pool:", err.message);
        }
        internalPool = null;
    }
}

export function startKeepAlive() {
    if (DB_PROVIDER !== "postgres") {
        return;
    }

    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }

    keepAliveInterval = setInterval(async () => {
        try {
            if (!internalPool) return;
            await internalPool.query("SELECT 1");
        } catch (err) {
            console.warn("Keep-alive query failed:", err.message);
        }
    }, 60000);

    console.log("PostgreSQL keep-alive started");
}

export function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
}

// Default export is a lightweight proxy compatible with previous usage (pool.query(...))
const pool = {
    async query(text, params = []) {
        ensurePoolInitialized();
        return internalPool.query(text, params);
    },
    async connect() {
        ensurePoolInitialized();
        return internalPool.connect();
    },
    async end() {
        ensurePoolInitialized();
        return internalPool.end();
    },
    on(...args) {
        ensurePoolInitialized();
        return internalPool.on(...args);
    },
};

export async function withTransaction(callback) {
    ensurePoolInitialized();
    const client = await internalPool.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (err) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackErr) {
            console.warn("Rollback failed:", rollbackErr.message);
        }
        throw err;
    } finally {
        client.release();
    }
}

export async function safeQuery(text, params = [], maxRetries = 1) {
    // For sqlite, the pool's query is local and synchronous-like
    if (DB_PROVIDER === "sqlite") {
        ensurePoolInitialized();
        return internalPool.query(text, params);
    }

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            ensurePoolInitialized();
            return await internalPool.query(text, params);
        } catch (err) {
            lastError = err;

            if (
                err.code === "ECONNREFUSED" ||
                err.code === "ETIMEDOUT" ||
                err.code === "ENOTFOUND" ||
                err.message?.includes("Connection terminated") ||
                err.message?.includes("server closed the connection")
            ) {
                if (attempt < maxRetries) {
                    console.warn(
                        `Connection error (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`,
                        err.message
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, 1000 * (attempt + 1))
                    );
                    continue;
                }
            }

            throw err;
        }
    }

    throw lastError;
}

export function getDatabaseInfo() {
    if (DB_PROVIDER === "sqlite") {
        return {
            provider: "sqlite",
            target: SQLITE_DB_PATH,
        };
    }

    return {
        provider: "postgres",
        target: `${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || ""}`,
    };
}

export default pool;
