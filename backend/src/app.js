import express from "express";
import cors from "cors";
import morgan from "morgan";
import "./utils/load-env.js";

import { errorHandler } from "./middleware/error.middleware.js";
import { success } from "./utils/response.js";
import { createAppError } from "./errors/app-error.js";
import { ERROR_CODES } from "./errors/error-codes.js";
import productsRouter from "./routes/products.routs.js";
import salesRouter from "./routes/sales.routes.js";
import usersRouter from "./routes/users.routes.js";
import authRouter from "./routes/auth.routes.js";
import movementsRouter from "./routes/movements.routes.js";
import notificationsRouter from "./routes/notifications.routes.js";
import reportsRouter from "./routes/reports.routes.js";
import warehousesRouter from "./routes/warehouses.routes.js";
import { setupFrontend } from "./routes/frontend.js";
import platformRouter from "./routes/platform.routes.js";
import aiRouter from "./routes/ai.routes.js";

const app = express();

function parseAllowedOrigins() {
    const configuredOrigins = (process.env.CORS_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    return Array.from(
        new Set([
            process.env.FRONTEND_URL || "http://localhost:5000",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            ...configuredOrigins,
        ])
    );
}

function originMatchesPattern(origin, pattern) {
    if (!origin || !pattern) {
        return false;
    }

    if (pattern.includes("*")) {
        const escapedPattern = pattern
            .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
            .replace(/\*/g, ".*");
        const regex = new RegExp(`^${escapedPattern}$`);
        return regex.test(origin);
    }

    return origin === pattern;
}

const allowedOrigins = parseAllowedOrigins();
const isProduction = process.env.NODE_ENV === "production";

// CORS - allow frontend origins
app.use(
    cors({
        origin(origin, callback) {
            if (
                !origin ||
                allowedOrigins.some((allowedOrigin) =>
                    originMatchesPattern(origin, allowedOrigin)
                )
            ) {
                return callback(null, true);
            }

            return callback(new Error(`Origin '${origin}' is not allowed by CORS`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Body parsing middleware - MUST be before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
if (!isProduction) {
    app.use(morgan("dev"));
}

if (!isProduction) {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// health-check
app.get("/api/health", (req, res) => {
    return success(res, { status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/movements", movementsRouter);
app.use("/api/warehouses", warehousesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/platform", platformRouter);
app.use("/api/ai", aiRouter);

// 404 handler for unknown API routes
app.use("/api/*", (req, res, next) => {
    if (!isProduction) {
        console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
    }
    return next(createAppError(ERROR_CODES.API_ENDPOINT_NOT_FOUND, 404));
});

// Frontend serving (must be after all API routes to avoid intercepting /api/*)
setupFrontend(app);

// Error handler
app.use(errorHandler);

export default app;
