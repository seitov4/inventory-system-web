import { authRequired, requireRole } from "./auth.middleware.js";
import { hasAnyUsers } from "../services/users.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

export async function registrationGuard(req, res, next) {
    try {
        const hasUsers = await hasAnyUsers();

        if (!hasUsers) {
            console.log("[AUTH] Bootstrap registration allowed (no users exist)");
            return next();
        }

        if (!req.headers.authorization) {
            return next(createAppError(ERROR_CODES.AUTH_REQUIRED, 401));
        }

        return authRequired(req, res, () => requireRole("admin")(req, res, next));
    } catch (err) {
        return next(err);
    }
}

