import { Router } from "express";
import { getSalesReportController } from "../controllers/reports.controller.js";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * GET /api/reports/sales
 * Get sales report data for export
 * Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
 */
router.get(
    "/sales",
    authRequired,
    requireRole("owner", "admin"),
    getSalesReportController
);

export default router;

