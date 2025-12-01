import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "../services/users.service.js";

function signToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
}

// POST /api/auth/register
export async function register(req, res, next) {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email и пароль обязательны" });
        }

        const existing = await findUserByEmail(email);
        if (existing) {
            return res
                .status(409)
                .json({ message: "Пользователь с таким email уже существует" });
        }

        const user = await createUser({ email, password, role });
        const token = signToken(user);

        res.status(201).json({ token, user });
    } catch (err) {
        next(err);
    }
}

// POST /api/auth/login
export async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email и пароль обязательны" });
        }

        const user = await findUserByEmail(email);
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
                role: user.role,
                created_at: user.created_at,
            },
        });
    } catch (err) {
        next(err);
    }
}

// GET /api/auth/me
export async function me(req, res) {
    res.json({ user: req.user });
}

// POST /api/auth/logout
export async function logout(req, res) {
    res.json({ message: "Logged out" });
}
