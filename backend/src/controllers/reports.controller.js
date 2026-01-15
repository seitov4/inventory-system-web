import { getSalesReportData } from "../services/reports.service.js";
import { success, error } from "../utils/response.js";

/**
 * GET /api/reports/sales
 * Get sales report data for a date range
 */
export async function getSalesReportController(req, res, next) {
    try {
        const { from, to } = req.query;

        // Validate date parameters
        if (!from || !to) {
            return error(res, "Parameters 'from' and 'to' are required (YYYY-MM-DD format)", 400);
        }

        const fromDate = new Date(from);
        const toDate = new Date(to);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return error(res, "Invalid date format. Use YYYY-MM-DD", 400);
        }

        if (fromDate > toDate) {
            return error(res, "'from' date must be before or equal to 'to' date", 400);
        }

        // Log the request
        console.log(`[Reports] Sales report requested: ${from} to ${to}`);

        const data = await getSalesReportData(fromDate, toDate);

        // Log the result
        console.log(`[Reports] Sales report returned ${data.length} rows`);

        return success(res, data);
    } catch (err) {
        console.error("[Reports] Error generating sales report:", err);
        next(err);
    }
}

