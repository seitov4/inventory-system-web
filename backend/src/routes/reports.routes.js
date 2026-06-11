import { Router } from "express";
import {
    getReportFiltersController,
    getReportTransactionsController,
    getRevenueDailyReportController,
    getSalesForecastCsvController,
    getSalesReportController,
} from "../controllers/reports.controller.js";
import { authRequired, requireRole, tenantAuthRequired } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/sales", authRequired, requireRole("owner"), getSalesReportController);

router.get(
    "/sales-forecast-csv",
    tenantAuthRequired,
    requireRole("owner", "manager", "admin"),
    getSalesForecastCsvController
);

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
