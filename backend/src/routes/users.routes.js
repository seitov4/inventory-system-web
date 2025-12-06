import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";
import {
    getAllUsers,
    createUser,
    findUserById,
    updateUser,
    deleteUser,
} from "../services/users.service.js";

const router = Router();

// GET /api/users
router.get(
    "/",
    authRequired,
    requireRole("owner", "admin"),
    async (req, res, next) => {
        try {
            const users = await getAllUsers();
            res.json(users);
        } catch (err) {
            next(err);
        }
    }
);

// POST /api/users  — добавление сотрудника
router.post(
    "/",
    authRequired,
    requireRole("owner", "admin"),
    async (req, res, next) => {
        try {
            const {
                firstName,
                lastName,
                contact,
                role,
                password,
            } = req.body;

            if (!firstName || !lastName || !contact || !password) {
                return res.status(400).json({
                    message:
                        "Имя, фамилия, контакт и пароль сотрудника обязательны",
                });
            }

            if (!["cashier", "manager", "admin"].includes(role)) {
                return res.status(400).json({
                    message:
                        "Роль сотрудника должна быть одной из: cashier, manager, admin",
                });
            }

            // Берём магазин из текущего пользователя через его store_name
            const current = await findUserById(req.user.id);
            const store_name = current?.store_name || null;

            const isEmail = contact.includes("@");
            const email = isEmail ? contact : null;
            const phone = isEmail ? null : contact;

            const user = await createUser({
                email,
                phone,
                first_name: firstName,
                last_name: lastName,
                store_name,
                password,
                role,
            });

            res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }
);

// PUT /api/users/:id — обновление сотрудника
router.put(
    "/:id",
    authRequired,
    requireRole("owner", "admin"),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { firstName, lastName, contact, role } = req.body;

            if (!["cashier", "manager", "admin"].includes(role)) {
                return res.status(400).json({
                    message:
                        "Роль сотрудника должна быть одной из: cashier, manager, admin",
                });
            }

            const user = await findUserById(parseInt(id));
            if (!user) {
                return res.status(404).json({ message: "Сотрудник не найден" });
            }

            const updated = await updateUser(parseInt(id), {
                firstName,
                lastName,
                contact,
                role,
            });

            res.json(updated);
        } catch (err) {
            next(err);
        }
    }
);

// DELETE /api/users/:id — удаление сотрудника
router.delete(
    "/:id",
    authRequired,
    requireRole("owner", "admin"),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const user = await findUserById(parseInt(id));
            if (!user) {
                return res.status(404).json({ message: "Сотрудник не найден" });
            }

            // Нельзя удалить самого себя
            if (user.id === req.user.id) {
                return res.status(400).json({
                    message: "Нельзя удалить самого себя",
                });
            }

            await deleteUser(parseInt(id));

            res.json({ message: "Сотрудник успешно удалён" });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
