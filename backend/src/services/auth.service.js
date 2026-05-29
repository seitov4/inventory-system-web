import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail, findUserByPhone, findUserById, TENANT_ROLES } from "./users.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

function sanitizeTenantUser(user) {
    return {
        id: user.id,
        store_id: user.store_id,
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name,
        store_name: user.store_name,
        role: user.role,
        scope: "tenant",
        is_active: user.is_active !== false,
        created_at: user.created_at,
    };
}

function ensureTenantUserCanLogin(user) {
    if (!user || !TENANT_ROLES.includes(user.role)) {
        throw createAppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 401);
    }

    if (user.is_active === false) {
        throw createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
    }

    if (!user.store_id) {
        throw createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
    }

    if (user.store_status && user.store_status !== "active") {
        throw createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
    }
}

export function generateToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            scope: "tenant",
            store_id: user.store_id,
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
    const user = isEmail ? await findUserByEmail(identifier) : await findUserByPhone(identifier);

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
    ensureTenantUserCanLogin(user);

    const token = generateToken(user);

    return {
        token,
        user: sanitizeTenantUser(user),
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
    if (!TENANT_ROLES.includes(normalizedRole)) {
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
        user: sanitizeTenantUser(user),
    };
}

export async function getCurrentUser(userId) {
    const user = await findUserById(userId);

    if (!user) {
        throw createAppError(ERROR_CODES.AUTH_USER_NOT_FOUND, 404);
    }

    ensureTenantUserCanLogin(user);
    return { user: sanitizeTenantUser(user) };
}
