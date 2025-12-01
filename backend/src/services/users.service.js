import pool from "../utils/db.js";
import bcrypt from "bcryptjs";

export async function createUser({ email, password, role = "cashier" }) {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, $3)
             RETURNING id, email, role, created_at`,
        [email, password_hash, role]
    );
    return result.rows[0];
}

export async function findUserByEmail(email) {
    const result = await pool.query(
        `SELECT id, email, password_hash, role, created_at
         FROM users
         WHERE email = $1`,
        [email]
    );
    return result.rows[0] || null;
}

export async function getAllUsers() {
    const result = await pool.query(
        `SELECT id, email, role, created_at
         FROM users
         ORDER BY created_at DESC`
    );
    return result.rows;
}
