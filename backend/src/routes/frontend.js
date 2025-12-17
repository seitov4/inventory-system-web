import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup frontend static file serving and SPA fallback
 * 
 * This function:
 * - Resolves frontend/build path relative to project root
 * - Checks if build exists (non-blocking if missing)
 * - Serves static files if build exists
 * - Provides SPA fallback for React Router
 * 
 * IMPORTANT: This must be called AFTER all API routes are registered
 * to ensure /api/* routes are not intercepted by the catch-all route.
 * 
 * @param {express.Application} app - Express app instance
 */
export function setupFrontend(app) {
    // Resolve paths: backend/src/routes/ -> backend/src/ -> backend/ -> project root -> frontend/build
    const projectRoot = path.resolve(__dirname, "..", "..", "..");
    const frontendBuildPath = path.join(projectRoot, "frontend", "build");
    const indexFile = path.join(frontendBuildPath, "index.html");

    // Check if build directory exists
    if (!fs.existsSync(frontendBuildPath)) {
        console.warn(`⚠️  Frontend build folder not found: ${frontendBuildPath}`);
        console.warn("⚠️  Backend will continue running without serving frontend");
        console.warn("⚠️  To serve frontend, build it with: cd frontend && npm run build");
        return;
    }

    // Check if index.html exists
    if (!fs.existsSync(indexFile)) {
        console.warn(`⚠️  index.html not found in frontend build: ${indexFile}`);
        console.warn("⚠️  Frontend will NOT be served");
        return;
    }

    console.log("✅ Frontend build found. Serving frontend static files...");
    console.log(`   Build path: ${frontendBuildPath}`);

    // Serve static files from frontend/build
    app.use(express.static(frontendBuildPath));

    // SPA fallback: serve index.html for all non-API routes
    // This allows React Router to handle client-side routing
    // IMPORTANT: This must be after API routes to avoid intercepting /api/*
    app.get("*", (req, res, next) => {
        // Skip API routes explicitly (defensive check)
        // API routes should already be handled, but this ensures safety
        if (req.path.startsWith("/api")) {
            return next();
        }
        // Serve index.html for all other GET routes (SPA fallback)
        res.sendFile(indexFile, (err) => {
            if (err) {
                console.error(`Error sending index.html: ${err.message}`);
                next(err);
            }
        });
    });

    console.log("✅ Frontend SPA routing enabled");
}
