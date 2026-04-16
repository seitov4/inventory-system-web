import { authRequired, requireRole } from "./auth.middleware.js";
import { hasAnyUsers } from "../services/users.service.js";

export async function registrationGuard(req, res, next) {
    try {
        const hasUsers = await hasAnyUsers();

        if (!hasUsers) {
            console.log("[AUTH] Bootstrap registration allowed (no users exist)");
            return next();
        }

        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                data: null,
                error: "Требуется авторизация",
            });
        }

        return authRequired(req, res, () => {
            return requireRole("admin")(req, res, next);
        });
    } catch (err) {
        next(err);
    }
}
