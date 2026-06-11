import pool from "../utils/db.js";
import bcrypt from "bcryptjs";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

export const TENANT_ROLES = ["owner", "manager", "cashier", "staff"];

function isTenantRole(role) {
    return TENANT_ROLES.includes(role);
}

function normalizeSlug(value, fallback = "store") {
    const slug = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
    return slug || fallback;
}

function mapUser(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        store_id: row.store_id,
        email: row.email,
        phone: row.phone,
        first_name: row.first_name,
        last_name: row.last_name,
        name: row.name,
        store_name: row.store_name,
        role: row.role,
        is_active: row.is_active,
        store_status: row.store_status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        password_hash: row.password_hash,
    };
}

async function queryUser(whereSql, params) {
    const result = await pool.query(
        `SELECT u.id,
                u.store_id,
                u.name,
                u.email,
                u.phone,
                u.first_name,
                u.last_name,
                u.store_name,
                u.password_hash,
                u.role,
                u.is_active,
                u.created_at,
                u.updated_at,
                s.status AS store_status
         FROM users u
         JOIN stores s ON s.id = u.store_id
         WHERE ${whereSql}`,
        params
    );
    return mapUser(result.rows[0] || null);
}

async function ensureStoreForUser({ store_id = null, store_name = null }, client = pool) {
    if (store_id) {
        const storeResult = await client.query(
            `SELECT id, name
             FROM stores
             WHERE id = $1`,
            [store_id]
        );
        return storeResult.rows[0] || null;
    }

    const storeName = String(store_name || "Default Store").trim() || "Default Store";
    const slugBase = normalizeSlug(storeName, "default-store");

    const existing = await client.query(
        `SELECT id, name
         FROM stores
         WHERE LOWER(name) = LOWER($1) OR slug = $2
         ORDER BY id
         LIMIT 1`,
        [storeName, slugBase]
    );

    if (existing.rows.length) {
        return existing.rows[0];
    }

    const insertStore = await client.query(
        `INSERT INTO stores (name, slug, status, plan, region, created_at, updated_at)
         VALUES ($1, $2, 'active', 'default', 'local', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (slug) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
         RETURNING id, name`,
        [storeName, slugBase]
    );
    const store = insertStore.rows[0];

    const warehouseResult = await client.query(
        `INSERT INTO warehouses (store_id, name, type, created_at, updated_at)
         VALUES ($1, $2, 'store', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [store.id, `${store.name} Main Warehouse`]
    );

    await client.query(
        `UPDATE stores
         SET primary_warehouse_id = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [warehouseResult.rows[0].id, store.id]
    );

    return store;
}

export async function createUser({
    name = null,
    email = null,
    phone = null,
    first_name = null,
    last_name = null,
    store_id = null,
    store_name = null,
    password,
    role = "cashier",
    is_active = true,
}) {
    if (!isTenantRole(role)) {
        throw createAppError(ERROR_CODES.USERS_ROLE_INVALID, 400);
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const store = await ensureStoreForUser({ store_id, store_name }, client);
        if (!store) {
            throw createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
        }

        const password_hash = await bcrypt.hash(password, 10);
        const displayName =
            name || [first_name, last_name].filter(Boolean).join(" ").trim() || null;
        const result = await client.query(
            `INSERT INTO users
                 (store_id, name, email, phone, first_name, last_name, store_name, password_hash, role, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id, store_id, name, email, phone, first_name, last_name, store_name, role, is_active, created_at, updated_at`,
            [
                store.id,
                displayName,
                email,
                phone,
                first_name,
                last_name,
                store.name,
                password_hash,
                role,
                is_active !== false,
            ]
        );
        await client.query("COMMIT");
        return result.rows[0];
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function findUserByEmail(email) {
    return queryUser(`LOWER(u.email) = LOWER($1)`, [email]);
}

export async function findUserByPhone(phone) {
    return queryUser(`u.phone = $1`, [phone]);
}

export async function findUserById(id, storeId = null) {
    const params = [id];
    let where = `u.id = $1`;
    if (storeId) {
        params.push(storeId);
        where += ` AND u.store_id = $2`;
    }
    return queryUser(where, params);
}

export async function getAllUsers(storeId) {
    const result = await pool.query(
        `SELECT id, store_id, name, email, phone, first_name, last_name, store_name, role, is_active, created_at, updated_at
         FROM users
         WHERE store_id = $1
           AND is_active IS TRUE
           AND role IN ('manager', 'cashier', 'staff')
         ORDER BY created_at DESC`,
        [storeId]
    );
    return result.rows;
}

export async function updateUser(id, { firstName, lastName, contact, role, is_active, password }, storeId) {
    if (role !== undefined && !isTenantRole(role)) {
        throw createAppError(ERROR_CODES.USERS_ROLE_INVALID, 400);
    }

    const isEmail = contact && contact.includes("@");
    const email = contact && isEmail ? contact : undefined;
    const phone = contact && !isEmail ? contact : undefined;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
        updates.push(`first_name = $${paramIndex++}`);
        values.push(firstName);
    }
    if (lastName !== undefined) {
        updates.push(`last_name = $${paramIndex++}`);
        values.push(lastName);
    }
    if (email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
    }
    if (phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(phone);
    }
    if (role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(role);
    }
    if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(is_active !== false);
    }
    if (password) {
        updates.push(`password_hash = $${paramIndex++}`);
        values.push(await bcrypt.hash(password, 10));
    }

    if (updates.length === 0) {
        const user = await findUserById(id, storeId);
        if (!user) {
            return null;
        }
        delete user.password_hash;
        return user;
    }

    values.push(id, storeId);
    const query = `
        UPDATE users
        SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex++} AND store_id = $${paramIndex}
        RETURNING id, store_id, name, email, phone, first_name, last_name, store_name, role, is_active, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
}

export async function deleteUser(id, storeId) {
    const result = await pool.query(
        `UPDATE users
         SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
           AND store_id = $2
           AND role IN ('manager', 'cashier', 'staff')
           AND is_active IS TRUE
         RETURNING id, store_id, role, is_active, updated_at`,
        [id, storeId]
    );
    return result.rows[0] || null;
}

export async function hasAnyUsers() {
    const result = await pool.query(`SELECT COUNT(*) as count FROM users`);
    return parseInt(result.rows[0].count, 10) > 0;
}
