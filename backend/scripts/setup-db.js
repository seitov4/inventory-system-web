/**
 * Database Setup Script
 * 
 * This script helps set up the database for the first time.
 * Run: node scripts/setup-db.js
 */

import dotenv from "dotenv";
import pkg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to PostgreSQL server (not specific database)
const adminPool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: "postgres", // Connect to default postgres database
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const dbName = process.env.DB_NAME || "inventory_db";

async function setupDatabase() {
    const client = await adminPool.connect();
    
    try {
        console.log("🔍 Checking if database exists...");
        
        // Check if database exists
        const dbCheck = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbName]
        );
        
        if (dbCheck.rows.length === 0) {
            console.log(`📦 Creating database: ${dbName}...`);
            // Note: CREATE DATABASE cannot be run in a transaction
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database '${dbName}' created successfully`);
        } else {
            console.log(`✅ Database '${dbName}' already exists`);
        }
    } catch (error) {
        console.error("❌ Error setting up database:", error.message);
        throw error;
    } finally {
        client.release();
    }
    
    // Close admin pool
    await adminPool.end();
    
    // Now connect to the actual database and run schema
    const dbPool = new Pool({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        database: dbName,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
    
    const dbClient = await dbPool.connect();
    
    try {
        console.log(`📄 Applying schema to database '${dbName}'...`);
        
        // Read canonical init file (Postgres) under backend/src/db
        const schemaPath = join(__dirname, "../src/db/init.sql");
        const schemaSQL = readFileSync(schemaPath, "utf-8");

        // Execute schema (init.sql contains creation + migrations)
        await dbClient.query(schemaSQL);
        console.log("✅ Schema applied successfully");
        
        // Check if default warehouse exists
        const warehouseCheck = await dbClient.query(
            "SELECT COUNT(*) FROM warehouses"
        );
        
        if (warehouseCheck.rows[0].count === "0") {
            console.log("📦 Creating default warehouse...");
            const defaultWarehouseSQL = readFileSync(
                join(__dirname, "../../db/create_default_warehouse.sql"),
                "utf-8"
            );
            await dbClient.query(defaultWarehouseSQL);
            console.log("✅ Default warehouse created");
        }
        
        console.log("\n🎉 Database setup completed successfully!");
        console.log(`\n📝 Next steps:`);
        console.log(`   1. Make sure your .env file has correct DB credentials`);
        console.log(`   2. Start the backend server: npm run dev`);
        console.log(`   3. Register a user via POST /api/auth/register`);
        
    } catch (error) {
        console.error("❌ Error applying schema:", error.message);
        throw error;
    } finally {
        dbClient.release();
        await dbPool.end();
    }
}

// Run setup
setupDatabase().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});

