#!/usr/bin/env node

import { existsSync, readFileSync } from "fs";
import { join } from "path";

function extractTableNames(sql) {
    const names = new Set();
    const re =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"?)([a-zA-Z0-9_]+)(?:"?)\s*\(/gi;
    let match;
    while ((match = re.exec(sql)) !== null) {
        names.add(match[1]);
    }
    return names;
}

const cwd = process.cwd();
const backendRoot = existsSync(join(cwd, "src", "db", "init.sql"))
    ? cwd
    : join(cwd, "backend");

const canonicalPath = join(backendRoot, "src", "db", "init.sql");

if (!existsSync(canonicalPath)) {
    console.error("Canonical schema not found:", canonicalPath);
    process.exit(2);
}

const canonicalNames = extractTableNames(readFileSync(canonicalPath, "utf8"));

if (canonicalNames.size === 0) {
    console.error("Canonical schema does not define any tables:", canonicalPath);
    process.exit(2);
}

console.log(
    `Schema check passed. Canonical PostgreSQL schema defines ${canonicalNames.size} tables.`
);
