import bcrypt from "bcryptjs";
import pool from "../utils/db.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { PLATFORM_ROLES, sanitizePlatformAdmin } from "./platformAuth.service.js";

function normalizeEmail(email) {
    return String(email || "")
        .trim()
        .toLowerCase();
}

function validateRole(role) {
    if (!PLATFORM_ROLES.includes(role)) {
        throw createAppError(ERROR_CODES.PLATFORM_USER_ROLE_INVALID, 400);
    }
}

function validatePassword(password, required = false) {
    if (required && !password) {
        throw createAppError(ERROR_CODES.PLATFORM_USER_REQUIRED_FIELDS, 400);
    }

    if (password && String(password).length < 8) {
        throw createAppError(ERROR_CODES.PLATFORM_USER_PASSWORD_TOO_SHORT, 400);
    }
}

function assertCanManagePlatformAdmin(actorRole, targetRole) {
    if (actorRole !== "platform_super_admin") {
        throw createAppError(ERROR_CODES.PLATFORM_AUTH_ACCESS_DENIED, 403);
    }

    validateRole(targetRole);
}

async function ensureEmailUnique(email, excludeId = null) {
    const params = [email];
    let query = "SELECT id FROM platform_admins WHERE LOWER(email) = LOWER($1)";

    if (excludeId) {
        params.push(excludeId);
        query += " AND id <> $2";
    }

    const result = await pool.query(query, params);
    if (result.rows.length > 0) {
        throw createAppError(ERROR_CODES.PLATFORM_USER_EMAIL_EXISTS, 409);
    }
}

export async function listPlatformAdmins({ role = null, status = null } = {}) {
    const params = [];
    const where = ["1 = 1"];

    if (role) {
        validateRole(role);
        params.push(role);
        where.push(`role = $${params.length}`);
    }

    if (status === "active" || status === "disabled") {
        params.push(status === "active");
        where.push(`is_active = $${params.length}`);
    }

    const result = await pool.query(
        `SELECT id, email, name, role, is_active, last_login_at, created_at, updated_at
         FROM platform_admins
         WHERE ${where.join(" AND ")}
         ORDER BY created_at DESC`,
        params
    );

    return result.rows.map(sanitizePlatformAdmin);
}

export async function getPlatformAdminById(id) {
    const result = await pool.query(
        `SELECT id, email, name, role, is_active, last_login_at, created_at, updated_at
         FROM platform_admins
         WHERE id = $1`,
        [id]
    );

    return sanitizePlatformAdmin(result.rows[0]);
}

export async function createPlatformAdmin(
    { name, email, password, role = "platform_admin", is_active = true },
    actorRole
) {
    if (!name || !email || !password || !role) {
        throw createAppError(ERROR_CODES.PLATFORM_USER_REQUIRED_FIELDS, 400);
    }

    assertCanManagePlatformAdmin(actorRole, role);

    const normalizedEmail = normalizeEmail(email);
    validatePassword(password, true);
    await ensureEmailUnique(normalizedEmail);

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
        `INSERT INTO platform_admins
             (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, role, is_active, last_login_at, created_at, updated_at`,
        [String(name).trim(), normalizedEmail, passwordHash, role, is_active !== false]
    );

    return sanitizePlatformAdmin(result.rows[0]);
}

export async function updatePlatformAdmin(id, payload = {}, actorRole) {
    const existing = await getPlatformAdminById(id);
    if (!existing) {
        throw createAppError(ERROR_CODES.USERS_NOT_FOUND, 404);
    }

    const targetRole = payload.role || existing.role;
    if (payload.role !== undefined || payload.password || payload.email !== undefined) {
        assertCanManagePlatformAdmin(actorRole, targetRole);
    }

    const updates = [];
    const values = [];

    if (payload.name !== undefined) {
        const name = String(payload.name || "").trim();
        if (!name) {
            throw createAppError(ERROR_CODES.PLATFORM_USER_REQUIRED_FIELDS, 400);
        }
        values.push(name);
        updates.push(`name = $${values.length}`);
    }

    if (payload.email !== undefined) {
        const email = normalizeEmail(payload.email);
        if (!email) {
            throw createAppError(ERROR_CODES.PLATFORM_USER_REQUIRED_FIELDS, 400);
        }
        await ensureEmailUnique(email, id);
        values.push(email);
        updates.push(`email = $${values.length}`);
    }

    if (payload.role !== undefined) {
        validateRole(payload.role);
        values.push(payload.role);
        updates.push(`role = $${values.length}`);
    }

    if (payload.is_active !== undefined) {
        values.push(payload.is_active !== false);
        updates.push(`is_active = $${values.length}`);
    }

    if (payload.password) {
        validatePassword(payload.password);
        values.push(await bcrypt.hash(payload.password, 10));
        updates.push(`password_hash = $${values.length}`);
    }

    if (updates.length === 0) {
        return existing;
    }

    values.push(id);
    const result = await pool.query(
        `UPDATE platform_admins
         SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${values.length}
         RETURNING id, email, name, role, is_active, last_login_at, created_at, updated_at`,
        values
    );

    return sanitizePlatformAdmin(result.rows[0]);
}

export async function disablePlatformAdmin(id, actorRole) {
    if (actorRole !== "platform_super_admin") {
        throw createAppError(ERROR_CODES.PLATFORM_AUTH_ACCESS_DENIED, 403);
    }

    const result = await pool.query(
        `UPDATE platform_admins
         SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, email, name, role, is_active, last_login_at, created_at, updated_at`,
        [id]
    );

    if (!result.rows[0]) {
        throw createAppError(ERROR_CODES.USERS_NOT_FOUND, 404);
    }

    return sanitizePlatformAdmin(result.rows[0]);
}
