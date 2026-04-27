import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

export function parseSalesReportDateRange(query = {}) {
    const from = query.from;
    const to = query.to;

    if (!from || !to) {
        throw createAppError(ERROR_CODES.REPORTS_DATE_RANGE_REQUIRED, 400);
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
        throw createAppError(ERROR_CODES.REPORTS_DATE_FORMAT_INVALID, 400);
    }

    if (fromDate > toDate) {
        throw createAppError(ERROR_CODES.REPORTS_DATE_RANGE_INVALID, 400);
    }

    return { fromDate, toDate };
}
