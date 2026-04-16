import {
    getAllUsers,
    createUser as createUserService,
    findUserById,
    updateUser as updateUserService,
    deleteUser as deleteUserService,
} from "../services/users.service.js";
import { success, error } from "../utils/response.js";

const ALLOWED_USER_ROLES = ["cashier", "manager", "admin"];

export async function listUsers(req, res, next) {
    try {
        const users = await getAllUsers();
        return success(res, users);
    } catch (err) {
        next(err);
    }
}

export async function createUser(req, res, next) {
    try {
        const { firstName, lastName, contact, role, password } = req.body;

        if (!firstName || !lastName || !contact || !password) {
            return error(
                res,
                "Имя, фамилия, контакт и пароль сотрудника обязательны",
                400
            );
        }

        if (!ALLOWED_USER_ROLES.includes(role)) {
            return error(
                res,
                "Роль сотрудника должна быть одной из: cashier, manager, admin",
                400
            );
        }

        const currentUser = await findUserById(req.user.id);
        const storeName = currentUser?.store_name || null;

        const isEmail = contact.includes("@");
        const email = isEmail ? contact : null;
        const phone = isEmail ? null : contact;

        const user = await createUserService({
            email,
            phone,
            first_name: firstName,
            last_name: lastName,
            store_name: storeName,
            password,
            role,
        });

        return success(res, user, 201);
    } catch (err) {
        next(err);
    }
}

export async function updateUser(req, res, next) {
    try {
        const { id } = req.params;
        const { firstName, lastName, contact, role } = req.body;

        if (!ALLOWED_USER_ROLES.includes(role)) {
            return error(
                res,
                "Роль сотрудника должна быть одной из: cashier, manager, admin",
                400
            );
        }

        const existingUser = await findUserById(parseInt(id, 10));
        if (!existingUser) {
            return error(res, "Сотрудник не найден", 404);
        }

        const updatedUser = await updateUserService(parseInt(id, 10), {
            firstName,
            lastName,
            contact,
            role,
        });

        return success(res, updatedUser);
    } catch (err) {
        next(err);
    }
}

export async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;
        const userId = parseInt(id, 10);

        const existingUser = await findUserById(userId);
        if (!existingUser) {
            return error(res, "Сотрудник не найден", 404);
        }

        if (existingUser.id === req.user.id) {
            return error(res, "Нельзя удалить самого себя", 400);
        }

        await deleteUserService(userId);

        return success(res, { message: "Сотрудник успешно удалён" });
    } catch (err) {
        next(err);
    }
}
