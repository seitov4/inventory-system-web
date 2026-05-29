import { getCurrentPlatformAdmin, loginPlatformAdmin } from "../services/platformAuth.service.js";
import { success } from "../utils/response.js";

export async function login(req, res, next) {
    try {
        const { email, password } = req.body || {};
        const result = await loginPlatformAdmin(email, password);
        return success(res, result);
    } catch (err) {
        return next(err);
    }
}

export async function me(req, res, next) {
    try {
        const user = await getCurrentPlatformAdmin(req.platformAdmin.id);
        return success(res, { user });
    } catch (err) {
        return next(err);
    }
}

export async function logout(req, res) {
    return success(res, { message: "Logged out" });
}
