import { getSalesReportData } from "../services/reports.service.js";
import { success } from "../utils/response.js";
import { parseSalesReportDateRange } from "../validation/reports.validation.js";

/**
 * GET /api/reports/sales
 * Get sales report data for a date range
 */
export async function getSalesReportController(req, res, next) {
    try {
        const { fromDate, toDate } = parseSalesReportDateRange(req.query);

        const data = await getSalesReportData(req.user.store_id, fromDate, toDate);

        return success(res, data);
    } catch (err) {
        console.error("[Reports] Error generating sales report:", err);
        return next(err);
    }
}

