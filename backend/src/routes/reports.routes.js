import { Router } from "express";
import {
    getReportFiltersController,
    getReportTransactionsController,
    getRevenueDailyReportController,
    getSalesReportController,
} from "../controllers/reports.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/sales", authRequired, requireRole("owner"), getSalesReportController);

router.get(
    "/transactions",
    authRequired,
    requireRole("manager", "owner"),
    getReportTransactionsController
);

router.get(
    "/revenue-daily",
    authRequired,
    requireRole("manager", "owner"),
    getRevenueDailyReportController
);

router.get("/filters", authRequired, requireRole("manager", "owner"), getReportFiltersController);

export default router;
