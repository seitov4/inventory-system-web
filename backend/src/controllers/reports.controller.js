import {
    getReportFilters,
    getReportTransactions,
    getRevenueDailyReport,
    getSalesReportData,
} from "../services/reports.service.js";
import { success } from "../utils/response.js";
import { parseReportsQuery, parseSalesReportDateRange } from "../validation/reports.validation.js";

/**
 * GET /api/reports/sales
 * Existing sales export endpoint for the web app.
 */
export async function getSalesReportController(req, res, next) {
    try {
        const { fromDate, toDate } = parseSalesReportDateRange(req.query);
        const data = await getSalesReportData(req.user.store_id, fromDate, toDate);
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}

export async function getReportTransactionsController(req, res, next) {
    try {
        const filters = parseReportsQuery(req.query);
        const data = await getReportTransactions(req.user.store_id, filters);
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}

export async function getRevenueDailyReportController(req, res, next) {
    try {
        const filters = parseReportsQuery(req.query);
        const data = await getRevenueDailyReport(req.user.store_id, filters);
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}

export async function getReportFiltersController(req, res, next) {
    try {
        const data = await getReportFilters(req.user.store_id);
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}
