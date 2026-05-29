import "./load-env.js";
import pkg from "pg";

const { Pool } = pkg;

export const DB_PROVIDER = "postgres";
const POSTGRES_SSL = process.env.DB_SSL === "true";

function createPostgresPool() {
    if (process.env.DATABASE_URL) {
        return new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: POSTGRES_SSL ? { rejectUnauthorized: false } : false,
            max: 20,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
        });
    }

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
        throw new Error("Database pool is not initialized. Call initDb() before using the DB API.");
    }
}

export async function initDb() {
    if (internalPool) {
        return;
    }

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

    // Run an initial lightweight readiness check
    try {
        await internalPool.query("SELECT 1");
        console.log("PostgreSQL pool initialized successfully");
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
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }

    keepAliveInterval = setInterval(async () => {
        try {
            if (!internalPool) {
                return;
            }
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
                    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                    continue;
                }
            }

            throw err;
        }
    }

    throw lastError;
}

export function getDatabaseInfo() {
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        return {
            provider: "postgres",
            target: `${url.hostname}:${url.port || 5432}${url.pathname}`,
        };
    }

    return {
        provider: "postgres",
        target: `${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || ""}`,
    };
}

export default pool;
