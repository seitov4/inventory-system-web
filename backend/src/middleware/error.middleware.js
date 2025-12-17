// backend/src/middleware/error.middleware.js
export function errorHandler(err, req, res, next) {
    console.error(err);
    if (res.headersSent) {
        return next(err);
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
