import {
    findPlatformAdminById,
    isPlatformRole,
    PLATFORM_ROLES,
    sanitizePlatformAdmin,
    verifyPlatformJwtToken,
} from "../services/platformAuth.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

function extractBearerToken(authorizationHeader) {
    if (!authorizationHeader) {
        throw createAppError(ERROR_CODES.AUTH_REQUIRED, 401);
    }

    const parts = authorizationHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
        throw createAppError(ERROR_CODES.AUTH_TOKEN_FORMAT_INVALID, 401);
    }

    return parts[1];
}

export async function platformAuthRequired(req, res, next) {
    try {
        const token = extractBearerToken(req.headers.authorization);
        const payload = verifyPlatformJwtToken(token);
        const adminId = payload.sub;

        if (!adminId) {
            throw createAppError(ERROR_CODES.AUTH_TOKEN_INVALID, 401);
        }

        const admin = await findPlatformAdminById(adminId);
        if (!admin) {
            throw createAppError(ERROR_CODES.AUTH_USER_NOT_FOUND, 401);
        }

        if (admin.is_active === false || !isPlatformRole(admin.role)) {
            throw createAppError(ERROR_CODES.PLATFORM_AUTH_ACCESS_DENIED, 403);
        }

        const platformAdmin = sanitizePlatformAdmin(admin);
        req.platformAdmin = platformAdmin;
        return next();
    } catch (err) {
        return next(err);
    }
}

export function requirePlatformRole(roles = PLATFORM_ROLES) {
    return (req, res, next) => {
        try {
            const allowedRoles = Array.isArray(roles) ? roles : [roles];
            if (!req.platformAdmin) {
                throw createAppError(ERROR_CODES.AUTH_REQUIRED, 401);
            }

            if (!allowedRoles.includes(req.platformAdmin.role)) {
                throw createAppError(ERROR_CODES.PLATFORM_AUTH_ACCESS_DENIED, 403);
            }

            return next();
        } catch (err) {
            return next(err);
        }
    };
}
