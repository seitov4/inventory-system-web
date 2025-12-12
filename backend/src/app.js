import express from "express";
import cors from "cors";
import morgan from "morgan";
import "dotenv/config";

import { errorHandler } from "./middleware/error.middleware.js";
import productsRouter from "./routes/products.routs.js";
import salesRouter from "./routes/sales.routes.js";
import usersRouter from "./routes/users.routes.js";
import authRouter from "./routes/auth.routes.js";
import movementsRouter from "./routes/movements.routes.js";

const app = express();

// CORS - allow frontend origins
app.use(
    cors({
        origin: [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Body parsing middleware - MUST be before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan("dev"));

// Debug middleware - log all incoming requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        // Don't log passwords
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = "[HIDDEN]";
        if (safeBody.passwordConfirm) safeBody.passwordConfirm = "[HIDDEN]";
        console.log("Request body:", safeBody);
    }
    next();
});

// health-check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/movements", movementsRouter);

// 404 handler for unknown API routes
app.use("/api/*", (req, res) => {
    console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        message: "API endpoint not found",
        path: req.originalUrl,
        method: req.method
    });
});

// Error handler
app.use(errorHandler);

export default app;
