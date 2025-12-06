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

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
    })
);

app.use(express.json());
app.use(morgan("dev"));

// health-check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/products", productsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/movements", movementsRouter);

// обработчик ошибок
app.use(errorHandler);

export default app;
