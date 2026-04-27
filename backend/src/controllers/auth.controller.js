import { loginUser, registerUser, getCurrentUser } from "../services/auth.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { success } from "../utils/response.js";

export async function login(req, res, next) {
    try {
        const { login, email, password } = req.body;
        const identifier = login || email;

        if (!identifier || !password) {
            return next(createAppError(ERROR_CODES.AUTH_LOGIN_REQUIRED_FIELDS, 400));
        }

        const result = await loginUser(identifier, password);
        return success(res, result);
    } catch (err) {
        return next(err);
    }
}

export async function register(req, res, next) {
    try {
        const {
            storeName,
            firstName,
            lastName,
            contact,
            password,
            passwordConfirm,
            role,
        } = req.body;

        const result = await registerUser({
            storeName,
            firstName,
            lastName,
            contact,
            password,
            passwordConfirm,
            role,
        });

        return success(res, result, 201);
    } catch (err) {
        return next(err);
    }
}

export async function me(req, res, next) {
    try {
        const result = await getCurrentUser(req.user.id);
        return success(res, result);
    } catch (err) {
        return next(err);
    }
}

export async function logout(req, res) {
    return success(res, { message: "Logged out" });
}

