// backend/src/middleware/error.middleware.js
export function errorHandler(err, req, res, next) {
    console.error(err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({
        message: "Внутренняя ошибка сервера",
        error: process.env.NODE_ENV === "development" ? String(err) : undefined
    });
}
