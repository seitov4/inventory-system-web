import { loginUser, registerUser, getCurrentUser } from "../services/auth.service.js";
import { success, error } from "../utils/response.js";

/**
 * POST /api/auth/login
 * Login user with email/phone and password
 */
export async function login(req, res, next) {
    try {
        const { login, email, password } = req.body;
        const identifier = login || email;

        if (!identifier || !password) {
            return error(
                res,
                "Логин (email или телефон) и пароль обязательны",
                400
            );
        }

        const result = await loginUser(identifier, password);
        return success(res, result);
    } catch (err) {
        if (err.message === "Неверный логин или пароль") {
            return error(res, err.message, 401);
        }
        next(err);
    }
}

/**
 * POST /api/auth/register
 * Register new store owner/admin (admin only)
 */
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
        // Handle specific validation errors
        if (
            err.message.includes("уже существует") ||
            err.message.includes("обязательны") ||
            err.message.includes("не совпадают") ||
            err.message.includes("может быть только")
        ) {
            const statusCode = err.message.includes("уже существует") ? 409 : 400;
            return error(res, err.message, statusCode);
        }
        next(err);
    }
}

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
export async function me(req, res, next) {
    try {
        const result = await getCurrentUser(req.user.id);
        return success(res, result);
    } catch (err) {
        if (err.message === "Пользователь не найден") {
            return error(res, err.message, 404);
        }
        next(err);
    }
}

/**
 * POST /api/auth/logout
 * Logout user (stateless JWT - just return success)
 */
export async function logout(req, res) {
    return success(res, { message: "Logged out" });
}
