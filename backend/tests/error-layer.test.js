import test from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "../src/middleware/error.middleware.js";
import { createAppError, resolveErrorMessage } from "../src/errors/app-error.js";
import { ERROR_CODES } from "../src/errors/error-codes.js";

function createMockResponse() {
    return {
        headersSent: false,
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.payload = body;
            return this;
        },
    };
}

function runErrorHandler(err) {
    const res = createMockResponse();
    const req = {};
    const next = () => {};
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
        errorHandler(err, req, res, next);
    } finally {
        console.error = originalConsoleError;
    }
    return res;
}

test("resolveErrorMessage resolves code to localized Russian text", () => {
    const message = resolveErrorMessage(ERROR_CODES.PRODUCT_SKU_EXISTS, {
        sku: "SKU-123",
    });

    assert.equal(typeof message, "string");
    assert.ok(message.includes("SKU-123"));
});

test("errorHandler returns stable error response for AppError", () => {
    const err = createAppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 401);
    const res = runErrorHandler(err);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.payload, {
        success: false,
        data: null,
        error: resolveErrorMessage(ERROR_CODES.AUTH_INVALID_CREDENTIALS),
    });
});

test("errorHandler never exposes raw internal message for unknown errors", () => {
    const err = new Error("db password leaked: super-secret-value");
    const res = runErrorHandler(err);

    assert.equal(res.statusCode, 500);
    assert.equal(res.payload.success, false);
    assert.equal(res.payload.data, null);
    assert.equal(
        res.payload.error,
        resolveErrorMessage(ERROR_CODES.INTERNAL_SERVER_ERROR)
    );
    assert.notEqual(res.payload.error, err.message);
});

test("database schema errors map to internal-safe message", () => {
    const dbError = {
        code: "42703",
        column: "secret_column",
        table: "users",
        message: 'column "secret_column" does not exist',
    };
    const res = runErrorHandler(dbError);

    assert.equal(res.statusCode, 500);
    assert.equal(
        res.payload.error,
        resolveErrorMessage(ERROR_CODES.INTERNAL_SERVER_ERROR)
    );
});
