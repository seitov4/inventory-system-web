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
    requireRole("cashier", "staff", "manager", "owner"),
    createSale
);

// Analytics endpoints - tenant owner only
router.get(
    "/daily",
    authRequired,
    requireRole("owner"),
    getDailySalesController
);

router.get(
    "/weekly",
    authRequired,
    requireRole("owner"),
    getWeeklySalesController
);

router.get(
    "/monthly",
    authRequired,
    requireRole("owner"),
    getMonthlySalesController
);

router.get(
    "/chart",
    authRequired,
    requireRole("owner"),
    getSalesChartController
);

// Get sale by ID - cashier and above
router.get(
    "/:id",
    authRequired,
    requireRole("cashier", "staff", "manager", "owner"),
    getSaleById
);

// Return sale - cashier and above
router.post(
    "/:id/return",
    authRequired,
    requireRole("cashier", "staff", "manager", "owner"),
    createSaleReturn
);

export default router;
