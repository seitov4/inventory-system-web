import { Router } from "express";
import { login, register, me, logout } from "../controllers/auth.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log(`[AUTH ROUTE] ${req.method} /api/auth${req.path}`);
    next();
});

// Registration - open during development
router.post("/register", (req, res, next) => {
    console.log("[AUTH] Registration attempt received");
    register(req, res, next);
});

// Login
router.post("/login", (req, res, next) => {
    console.log("[AUTH] Login attempt received");
    login(req, res, next);
});

// Get current user
router.get("/me", authRequired, me);

// Logout
router.post("/logout", authRequired, logout);

export default router;
