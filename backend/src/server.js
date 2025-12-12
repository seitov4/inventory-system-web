// backend/src/server.js
import app from "./app.js";
import "dotenv/config";
import net from "net";

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
const MAX_PORT_ATTEMPTS = 10;

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.once("error", (err) => {
            if (err.code === "EADDRINUSE") {
                resolve(false);
            } else {
                resolve(false);
            }
        });
        
        server.once("listening", () => {
            server.close();
            resolve(true);
        });
        
        server.listen(port);
    });
}

/**
 * Find an available port starting from the default
 */
async function findAvailablePort(startPort, maxAttempts) {
    for (let i = 0; i < maxAttempts; i++) {
        const port = startPort + i;
        const available = await isPortAvailable(port);
        if (available) {
            return port;
        }
        console.log(`Port ${port} is in use, trying ${port + 1}...`);
    }
    throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
}

/**
 * Start the server
 */
async function startServer() {
    try {
        const PORT = await findAvailablePort(DEFAULT_PORT, MAX_PORT_ATTEMPTS);
        
        app.listen(PORT, () => {
            console.log(`===================================`);
            console.log(`Backend running on http://localhost:${PORT}`);
            console.log(`API Health Check: http://localhost:${PORT}/api/health`);
            console.log(`Auth Register: POST http://localhost:${PORT}/api/auth/register`);
            console.log(`Auth Login: POST http://localhost:${PORT}/api/auth/login`);
            if (PORT !== DEFAULT_PORT) {
                console.log(`\n⚠️  Note: Using port ${PORT} instead of ${DEFAULT_PORT} (was in use)`);
                console.log(`   Update REACT_APP_API_URL in frontend if needed`);
            }
            console.log(`===================================`);
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
}

startServer();
