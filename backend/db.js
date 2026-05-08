import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

const useSSL = process.env.DB_SSL === "true";

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.connect()
    .then(() => console.log("Database connected"))
    .catch((err) => console.error("DB connection error", err));