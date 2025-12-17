import pool from "../utils/db.js";
import bcrypt from "bcryptjs";

export async function createUser({
    email = null,
    phone = null,
    first_name = null,
    last_name = null,
    store_name = null,
    password,
    role = "cashier",
}) {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
        `INSERT INTO users (email, phone, first_name, last_name, store_name, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, phone, first_name, last_name, store_name, role, created_at`,
        [email, phone, first_name, last_name, store_name, password_hash, role]
    );
    return result.rows[0];
}

export async function findUserByEmail(email) {
    const result = await pool.query(
        `SELECT id, email, phone, first_name, last_name, store_name, password_hash, role, created_at
         FROM users
         WHERE email = $1`,
        [email]
    );
    return result.rows[0] || null;
}

export async function findUserByPhone(phone) {
    const result = await pool.query(
        `SELECT id, email, phone, first_name, last_name, store_name, password_hash, role, created_at
         FROM users
         WHERE phone = $1`,
        [phone]
    );
    return result.rows[0] || null;
}

export async function findUserById(id) {
    const result = await pool.query(
        `SELECT id, email, phone, first_name, last_name, store_name, password_hash, role, created_at
         FROM users
         WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

export async function getAllUsers() {
    const result = await pool.query(
        `SELECT id, email, phone, first_name, last_name, store_name, role, created_at
         FROM users
         ORDER BY created_at DESC`
    );
    return result.rows;
}

export async function updateUser(id, { firstName, lastName, contact, role }) {
    const isEmail = contact && contact.includes("@");
    const email = contact && isEmail ? contact : null;
    const phone = contact && !isEmail ? contact : null;

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

    if (updates.length === 0) {
        return await findUserById(id);
    }

    values.push(id);
    const query = `
        UPDATE users
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING id, email, phone, first_name, last_name, store_name, role, created_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
}

export async function deleteUser(id) {
    const result = await pool.query(
        `DELETE FROM users WHERE id = $1 RETURNING id`,
        [id]
    );
    return result.rows[0] || null;
}

/**
 * Check if any users exist in the database (for bootstrap registration)
 * @returns {Promise<boolean>} True if at least one user exists
 */
export async function hasAnyUsers() {
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM users`
    );
    return parseInt(result.rows[0].count) > 0;
}