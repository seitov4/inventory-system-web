import dotenv from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_ROOT = resolve(__dirname, "../..");
const PROJECT_ROOT = resolve(BACKEND_ROOT, "..");

let loaded = false;

export function loadEnv() {
    if (loaded) {
        return;
    }

    const envPaths = [
        resolve(PROJECT_ROOT, ".env"),
        resolve(BACKEND_ROOT, ".env"),
    ];

    const envPath = envPaths.find((candidate) => existsSync(candidate));
    dotenv.config(envPath ? { path: envPath } : undefined);
    loaded = true;
}

loadEnv();
