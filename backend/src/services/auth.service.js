import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
    createUser,
    findUserByEmail,
    findUserByPhone,
    findUserById,
} from "./users.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

export function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
}

export async function validateCredentials(identifier, password) {
    if (!identifier || !password) {
        return null;
    }

    const isEmail = identifier.includes("@");
    const user = isEmail
        ? await findUserByEmail(identifier)
        : await findUserByPhone(identifier);

    if (!user) {
        return null;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        return null;
    }

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password_hash;
    return userWithoutPassword;
}

export async function loginUser(identifier, password) {
    const user = await validateCredentials(identifier, password);

    if (!user) {
        throw createAppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 401);
    }

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            first_name: user.first_name,
            last_name: user.last_name,
            store_name: user.store_name,
            role: user.role,
            created_at: user.created_at,
        },
    };
}

export async function registerUser({
    storeName,
    firstName,
    lastName,
    contact,
    password,
    passwordConfirm,
    role,
}) {
    if (!storeName || !firstName || !lastName || !contact || !password) {
        throw createAppError(ERROR_CODES.AUTH_REGISTER_REQUIRED_FIELDS, 400);
    }

    if (passwordConfirm && password !== passwordConfirm) {
        throw createAppError(ERROR_CODES.AUTH_PASSWORD_CONFIRM_MISMATCH, 400);
    }

    const normalizedRole = role || "owner";
    if (!["owner", "admin"].includes(normalizedRole)) {
        throw createAppError(ERROR_CODES.AUTH_REGISTER_ROLE_INVALID, 400);
    }

    const isEmail = contact.includes("@");
    const email = isEmail ? contact : null;
    const phone = isEmail ? null : contact;

    if (email) {
        const existing = await findUserByEmail(email);
        if (existing) {
            throw createAppError(ERROR_CODES.AUTH_USER_EMAIL_EXISTS, 409);
        }
    }

    if (phone) {
        const existingByPhone = await findUserByPhone(phone);
        if (existingByPhone) {
            throw createAppError(ERROR_CODES.AUTH_USER_PHONE_EXISTS, 409);
        }
    }

    const user = await createUser({
        email,
        phone,
        first_name: firstName,
        last_name: lastName,
        store_name: storeName,
        password,
        role: normalizedRole,
    });

    const token = generateToken(user);

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            first_name: user.first_name,
            last_name: user.last_name,
            store_name: user.store_name,
            role: user.role,
            created_at: user.created_at,
        },
    };
}

export async function getCurrentUser(userId) {
    const user = await findUserById(userId);

    if (!user) {
        throw createAppError(ERROR_CODES.AUTH_USER_NOT_FOUND, 404);
    }

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password_hash;

    return {
        user: {
            id: userWithoutPassword.id,
            email: userWithoutPassword.email,
            phone: userWithoutPassword.phone,
            first_name: userWithoutPassword.first_name,
            last_name: userWithoutPassword.last_name,
            store_name: userWithoutPassword.store_name,
            role: userWithoutPassword.role,
            created_at: userWithoutPassword.created_at,
        },
    };
}
