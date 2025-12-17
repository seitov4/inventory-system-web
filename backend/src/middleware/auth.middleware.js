import jwt from "jsonwebtoken";
import { findUserById } from "../services/users.service.js";
import { error } from "../utils/response.js";

/**
 * Authentication middleware
 * Verifies JWT token and loads full user from database
 * Attaches user object to req.user
 */
export async function authRequired(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header) {
            return error(res, "Требуется авторизация", 401);
        }

        const parts = header.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return error(res, "Некорректный формат токена", 401);
        }

        const token = parts[1];
        if (!token) {
            return error(res, "Токен не предоставлен", 401);
        }

        // Verify JWT token
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return error(res, "Токен истёк", 401);
            }
            if (err.name === "JsonWebTokenError") {
                return error(res, "Неверный токен", 401);
            }
            return error(res, "Ошибка проверки токена", 401);
        }

        // Load full user from database
        const user = await findUserById(payload.id);

        if (!user) {
            return error(res, "Пользователь не найден", 401);
        }

        // Attach user to request (without password_hash)
        const { password_hash, ...userWithoutPassword } = user;
        req.user = {
            id: userWithoutPassword.id,
            email: userWithoutPassword.email,
            phone: userWithoutPassword.phone,
            first_name: userWithoutPassword.first_name,
            last_name: userWithoutPassword.last_name,
            store_name: userWithoutPassword.store_name,
            role: userWithoutPassword.role,
            created_at: userWithoutPassword.created_at,
        };

        next();
    } catch (err) {
        console.error("[authRequired] Error:", err);
        return error(res, "Ошибка авторизации", 500);
    }
}

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 * 
 * Usage:
 *   requireRole("admin")
 *   requireRole("manager", "owner")
 *   requireRole("cashier", "manager", "owner", "admin")
 */
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return error(res, "Требуется авторизация", 401);
        }

        if (!roles.includes(req.user.role)) {
            return error(res, "Доступ запрещён. Недостаточно прав", 403);
        }

        next();
    };
}
