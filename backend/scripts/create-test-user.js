/**
 * Create Test User Script
 * 
 * Creates a test user for development/testing purposes.
 * Run: node scripts/create-test-user.js
 */

import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcryptjs";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "inventory_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function createTestUser() {
    const client = await pool.connect();
    
    try {
        console.log("🔍 Checking if test user exists...");
        
        // Check if user with phone +77006521158 exists
        const phoneCheck = await client.query(
            "SELECT id, phone, email, role FROM users WHERE phone = $1",
            ["+77006521158"]
        );
        
        if (phoneCheck.rows.length > 0) {
            console.log("⚠️  Test user already exists:");
            console.log(`   ID: ${phoneCheck.rows[0].id}`);
            console.log(`   Phone: ${phoneCheck.rows[0].phone}`);
            console.log(`   Email: ${phoneCheck.rows[0].email || "N/A"}`);
            console.log(`   Role: ${phoneCheck.rows[0].role}`);
            console.log("\n💡 To reset password, delete the user first or use a different phone number.");
            return;
        }
        
        console.log("📦 Creating test user...");
        
        // Create test user
        const password = "test123"; // Default test password
        const password_hash = await bcrypt.hash(password, 10);
        
        const result = await client.query(
            `INSERT INTO users (phone, first_name, last_name, store_name, password_hash, role)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, phone, email, first_name, last_name, store_name, role, created_at`,
            [
                "+77006521158",
                "Test",
                "User",
                "Test Store",
                password_hash,
                "owner"
            ]
        );
        
        const user = result.rows[0];
        
        console.log("\n✅ Test user created successfully!");
        console.log("\n📝 Login credentials:");
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Password: ${password}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Store: ${user.store_name}`);
        console.log("\n💡 You can now login with these credentials.");
        
    } catch (error) {
        if (error.code === "23505") { // Unique violation
            console.error("❌ User with this phone number already exists");
        } else {
            console.error("❌ Error creating test user:", error.message);
            throw error;
        }
    } finally {
        client.release();
        await pool.end();
    }
}

// Run script
createTestUser().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});

