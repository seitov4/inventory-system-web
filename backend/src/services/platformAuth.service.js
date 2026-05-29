import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../utils/db.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

export const PLATFORM_ROLES = ["platform_super_admin", "platform_admin"];

function getPlatformJwtSecret() {
    return process.env.PLATFORM_JWT_SECRET || process.env.JWT_SECRET;
}

export function isPlatformRole(role) {
    return PLATFORM_ROLES.includes(role);
}

export function sanitizePlatformAdmin(admin) {
    if (!admin) {
        return null;
    }

    return {
        id: admin.id,
        sub: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        scope: "platform",
        is_active: admin.is_active !== false,
        last_login_at: admin.last_login_at,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
    };
}

export async function findPlatformAdminByEmail(email) {
    const result = await pool.query(
        `SELECT id, email, password_hash, name, role, is_active, last_login_at, created_at, updated_at
         FROM platform_admins
         WHERE LOWER(email) = LOWER($1)`,
        [email]
    );
    return result.rows[0] || null;
}

export async function findPlatformAdminById(id) {
    const result = await pool.query(
        `SELECT id, email, password_hash, name, role, is_active, last_login_at, created_at, updated_at
         FROM platform_admins
         WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

export function generatePlatformToken(admin) {
    return jwt.sign(
        {
            sub: admin.id,
            email: admin.email,
            role: admin.role,
            scope: "platform",
        },
        getPlatformJwtSecret(),
        { expiresIn: process.env.PLATFORM_JWT_EXPIRES_IN || "12h" }
    );
}

export async function loginPlatformAdmin(email, password) {
    if (!email || !password) {
        throw createAppError(ERROR_CODES.PLATFORM_AUTH_REQUIRED_FIELDS, 400);
    }

    const admin = await findPlatformAdminByEmail(String(email).trim().toLowerCase());
    if (!admin) {
        throw createAppError(ERROR_CODES.PLATFORM_AUTH_INVALID_CREDENTIALS, 401);
    }

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatches) {
        throw createAppError(ERROR_CODES.PLATFORM_AUTH_INVALID_CREDENTIALS, 401);
    }

    if (admin.is_active === false || !isPlatformRole(admin.role)) {
        throw createAppError(ERROR_CODES.PLATFORM_AUTH_ACCESS_DENIED, 403);
    }

    await pool.query(
        `UPDATE platform_admins
         SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [admin.id]
    );

    return {
        token: generatePlatformToken(admin),
        user: sanitizePlatformAdmin({
            ...admin,
            last_login_at: new Date().toISOString(),
        }),
    };
}

export async function getCurrentPlatformAdmin(adminId) {
    const admin = await findPlatformAdminById(adminId);
    if (!admin) {
        throw createAppError(ERROR_CODES.AUTH_USER_NOT_FOUND, 401);
    }

    if (admin.is_active === false || !isPlatformRole(admin.role)) {
        throw createAppError(ERROR_CODES.PLATFORM_AUTH_ACCESS_DENIED, 403);
    }

    return sanitizePlatformAdmin(admin);
}

export function verifyPlatformJwtToken(token) {
    try {
        const payload = jwt.verify(token, getPlatformJwtSecret());
        if (payload.scope !== "platform") {
            throw createAppError(ERROR_CODES.PLATFORM_AUTH_TOKEN_TYPE_INVALID, 403);
        }
        if (!isPlatformRole(payload.role)) {
            throw createAppError(ERROR_CODES.PLATFORM_AUTH_ACCESS_DENIED, 403);
        }
        return payload;
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            throw createAppError(ERROR_CODES.AUTH_TOKEN_EXPIRED, 401);
        }

        if (err.name === "JsonWebTokenError") {
            if (process.env.PLATFORM_JWT_SECRET && process.env.JWT_SECRET) {
                try {
                    const tenantPayload = jwt.verify(token, process.env.JWT_SECRET);
                    if (tenantPayload.scope === "tenant") {
                        throw createAppError(ERROR_CODES.PLATFORM_AUTH_TOKEN_TYPE_INVALID, 403);
                    }
                } catch (tenantErr) {
                    if (tenantErr.code) {
                        throw tenantErr;
                    }
                }
            }

            throw createAppError(ERROR_CODES.AUTH_TOKEN_INVALID, 401);
        }

        if (err.code) {
            throw err;
        }

        throw createAppError(ERROR_CODES.AUTH_TOKEN_VERIFICATION_FAILED, 401);
    }
}
