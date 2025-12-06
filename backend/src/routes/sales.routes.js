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

router.post(
    "/",
    authRequired,
    requireRole("cashier", "manager", "owner", "admin"),
    createSale
);

router.get(
    "/:id",
    authRequired,
    requireRole("cashier", "manager", "owner", "admin"),
    getSaleById
);

router.post(
    "/:id/return",
    authRequired,
    requireRole("cashier", "manager", "owner", "admin"),
    createSaleReturn
);

router.get(
    "/daily",
    authRequired,
    requireRole("manager", "owner", "admin"),
    getDailySalesController
);

router.get(
    "/weekly",
    authRequired,
    requireRole("manager", "owner", "admin"),
    getWeeklySalesController
);

router.get(
    "/monthly",
    authRequired,
    requireRole("manager", "owner", "admin"),
    getMonthlySalesController
);

router.get(
    "/chart",
    authRequired,
    requireRole("manager", "owner", "admin"),
    getSalesChartController
);

export default router;
