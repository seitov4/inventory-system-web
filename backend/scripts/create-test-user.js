import "dotenv/config";
import { closeDb, getDatabaseInfo, initDb } from "../src/utils/db.js";
import { initializeDatabase } from "../src/utils/db-init.js";
import {
    createUser,
    findUserByEmail,
    findUserByPhone,
} from "../src/services/users.service.js";

const TEST_USER = {
    email: process.env.TEST_USER_EMAIL || "owner@test.local",
    phone: process.env.TEST_USER_PHONE || "+77006521158",
    first_name: process.env.TEST_USER_FIRST_NAME || "Test",
    last_name: process.env.TEST_USER_LAST_NAME || "Owner",
    store_name: process.env.TEST_USER_STORE_NAME || "Local Test Store",
    password: process.env.TEST_USER_PASSWORD || "test123",
    role: process.env.TEST_USER_ROLE || "owner",
};

async function findExistingTestUser() {
    const byEmail = TEST_USER.email ? await findUserByEmail(TEST_USER.email) : null;
    if (byEmail) {
        return byEmail;
    }

    const byPhone = TEST_USER.phone ? await findUserByPhone(TEST_USER.phone) : null;
    return byPhone;
}

async function ensureTestUser() {
    const dbInfo = getDatabaseInfo();
    console.log(`Using ${dbInfo.provider} database: ${dbInfo.target}`);
    console.log("Checking for existing test user...");

    const existingUser = await findExistingTestUser();

    if (existingUser) {
        console.log("Test user already exists.");
        console.log(`ID: ${existingUser.id}`);
        console.log(`Email: ${existingUser.email || "N/A"}`);
        console.log(`Phone: ${existingUser.phone || "N/A"}`);
        console.log(`Role: ${existingUser.role}`);
        console.log(`Password: ${TEST_USER.password}`);
        return existingUser;
    }

    console.log("Creating test user...");

    const user = await createUser(TEST_USER);

    console.log("Test user created successfully.");
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email || "N/A"}`);
    console.log(`Phone: ${user.phone || "N/A"}`);
    console.log(`Password: ${TEST_USER.password}`);
    console.log(`Role: ${user.role}`);
    console.log(`Store: ${user.store_name || "N/A"}`);

    return user;
}

async function main() {
    await initializeDatabase();
    await initDb();
    await ensureTestUser();
}

main()
    .catch((error) => {
        console.error("Failed to create test user:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeDb();
    });
