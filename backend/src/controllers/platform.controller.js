import * as platformService from "../services/platform.service.js";
import { success } from "../utils/response.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

// Auth
export async function login(req, res, next) {
    try {
        const { email, password, login } = req.body;
        const identifier = login || email;
        if (!identifier || !password) {
            return next(createAppError(ERROR_CODES.AUTH_LOGIN_REQUIRED_FIELDS, 400));
        }

        const result = await platformService.loginPlatformUser(identifier, password);
        return success(res, result);
    } catch (err) {
        return next(err);
    }
}

export async function me(req, res, next) {
    try {
        const result = await platformService.getPlatformProfile(req.user.id);
        return success(res, result);
    } catch (err) {
        return next(err);
    }
}

export async function logout(req, res) {
    return success(res, { message: "Logged out" });
}

// Stores
export async function listStores(req, res, next) {
    try {
        const rows = await platformService.listStores();
        return success(res, rows);
    } catch (err) {
        return next(err);
    }
}

export async function createStore(req, res, next) {
    try {
        const payload = req.body || {};
        const created = await platformService.createStore(payload);
        return success(res, created, 201);
    } catch (err) {
        return next(err);
    }
}

export async function suspendStore(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await platformService.updateStoreStatus(id, "suspended");
        return success(res, updated);
    } catch (err) {
        return next(err);
    }
}

export async function resumeStore(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await platformService.updateStoreStatus(id, "active");
        return success(res, updated);
    } catch (err) {
        return next(err);
    }
}

export async function archiveStore(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await platformService.updateStoreStatus(id, "archived");
        return success(res, updated);
    } catch (err) {
        return next(err);
    }
}

export async function getStoreDetails(req, res, next) {
    try {
        const { id } = req.params;
        const details = await platformService.getStoreDetails(id);
        return success(res, details);
    } catch (err) {
        return next(err);
    }
}

export async function getStoreHealth(req, res, next) {
    try {
        const { id } = req.params;
        const health = await platformService.getStoreHealth(id);
        return success(res, health);
    } catch (err) {
        return next(err);
    }
}

export async function getStoreActivity(req, res, next) {
    try {
        const { id } = req.params;
        const activity = await platformService.getStoreActivity(id);
        return success(res, activity);
    } catch (err) {
        return next(err);
    }
}

// Health
export async function getBackendHealth(req, res, next) {
    try {
        const data = await platformService.getBackendHealth();
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}

export async function getDatabaseHealth(req, res, next) {
    try {
        const data = await platformService.getDatabaseHealth();
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}

export async function getSystemHealth(req, res, next) {
    try {
        const data = await platformService.getSystemHealth();
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}

// Logs & activity
export async function getPlatformLogs(req, res, next) {
    try {
        const params = req.query || {};
        const rows = await platformService.getPlatformLogs(params);
        return success(res, rows);
    } catch (err) {
        return next(err);
    }
}

export async function getActivityFeed(req, res, next) {
    try {
        const rows = await platformService.getActivityFeed();
        return success(res, rows);
    } catch (err) {
        return next(err);
    }
}

// Metrics
export async function getMetricsSummary(req, res, next) {
    try {
        const data = await platformService.getMetricsSummary();
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}

export async function getMetricsGrowth(req, res, next) {
    try {
        const data = await platformService.getMetricsGrowth();
        return success(res, data);
    } catch (err) {
        return next(err);
    }
}
