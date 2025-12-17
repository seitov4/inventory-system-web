import { Router } from "express";
import { authRequired, requireRole } from "../middleware/auth.middleware.js";
import {
    getAllUsers,
    createUser,
    findUserById,
    updateUser,
    deleteUser,
} from "../services/users.service.js";
import { success, error } from "../utils/response.js";

const router = Router();

// GET /api/users - admin only
router.get(
    "/",
    authRequired,
    requireRole("admin"),
    async (req, res, next) => {
        try {
            const users = await getAllUsers();
            return success(res, users);
        } catch (err) {
            next(err);
        }
    }
);

// POST /api/users — добавление сотрудника - admin only
router.post(
    "/",
    authRequired,
    requireRole("admin"),
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
                return error(
                    res,
                    "Имя, фамилия, контакт и пароль сотрудника обязательны",
                    400
                );
            }

            if (!["cashier", "manager", "admin"].includes(role)) {
                return error(
                    res,
                    "Роль сотрудника должна быть одной из: cashier, manager, admin",
                    400
                );
            }

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

            return success(res, user, 201);
        } catch (err) {
            next(err);
        }
    }
);

// PUT /api/users/:id — обновление сотрудника - admin only
router.put(
    "/:id",
    authRequired,
    requireRole("admin"),
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { firstName, lastName, contact, role } = req.body;

            if (!["cashier", "manager", "admin"].includes(role)) {
                return error(
                    res,
                    "Роль сотрудника должна быть одной из: cashier, manager, admin",
                    400
                );
            }

            const user = await findUserById(parseInt(id));
            if (!user) {
                return error(res, "Сотрудник не найден", 404);
            }

            const updated = await updateUser(parseInt(id), {
                firstName,
                lastName,
                contact,
                role,
            });

            return success(res, updated);
        } catch (err) {
            next(err);
        }
    }
);

// DELETE /api/users/:id — удаление сотрудника - admin only
router.delete(
    "/:id",
    authRequired,
    requireRole("admin"),
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const user = await findUserById(parseInt(id));
            if (!user) {
                return error(res, "Сотрудник не найден", 404);
            }

            if (user.id === req.user.id) {
                return error(res, "Нельзя удалить самого себя", 400);
            }

            await deleteUser(parseInt(id));

            return success(res, { message: "Сотрудник успешно удалён" });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
