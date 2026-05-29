import {
    createPlatformAdmin,
    disablePlatformAdmin,
    getPlatformAdminById,
    listPlatformAdmins,
    updatePlatformAdmin,
} from "../services/platformUsers.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { success } from "../utils/response.js";

export async function listUsers(req, res, next) {
    try {
        const users = await listPlatformAdmins(req.query || {});
        return success(res, users);
    } catch (err) {
        return next(err);
    }
}

export async function createUser(req, res, next) {
    try {
        const user = await createPlatformAdmin(req.body || {}, req.platformAdmin?.role);
        return success(res, user, 201);
    } catch (err) {
        return next(err);
    }
}

export async function getUser(req, res, next) {
    try {
        const user = await getPlatformAdminById(req.params.id);
        if (!user) {
            return next(createAppError(ERROR_CODES.USERS_NOT_FOUND, 404));
        }
        return success(res, user);
    } catch (err) {
        return next(err);
    }
}

export async function updateUser(req, res, next) {
    try {
        const user = await updatePlatformAdmin(
            req.params.id,
            req.body || {},
            req.platformAdmin?.role
        );
        return success(res, user);
    } catch (err) {
        return next(err);
    }
}

export async function deleteUser(req, res, next) {
    try {
        const user = await disablePlatformAdmin(req.params.id, req.platformAdmin?.role);
        return success(res, user);
    } catch (err) {
        return next(err);
    }
}
