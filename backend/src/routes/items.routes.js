import { Router } from "express";
import { createItem } from "../controllers/items.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/items - Create a new item
router.post(
    "/",
    authRequired,
    requireRole("manager", "owner", "admin"),
    createItem
);

export default router;

