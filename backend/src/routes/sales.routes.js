import { Router } from "express";
import {
    createSale,
    getSaleById,
    createSaleReturn,
    getDailySalesController,
    getWeeklySalesController,
    getMonthlySalesController,
    getSalesChartController,
} from "../controllers/sales.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Create sale - cashier and above
router.post(
    "/",
    authRequired,
    requireRole("cashier", "manager", "owner", "admin"),
    createSale
);

// Analytics endpoints - owner and admin only
router.get(
    "/daily",
    authRequired,
    requireRole("owner", "admin"),
    getDailySalesController
);

router.get(
    "/weekly",
    authRequired,
    requireRole("owner", "admin"),
    getWeeklySalesController
);

router.get(
    "/monthly",
    authRequired,
    requireRole("owner", "admin"),
    getMonthlySalesController
);

router.get(
    "/chart",
    authRequired,
    requireRole("owner", "admin"),
    getSalesChartController
);

// Get sale by ID - cashier and above
router.get(
    "/:id",
    authRequired,
    requireRole("cashier", "manager", "owner", "admin"),
    getSaleById
);

// Return sale - cashier and above
router.post(
    "/:id/return",
    authRequired,
    requireRole("cashier", "manager", "owner", "admin"),
    createSaleReturn
);

export default router;
