import { Router } from "express";
import {
    movementIn,
    movementOut,
    movementTransfer,
    getMovements,
} from "../controllers/movements.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// GET /movements - List movements with filters
router.get(
    "/",
    authRequired,
    requireRole("manager", "owner", "admin"),
    getMovements
);

// POST /movements/in - Add stock (IN)
router.post(
    "/in",
    authRequired,
    requireRole("manager", "owner", "admin"),
    movementIn
);

// POST /movements/out - Remove stock (OUT)
router.post(
    "/out",
    authRequired,
    requireRole("manager", "owner", "admin"),
    movementOut
);

// POST /movements/transfer - Transfer stock between warehouses
router.post(
    "/transfer",
    authRequired,
    requireRole("manager", "owner", "admin"),
    movementTransfer
);

export default router;
