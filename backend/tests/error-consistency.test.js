import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ERROR_CODES } from "../src/errors/error-codes.js";
import { RU_ERROR_MESSAGES } from "../src/errors/error-messages.ru.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

function collectJsFiles(dirPath) {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    const result = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            result.push(...collectJsFiles(fullPath));
            continue;
        }

        if (entry.isFile() && entry.name.endsWith(".js")) {
            result.push(fullPath);
        }
    }

    return result;
}

test("error codes and ru catalog are strictly synchronized", () => {
    const codeValues = Object.values(ERROR_CODES).sort();
    const messageKeys = Object.keys(RU_ERROR_MESSAGES).sort();

    assert.deepEqual(
        messageKeys,
        codeValues,
        "Каждому ERROR_CODE должно соответствовать сообщение и наоборот"
    );
});

test("ru catalog messages use russian user-facing language", () => {
    for (const [code, template] of Object.entries(RU_ERROR_MESSAGES)) {
        if (typeof template === "string") {
            assert.match(
                template,
                /[А-Яа-яЁё]/,
                `Сообщение для ${code} должно содержать русский текст`
            );
        }
    }
});

test("user-facing layers do not bypass unified error flow", () => {
    const scanDirs = [
        path.join(backendRoot, "src", "controllers"),
        path.join(backendRoot, "src", "services"),
        path.join(backendRoot, "src", "middleware"),
    ];
    const files = scanDirs.flatMap(collectJsFiles);
    const violations = [];

    for (const filePath of files) {
        const content = readFileSync(filePath, "utf8");
        const relativePath = path.relative(backendRoot, filePath).replaceAll("\\", "/");

        if (/throw\s+new\s+Error\s*\(/.test(content)) {
            violations.push(`${relativePath}: throw new Error(...)`);
        }

        if (/\breturn\s+error\s*\(\s*res\s*,/.test(content)) {
            violations.push(`${relativePath}: return error(res, ...)`);
        }

        const lines = content.split(/\r?\n/);
        lines.forEach((line, index) => {
            if (line.includes("err.message") && line.includes("res.")) {
                violations.push(
                    `${relativePath}:${index + 1}: possible raw err.message in API response`
                );
            }
        });
    }

    assert.equal(
        violations.length,
        0,
        `Найдены нарушения единого error-flow:\n${violations.join("\n")}`
    );
});
