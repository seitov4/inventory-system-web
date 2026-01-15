/**
 * Check Users Script
 * 
 * Lists all users in the database and allows password reset.
 * Run: node scripts/check-users.js
 */

import dotenv from "dotenv";
import pkg from "pg";
import bcrypt from "bcryptjs";
import readline from "readline";

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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function checkUsers() {
    const client = await pool.connect();
    
    try {
        console.log("🔍 Fetching all users from database...\n");
        
        const result = await client.query(
            `SELECT id, phone, email, first_name, last_name, store_name, role, created_at
             FROM users
             ORDER BY created_at DESC`
        );
        
        if (result.rows.length === 0) {
            console.log("❌ No users found in database.");
            console.log("💡 Run: node scripts/create-test-user.js to create a test user.");
            return;
        }
        
        console.log(`✅ Found ${result.rows.length} user(s):\n`);
        
        result.rows.forEach((user, index) => {
            console.log(`${index + 1}. User ID: ${user.id}`);
            console.log(`   Phone: ${user.phone || "N/A"}`);
            console.log(`   Email: ${user.email || "N/A"}`);
            console.log(`   Name: ${user.first_name || ""} ${user.last_name || ""}`.trim() || "N/A");
            console.log(`   Store: ${user.store_name || "N/A"}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Created: ${user.created_at}`);
            console.log("");
        });
        
        // Check for specific phone number
        const phoneToCheck = "+77006521158";
        console.log(`\n🔎 Checking for phone: ${phoneToCheck}`);
        
        const phoneCheck = await client.query(
            "SELECT id, phone, email, role FROM users WHERE phone = $1",
            [phoneToCheck]
        );
        
        if (phoneCheck.rows.length > 0) {
            console.log(`✅ User found with phone ${phoneToCheck}:`);
            console.log(`   ID: ${phoneCheck.rows[0].id}`);
            console.log(`   Phone: ${phoneCheck.rows[0].phone}`);
            console.log(`   Email: ${phoneCheck.rows[0].email || "N/A"}`);
            console.log(`   Role: ${phoneCheck.rows[0].role}`);
            
            // Check variations
            const variations = [
                "77006521158",  // without +
                "87006521158",  // with 8 instead of +7
            ];
            
            for (const variant of variations) {
                const variantCheck = await client.query(
                    "SELECT id, phone FROM users WHERE phone = $1",
                    [variant]
                );
                if (variantCheck.rows.length > 0) {
                    console.log(`\n⚠️  Also found variant: ${variant} (ID: ${variantCheck.rows[0].id})`);
                }
            }
        } else {
            console.log(`❌ No user found with phone ${phoneToCheck}`);
            console.log("\n💡 Possible reasons:");
            console.log("   1. User doesn't exist");
            console.log("   2. Phone stored in different format (check variations above)");
            console.log("   3. User was created with email instead of phone");
        }
        
        // Ask if user wants to reset password
        console.log("\n" + "=".repeat(50));
        const resetPassword = await question("\n❓ Reset password for a user? (y/n): ");
        
        if (resetPassword.toLowerCase() === "y") {
            const userId = await question("Enter user ID to reset password: ");
            const newPassword = await question("Enter new password (or press Enter for 'test123'): ") || "test123";
            
            const password_hash = await bcrypt.hash(newPassword, 10);
            await client.query(
                "UPDATE users SET password_hash = $1 WHERE id = $2",
                [password_hash, parseInt(userId)]
            );
            
            console.log(`\n✅ Password reset successfully for user ID ${userId}`);
            console.log(`   New password: ${newPassword}`);
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        throw error;
    } finally {
        client.release();
        rl.close();
        await pool.end();
    }
}

// Run script
checkUsers().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});

