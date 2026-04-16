#!/usr/bin/env node
import "dotenv/config";
import { initializeDatabase } from "../src/utils/db-init.js";

(async () => {
  try {
    console.log("Starting database initialization...");
    await initializeDatabase();
    console.log("Database initialization completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Database initialization failed:", err.message);
    process.exit(1);
  }
})();
