import { Router } from "express";
import {
    movementIn,
    movementOut,
    getMovements,
} from "../controllers/movements.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
    "/",
    authRequired,
    requireRole("manager", "owner", "admin"),
    getMovements
);

router.post(
    "/in",
    authRequired,
    requireRole("manager", "owner", "admin"),
    movementIn
);

router.post(
    "/out",
    authRequired,
    requireRole("manager", "owner", "admin"),
    movementOut
);

export default router;
