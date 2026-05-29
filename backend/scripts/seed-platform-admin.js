import "../src/utils/load-env.js";
import bcrypt from "bcryptjs";
import { initializeDatabase } from "../src/utils/db-init.js";
import { closeDb, getDatabaseInfo, initDb, safeQuery } from "../src/utils/db.js";

const ADMIN = {
    email: process.env.PLATFORM_ADMIN_EMAIL,
    password: process.env.PLATFORM_ADMIN_PASSWORD,
    name: process.env.PLATFORM_ADMIN_NAME || "Platform Super Admin",
    role: "platform_super_admin",
};

function validateSeedConfig() {
    if (!ADMIN.email || !ADMIN.password || !ADMIN.name) {
        throw new Error(
            "PLATFORM_ADMIN_EMAIL, PLATFORM_ADMIN_PASSWORD and PLATFORM_ADMIN_NAME are required"
        );
    }

    if (ADMIN.password.length < 8) {
        throw new Error("PLATFORM_ADMIN_PASSWORD must be at least 8 characters");
    }
}

async function seedPlatformAdmin() {
    validateSeedConfig();
    await initializeDatabase();
    await initDb();

    const dbInfo = getDatabaseInfo();
    console.log(`Using ${dbInfo.provider} database: ${dbInfo.target}`);

    const email = ADMIN.email.trim().toLowerCase();
    const existing = await safeQuery(
        `SELECT id, email, role, is_active
         FROM platform_admins
         WHERE LOWER(email) = LOWER($1)`,
        [email]
    );

    if (existing.rows[0]) {
        console.log(
            `Platform admin already exists: ${existing.rows[0].email} (id=${existing.rows[0].id}, role=${existing.rows[0].role})`
        );
        return existing.rows[0];
    }

    const passwordHash = await bcrypt.hash(ADMIN.password, 10);
    const result = await safeQuery(
        `INSERT INTO platform_admins
             (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id, name, email, role, is_active, created_at`,
        [ADMIN.name.trim(), email, passwordHash, ADMIN.role]
    );

    console.log(
        `Platform super admin created: ${result.rows[0].email} (id=${result.rows[0].id}, role=${result.rows[0].role})`
    );
    return result.rows[0];
}

seedPlatformAdmin()
    .catch((err) => {
        console.error("Failed to seed platform admin:", err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await closeDb();
    });
