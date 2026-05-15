import "../src/utils/load-env.js";
import bcrypt from "bcryptjs";
import { closeDb, getDatabaseInfo, initDb, safeQuery } from "../src/utils/db.js";
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

const TEST_PHONE_ALIASES = [
    TEST_USER.phone,
    process.env.TEST_USER_PHONE_ALIAS,
    "+7006521158",
    "+77006521158",
    "7006521158",
    "77006521158",
].filter(Boolean);

async function findExistingTestUser() {
    const byEmail = TEST_USER.email ? await findUserByEmail(TEST_USER.email) : null;
    if (byEmail) {
        return byEmail;
    }

    for (const phone of TEST_PHONE_ALIASES) {
        const byPhone = await findUserByPhone(phone);
        if (byPhone) {
            return byPhone;
        }
    }

    return null;
}

async function removeConflictingAliases(userId) {
    const aliases = TEST_PHONE_ALIASES.filter((phone) => phone !== TEST_USER.phone);
    if (!aliases.length) {
        return;
    }

    await safeQuery(
        `UPDATE users
         SET phone = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id <> $1
           AND phone = ANY($2::text[])`,
        [userId, aliases]
    );
}

async function verifyTestLogin() {
    const user = await findUserByPhone(TEST_USER.phone);
    if (!user) {
        throw new Error(`Test user was not found by phone ${TEST_USER.phone}`);
    }

    const passwordMatches = await bcrypt.compare(
        TEST_USER.password,
        user.password_hash
    );

    if (!passwordMatches) {
        throw new Error("Test user password verification failed after seed");
    }

    return user;
}

async function ensureTestUser() {
    await initDb();

    const dbInfo = getDatabaseInfo();
    console.log(`Using ${dbInfo.provider} database: ${dbInfo.target}`);
    console.log("Checking for existing test user...");

    const existingUser = await findExistingTestUser();

    if (existingUser) {
        console.log("Test user already exists. Updating login fields and password...");
        await removeConflictingAliases(existingUser.id);
        const passwordHash = await bcrypt.hash(TEST_USER.password, 10);
        const result = await safeQuery(
            `UPDATE users
             SET email = $1,
                 phone = $2,
                 first_name = $3,
                 last_name = $4,
                 store_name = $5,
                 password_hash = $6,
                 role = $7,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING id, email, phone, first_name, last_name, store_name, role, created_at`,
            [
                TEST_USER.email,
                TEST_USER.phone,
                TEST_USER.first_name,
                TEST_USER.last_name,
                TEST_USER.store_name,
                passwordHash,
                TEST_USER.role,
                existingUser.id,
            ]
        );

        const updatedUser = result.rows[0];
        console.log(`ID: ${updatedUser.id}`);
        console.log(`Email: ${updatedUser.email || "N/A"}`);
        console.log(`Phone: ${updatedUser.phone || "N/A"}`);
        console.log(`Role: ${updatedUser.role}`);
        console.log(`Password: ${TEST_USER.password}`);
        return updatedUser;
    }

    console.log("Creating test user...");

    await safeQuery(
        `UPDATE users
         SET phone = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE phone = ANY($1::text[])`,
        [TEST_PHONE_ALIASES]
    );
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

ensureTestUser()
    .then(async () => {
        const verifiedUser = await verifyTestLogin();
        console.log("");
        console.log("Login check passed.");
        console.log(`Use login: ${verifiedUser.phone}`);
        console.log(`Use password: ${TEST_USER.password}`);
    })
    .catch((error) => {
        console.error("Failed to create test user:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeDb();
    });
