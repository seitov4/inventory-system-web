import { Router } from "express";
import { login, register, me, logout } from "../controllers/auth.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";
import { hasAnyUsers } from "../services/users.service.js";

const router = Router();

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log(`[AUTH ROUTE] ${req.method} /api/auth${req.path}`);
    next();
});

/**
 * Registration guard middleware
 * - Allows bootstrap registration if no users exist
 * - Otherwise requires admin role
 */
async function registrationGuard(req, res, next) {
    try {
        const hasUsers = await hasAnyUsers();

        // Bootstrap: if no users exist, allow registration
        if (!hasUsers) {
            console.log("[AUTH] Bootstrap registration allowed (no users exist)");
            return next();
        }

        // Otherwise, require authentication
        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                data: null,
                error: "Требуется авторизация",
            });
        }

        // Verify and load user (use authRequired logic)
        return authRequired(req, res, () => {
            // Check admin role
            return requireRole("admin")(req, res, next);
        });
    } catch (err) {
        next(err);
    }
}

// Registration - bootstrap allowed, then admin only
router.post("/register", registrationGuard, (req, res, next) => {
    console.log("[AUTH] Registration attempt received");
    register(req, res, next);
});

// Login - public
router.post("/login", (req, res, next) => {
    console.log("[AUTH] Login attempt received");
    login(req, res, next);
});

// Get current user - protected
router.get("/me", authRequired, me);

// Logout - protected
router.post("/logout", authRequired, logout);

export default router;
