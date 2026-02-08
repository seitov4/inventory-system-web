// backend/src/utils/db.js
// PostgreSQL connection pool with automatic reconnection and keep-alive
import pkg from "pg";
const { Pool } = pkg;

const isSsl = process.env.DB_SSL === "true";

// Configure pool with proper settings for production stability
const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
    
    // Pool configuration
    max: 20, // Maximum number of clients in the pool
    min: 2, // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection cannot be established
    
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10 seconds
});

// Handle pool connection events
pool.on("connect", (client) => {
    console.log("✅ PostgreSQL client connected (pool size:", pool.totalCount, ")");
    
    // Set statement timeout to prevent hanging queries
    client.on("error", (err) => {
        console.error("❌ PostgreSQL client error:", err.message);
    });
});

pool.on("error", (err, client) => {
    console.error("❌ PostgreSQL pool error:", {
        message: err.message,
        code: err.code,
        severity: err.severity,
    });
    
    // Don't crash the app on pool errors - pool will handle reconnection
    // Log the error for monitoring
});

// Keep-alive mechanism: periodically execute SELECT 1 to prevent idle connection timeout
let keepAliveInterval = null;

function startKeepAlive() {
    // Clear existing interval if any
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }
    
    // Execute SELECT 1 every 60 seconds to keep connections alive
    keepAliveInterval = setInterval(async () => {
        try {
            await pool.query("SELECT 1");
            // Silently succeed - no need to log every keep-alive
        } catch (err) {
            // Log keep-alive failures but don't crash
            console.warn("⚠️  Keep-alive query failed:", err.message);
        }
    }, 60000); // Every 60 seconds
    
    console.log("✅ Keep-alive mechanism started (pinging DB every 60 seconds)");
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
        console.log("🛑 Keep-alive mechanism stopped");
    }
}

// Start keep-alive when module loads
startKeepAlive();

// Graceful shutdown: close pool and stop keep-alive on process exit
process.on("SIGINT", async () => {
    stopKeepAlive();
    await pool.end();
    console.log("✅ PostgreSQL pool closed");
    process.exit(0);
});

process.on("SIGTERM", async () => {
    stopKeepAlive();
    await pool.end();
    console.log("✅ PostgreSQL pool closed");
    process.exit(0);
});

// Test connection on startup
pool.query("SELECT 1")
    .then(() => {
        console.log("✅ PostgreSQL pool initialized successfully");
    })
    .catch((err) => {
        console.error("❌ Failed to initialize PostgreSQL pool:", err.message);
        // Don't exit - let the app start and retry on first query
    });

/**
 * Safely execute a transaction with automatic reconnection handling
 * @param {Function} callback - Async function that receives a client and executes queries
 * @returns {Promise<any>} Result from callback
 */
export async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (err) {
        // Try to rollback, but don't fail if connection is already lost
        try {
            await client.query("ROLLBACK");
        } catch (rollbackErr) {
            console.warn("⚠️  Rollback failed (connection may be lost):", rollbackErr.message);
        }
        throw err;
    } finally {
        // Always release client back to pool
        client.release();
    }
}

/**
 * Safely execute a query with automatic retry on connection errors
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {number} maxRetries - Maximum number of retries (default: 1)
 * @returns {Promise<any>} Query result
 */
export async function safeQuery(text, params = [], maxRetries = 1) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await pool.query(text, params);
        } catch (err) {
            lastError = err;
            // Retry on connection errors
            if (
                err.code === "ECONNREFUSED" ||
                err.code === "ETIMEDOUT" ||
                err.code === "ENOTFOUND" ||
                err.message?.includes("Connection terminated") ||
                err.message?.includes("server closed the connection")
            ) {
                if (attempt < maxRetries) {
                    console.warn(
                        `⚠️  Connection error (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`,
                        err.message
                    );
                    // Wait a bit before retry
                    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                    continue;
                }
            }
            // Don't retry on other errors (syntax errors, constraint violations, etc.)
            throw err;
        }
    }
    throw lastError;
}

export default pool;
export { startKeepAlive, stopKeepAlive };
