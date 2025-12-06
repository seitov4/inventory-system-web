import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
    createUser,
    findUserByEmail,
    findUserByPhone,
    findUserById,
} from "../services/users.service.js";

function signToken(user) {
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

// POST /api/auth/register
// Бизнес-регистрация: магазин + владелец/администратор
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

        if (!storeName || !firstName || !lastName || !contact || !password) {
            return res.status(400).json({
                message:
                    "Название магазина, имя, фамилия, контакт и пароль обязательны",
            });
        }

        if (passwordConfirm && password !== passwordConfirm) {
            return res
                .status(400)
                .json({ message: "Пароль и подтверждение не совпадают" });
        }

        if (role && !["owner", "admin"].includes(role)) {
            return res
                .status(400)
                .json({ message: "Роль при регистрации может быть только owner или admin" });
        }

        const normalizedRole = role || "owner";

        const isEmail = contact.includes("@");
        const email = isEmail ? contact : null;
        const phone = isEmail ? null : contact;

        if (email) {
            const existing = await findUserByEmail(email);
            if (existing) {
                return res.status(409).json({
                    message: "Пользователь с таким email уже существует",
                });
            }
        }

        if (phone) {
            const existingByPhone = await findUserByPhone(phone);
            if (existingByPhone) {
                return res.status(409).json({
                    message: "Пользователь с таким телефоном уже существует",
                });
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

        const token = signToken(user);

        res.status(201).json({
            token,
            user,
        });
    } catch (err) {
        next(err);
    }
}

// POST /api/auth/login
export async function login(req, res, next) {
    try {
        const { login, email, password } = req.body;

        const identifier = login || email;

        if (!identifier || !password) {
            return res
                .status(400)
                .json({ message: "Логин (email или телефон) и пароль обязательны" });
        }

        const isEmail = identifier.includes("@");
        const user = isEmail
            ? await findUserByEmail(identifier)
            : await findUserByPhone(identifier);

        if (!user) {
            return res.status(401).json({ message: "Неверный логин или пароль" });
        }

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            return res.status(401).json({ message: "Неверный логин или пароль" });
        }

        const token = signToken(user);

        res.json({
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
        });
    } catch (err) {
        next(err);
    }
}

// GET /api/auth/me
export async function me(req, res, next) {
    try {
        const current = await findUserById(req.user.id);
        if (!current) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        res.json({
            user: {
                id: current.id,
                email: current.email,
                phone: current.phone,
                first_name: current.first_name,
                last_name: current.last_name,
                store_name: current.store_name,
                role: current.role,
                created_at: current.created_at,
            },
        });
    } catch (err) {
        next(err);
    }
}

// POST /api/auth/logout
export async function logout(req, res) {
    res.json({ message: "Logged out" });
}
