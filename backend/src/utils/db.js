// backend/src/utils/db.js
import pkg from "pg";
const { Pool } = pkg;

const isSsl = process.env.DB_SSL === "true";

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: isSsl ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
    console.log("✅ Connected to PostgreSQL");
});

pool.on("error", (err) => {
    console.error("❌ PostgreSQL pool error:", err);
});

export default pool;
