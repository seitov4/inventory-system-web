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
        const { from, to } = req.query;

        // Log the request
        console.log(`[Reports] Sales report requested: ${from} to ${to}`);

        const data = await getSalesReportData(req.user.store_id, fromDate, toDate);

        // Log the result
        console.log(`[Reports] Sales report returned ${data.length} rows`);

        return success(res, data);
    } catch (err) {
        console.error("[Reports] Error generating sales report:", err);
        return next(err);
    }
}

