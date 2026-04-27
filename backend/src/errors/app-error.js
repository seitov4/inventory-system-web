import { ERROR_CODES } from "./error-codes.js";
import { RU_ERROR_MESSAGES } from "./error-messages.ru.js";

export class AppError extends Error {
    constructor(code, options = {}) {
        super(code);
        this.name = "AppError";
        this.code = code;
        this.status = options.status || 400;
        this.params = options.params || {};
        this.expose = options.expose !== undefined ? options.expose : true;
        this.details = options.details || null;
        this.cause = options.cause || null;
    }
}

export function createAppError(code, statusOrOptions = 400, params = {}) {
    if (typeof statusOrOptions === "object" && statusOrOptions !== null) {
        return new AppError(code, statusOrOptions);
    }

    return new AppError(code, {
        status: statusOrOptions,
        params,
    });
}

export function isAppError(err) {
    return err instanceof AppError;
}

export function resolveErrorMessage(code, params = {}, locale = "ru") {
    const dictionary = locale === "ru" ? RU_ERROR_MESSAGES : RU_ERROR_MESSAGES;
    const template = dictionary[code];

    if (!template) {
        return dictionary[ERROR_CODES.INTERNAL_SERVER_ERROR];
    }

    return typeof template === "function" ? template(params) : template;
}

export function normalizeToAppError(err) {
    if (isAppError(err)) {
        return err;
    }

    return createAppError(ERROR_CODES.INTERNAL_SERVER_ERROR, {
        status: 500,
        expose: false,
        cause: err,
    });
}

