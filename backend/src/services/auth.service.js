import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
    createUser,
    findUserByEmail,
    findUserByPhone,
    findUserById,
} from "./users.service.js";

/**
 * Generate JWT token for user
 * @param {Object} user - User object with id, email, phone, role
 * @returns {string} JWT token
 */
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

/**
 * Validate user credentials
 * @param {string} identifier - Email or phone
 * @param {string} password - Plain password
 * @returns {Object|null} User object without password_hash, or null if invalid
 */
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

    // Return user without password_hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

/**
 * Login user
 * @param {string} identifier - Email or phone
 * @param {string} password - Plain password
 * @returns {Object} { token, user }
 * @throws {Error} If credentials are invalid
 */
export async function loginUser(identifier, password) {
    const user = await validateCredentials(identifier, password);

    if (!user) {
        throw new Error("Неверный логин или пароль");
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

/**
 * Register new user (store owner/admin)
 * @param {Object} userData - Registration data
 * @param {string} userData.storeName - Store name
 * @param {string} userData.firstName - User first name
 * @param {string} userData.lastName - User last name
 * @param {string} userData.contact - Email or phone
 * @param {string} userData.password - Plain password
 * @param {string} [userData.passwordConfirm] - Password confirmation
 * @param {string} [userData.role] - User role (default: 'owner')
 * @returns {Object} { token, user }
 * @throws {Error} If validation fails or user exists
 */
export async function registerUser({
    storeName,
    firstName,
    lastName,
    contact,
    password,
    passwordConfirm,
    role,
}) {
    // Validation
    if (!storeName || !firstName || !lastName || !contact || !password) {
        throw new Error(
            "Название магазина, имя, фамилия, контакт и пароль обязательны"
        );
    }

    if (passwordConfirm && password !== passwordConfirm) {
        throw new Error("Пароль и подтверждение не совпадают");
    }

    const normalizedRole = role || "owner";
    if (!["owner", "admin"].includes(normalizedRole)) {
        throw new Error(
            "Роль при регистрации может быть только owner или admin"
        );
    }

    // Normalize contact (email or phone)
    const isEmail = contact.includes("@");
    const email = isEmail ? contact : null;
    const phone = isEmail ? null : contact;

    // Check for existing user
    if (email) {
        const existing = await findUserByEmail(email);
        if (existing) {
            throw new Error("Пользователь с таким email уже существует");
        }
    }

    if (phone) {
        const existingByPhone = await findUserByPhone(phone);
        if (existingByPhone) {
            throw new Error("Пользователь с таким телефоном уже существует");
        }
    }

    // Create user (password will be hashed in users.service.js)
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

/**
 * Get current user profile
 * @param {number} userId - User ID
 * @returns {Object} User object without password_hash
 * @throws {Error} If user not found
 */
export async function getCurrentUser(userId) {
    const user = await findUserById(userId);

    if (!user) {
        throw new Error("Пользователь не найден");
    }

    // Return user without password_hash
    const { password_hash, ...userWithoutPassword } = user;

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

