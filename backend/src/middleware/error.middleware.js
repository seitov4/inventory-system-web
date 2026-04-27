import { createAppError, normalizeToAppError, resolveErrorMessage } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

function mapDatabaseError(err) {
    if (!err || !err.code) {
        return null;
    }

    if (err.code === "42703") {
        return createAppError(ERROR_CODES.DB_SCHEMA_COLUMN_MISSING, {
            status: 500,
            expose: false,
            params: {
                column: err.column,
                table: err.table,
            },
        });
    }

    if (err.code === "42P01") {
        return createAppError(ERROR_CODES.DB_SCHEMA_TABLE_MISSING, {
            status: 500,
            expose: false,
            params: {
                table: err.table,
            },
        });
    }

    if (err.code === "3D000") {
        return createAppError(ERROR_CODES.DB_DATABASE_NOT_FOUND, {
            status: 500,
            expose: false,
        });
    }

    if (err.code === "23505") {
        return createAppError(ERROR_CODES.DB_UNIQUE_CONSTRAINT_VIOLATION, {
            status: 409,
        });
    }

    return null;
}

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const appError = mapDatabaseError(err) || normalizeToAppError(err);
    const status = appError.status || 500;
    const safeCode = appError.expose ? appError.code : ERROR_CODES.INTERNAL_SERVER_ERROR;
    const safeMessage = resolveErrorMessage(safeCode, appError.params);

    const sourceError = appError.cause || err;
    console.error("[Error Handler]", {
        code: appError.code,
        status,
        message: sourceError?.message,
        detail: sourceError?.detail,
        hint: sourceError?.hint,
        table: sourceError?.table,
        column: sourceError?.column,
        stack: sourceError?.stack,
    });

    return res.status(status).json({
        success: false,
        data: null,
        error: safeMessage,
    });
}
