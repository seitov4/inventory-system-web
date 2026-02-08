// backend/src/middleware/error.middleware.js
export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    // Handle PostgreSQL errors specifically
    if (err.code) {
        // PostgreSQL error codes
        if (err.code === "42703") {
            // Undefined column
            console.error("❌ PostgreSQL column error:", {
                message: err.message,
                code: err.code,
                column: err.column,
                table: err.table,
                hint: err.hint,
            });
            return res.status(500).json({
                success: false,
                data: null,
                error: `Database schema error: column '${err.column || "unknown"}' does not exist in table '${err.table || "unknown"}'. Please restart the backend to apply schema migrations.`,
            });
        }

        if (err.code === "42P01") {
            // Undefined table
            console.error("❌ PostgreSQL table error:", {
                message: err.message,
                code: err.code,
                table: err.table,
            });
            return res.status(500).json({
                success: false,
                data: null,
                error: `Database schema error: table '${err.table || "unknown"}' does not exist. Please restart the backend to apply schema migrations.`,
            });
        }

        if (err.code === "3D000") {
            // Database does not exist
            console.error("❌ PostgreSQL database error:", {
                message: err.message,
                code: err.code,
            });
            return res.status(500).json({
                success: false,
                data: null,
                error: "Database connection error: database does not exist. Please restart the backend to create the database.",
            });
        }

        // Other PostgreSQL errors
        console.error("❌ PostgreSQL error:", {
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint,
            table: err.table,
            column: err.column,
        });
    } else {
        // Non-PostgreSQL errors
        console.error("❌ Error:", err);
    }

    // Use unified error format
    const status = err.status || err.statusCode || 500;
    const message =
        err.message || "Внутренняя ошибка сервера";

    res.status(status).json({
        success: false,
        data: null,
        error: message,
    });
}
