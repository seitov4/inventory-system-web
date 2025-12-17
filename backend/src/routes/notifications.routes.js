import { Router } from "express";
import { getNotifications, markAsRead } from "../controllers/notifications.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// GET /api/notifications - Get user's notifications
router.get(
    "/",
    authRequired,
    requireRole("owner", "manager"),
    getNotifications
);

// PUT /api/notifications/:id/read - Mark notification as read
router.put(
    "/:id/read",
    authRequired,
    requireRole("owner", "manager"),
    markAsRead
);

export default router;

