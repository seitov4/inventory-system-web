import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

export const REPORTS_OPERATION_TYPES = Object.freeze(["SALE", "RETURN", "WRITE_OFF"]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toIsoDateString(date) {
    return date.toISOString().slice(0, 10);
}

function getUtcToday() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getUtcMonthStart(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function parseIsoDate(value) {
    if (!ISO_DATE_PATTERN.test(value)) {
        throw createAppError(ERROR_CODES.REPORTS_DATE_FORMAT_INVALID, 400);
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || toIsoDateString(date) !== value) {
        throw createAppError(ERROR_CODES.REPORTS_DATE_FORMAT_INVALID, 400);
    }

    return date;
}

function toEndOfUtcDay(date) {
    const value = new Date(date);
    value.setUTCHours(23, 59, 59, 999);
    return value;
}

function parsePositiveInteger(value, errorCode) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw createAppError(errorCode, 400);
    }
    return parsed;
}

function parseNonNegativeInteger(value, errorCode) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw createAppError(errorCode, 400);
    }
    return parsed;
}

function normalizeOptionalString(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized === "" ? null : normalized;
}

function normalizeOperationType(value) {
    const normalized = normalizeOptionalString(value);
    return normalized ? normalized.toUpperCase() : null;
}

export function parseSalesReportDateRange(query = {}) {
    const from = normalizeOptionalString(query.from);
    const to = normalizeOptionalString(query.to);

    if (!from || !to) {
        throw createAppError(ERROR_CODES.REPORTS_DATE_RANGE_REQUIRED, 400);
    }

    const fromDate = parseIsoDate(from);
    const toDate = parseIsoDate(to);

    if (fromDate > toDate) {
        throw createAppError(ERROR_CODES.REPORTS_DATE_RANGE_INVALID, 400);
    }

    return { fromDate, toDate };
}

export function parseReportsQuery(query = {}) {
    const today = getUtcToday();
    const monthStart = getUtcMonthStart(today);

    let from = normalizeOptionalString(query.from);
    let to = normalizeOptionalString(query.to);

    if (!from && !to) {
        from = toIsoDateString(monthStart);
        to = toIsoDateString(today);
    } else if (from && !to) {
        to = toIsoDateString(today);
    } else if (!from && to) {
        from = toIsoDateString(monthStart);
    }

    const fromDate = parseIsoDate(from);
    const toDate = parseIsoDate(to);

    if (fromDate > toDate) {
        throw createAppError(ERROR_CODES.REPORTS_DATE_RANGE_INVALID, 400);
    }

    const limitRaw = normalizeOptionalString(query.limit);
    const offsetRaw = normalizeOptionalString(query.offset);
    const productIdRaw = normalizeOptionalString(query.product_id);
    const employeeIdRaw = normalizeOptionalString(query.employee_id);
    const operationType = normalizeOperationType(query.operation_type);

    if (operationType && !REPORTS_OPERATION_TYPES.includes(operationType)) {
        throw createAppError(ERROR_CODES.REPORTS_OPERATION_TYPE_INVALID, 400);
    }

    return {
        from,
        to,
        fromDate,
        toDate,
        fromDateTime: fromDate,
        toDateTime: toEndOfUtcDay(toDate),
        product_id: productIdRaw
            ? parsePositiveInteger(productIdRaw, ERROR_CODES.REPORTS_PRODUCT_ID_INVALID)
            : null,
        category: normalizeOptionalString(query.category),
        employee_id: employeeIdRaw
            ? parsePositiveInteger(employeeIdRaw, ERROR_CODES.REPORTS_EMPLOYEE_ID_INVALID)
            : null,
        operation_type: operationType,
        limit: limitRaw ? parsePositiveInteger(limitRaw, ERROR_CODES.REPORTS_LIMIT_INVALID) : 100,
        offset: offsetRaw
            ? parseNonNegativeInteger(offsetRaw, ERROR_CODES.REPORTS_OFFSET_INVALID)
            : 0,
    };
}
