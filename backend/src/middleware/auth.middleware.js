import jwt from "jsonwebtoken";
import { findUserById, TENANT_ROLES } from "../services/users.service.js";
import { createAppError, isAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

function extractBearerToken(authorizationHeader) {
    if (!authorizationHeader) {
        throw createAppError(ERROR_CODES.AUTH_REQUIRED, 401);
    }

    const parts = authorizationHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        throw createAppError(ERROR_CODES.AUTH_TOKEN_FORMAT_INVALID, 401);
    }

    const token = parts[1];
    if (!token) {
        throw createAppError(ERROR_CODES.AUTH_TOKEN_MISSING, 401);
    }

    return token;
}

function verifyJwtToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            throw createAppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, 401);
        }

        if (err.name === "JsonWebTokenError") {
            throw createAppError(ERROR_CODES.AUTH_TOKEN_INVALID, 401);
        }

        throw createAppError(ERROR_CODES.AUTH_TOKEN_VERIFICATION_FAILED, 401);
    }
}

/**
 * Authentication middleware
 * Verifies JWT token and loads full user from database
 * Attaches user object to req.user
 */
export async function authRequired(req, res, next) {
    try {
        const header = req.headers.authorization;
        const token = extractBearerToken(header);
        const payload = verifyJwtToken(token);

        if (payload.scope !== "tenant") {
            throw createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
        }

        const user = await findUserById(payload.sub || payload.id);

        if (!user) {
            throw createAppError(ERROR_CODES.AUTH_USER_NOT_FOUND, 401);
        }

        if (
            user.is_active === false ||
            !TENANT_ROLES.includes(user.role) ||
            !user.store_id ||
            user.store_status !== "active"
        ) {
            throw createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
        }

        // Attach user to request (without password_hash)
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password_hash;
        req.user = {
            id: userWithoutPassword.id,
            email: userWithoutPassword.email,
            phone: userWithoutPassword.phone,
            first_name: userWithoutPassword.first_name,
            last_name: userWithoutPassword.last_name,
            name: userWithoutPassword.name,
            store_id: userWithoutPassword.store_id,
            store_name: userWithoutPassword.store_name,
            role: userWithoutPassword.role,
            scope: "tenant",
            is_active: userWithoutPassword.is_active !== false,
            created_at: userWithoutPassword.created_at,
        };

        return next();
    } catch (err) {
        console.error("[authRequired] Error:", err);
        if (isAppError(err)) {
            return next(err);
        }

        return next(createAppError(ERROR_CODES.AUTHORIZATION_FAILED, 500));
    }
}

export const tenantAuthRequired = authRequired;

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 *
 * Usage:
 *   requireRole("manager", "owner")
 *   requireRole("cashier", "manager", "owner")
 */
export function requireRole(...roles) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw createAppError(ERROR_CODES.AUTH_REQUIRED, 401);
            }

            if (!roles.includes(req.user.role)) {
                throw createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
            }

            return next();
        } catch (err) {
            return next(err);
        }
    };
}

export const requireTenantRole = requireRole;
