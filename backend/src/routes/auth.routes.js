import { Router } from "express";
import { login, register, me, logout } from "../controllers/auth.controller.js";
import { authRequired } from "../middleware/auth.middleware.js";
import { registrationGuard } from "../middleware/registration.middleware.js";

const router = Router();

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log(`[AUTH ROUTE] ${req.method} /api/auth${req.path}`);
    next();
});

router.post("/register", registrationGuard, register);
router.post("/login", login);
router.get("/me", authRequired, me);
router.post("/logout", authRequired, logout);

export default router;
