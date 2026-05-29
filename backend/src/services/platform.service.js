import { safeQuery, getDatabaseInfo, DB_PROVIDER } from "../utils/db.js";
import { createAppError, resolveErrorMessage } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import {
    STORE_STATUSES,
    canTransitionStoreStatus,
    normalizeStoreStatus,
    toStoreSlug,
} from "../domain/platform-store.domain.js";
import {
    createStoreRepo,
    findStoreByIdRepo,
    findStoreBySlugRepo,
    getPlatformActivityFeedRepo,
    getPlatformMetricsGrowthRepo,
    getPlatformMetricsSummaryRepo,
    getStoreActivityRepo,
    getStoreHealthRepo,
    listStoresRepo,
    updateStoreStatusRepo,
} from "../repositories/platform-store.repository.js";

function parseStoreId(id) {
    const parsed = Number(id);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw createAppError(ERROR_CODES.PLATFORM_STORE_ID_INVALID, 400);
    }
    return parsed;
}

function ensureStoreStatus(status) {
    const raw = String(status || "").toLowerCase();
    if (!Object.values(STORE_STATUSES).includes(raw)) {
        throw createAppError(ERROR_CODES.PLATFORM_STORE_STATUS_INVALID, 400, {
            status,
        });
    }
    return normalizeStoreStatus(raw);
}

async function ensureStoreExists(storeId) {
    const store = await findStoreByIdRepo(storeId);
    if (!store) {
        throw createAppError(ERROR_CODES.PLATFORM_STORE_NOT_FOUND, 404);
    }
    return store;
}

function normalizeStorePayload(payload = {}) {
    const name = String(payload.name || payload.storeName || "").trim();
    const address = payload.address ? String(payload.address).trim() : null;
    const ownerEmail = payload.ownerEmail ? String(payload.ownerEmail).trim() : null;
    const ownerPassword = payload.ownerPassword ? String(payload.ownerPassword) : null;
    const plan = payload.plan ? String(payload.plan).trim() : "standard";
    const region = payload.region ? String(payload.region).trim() : "local";
    const slug = toStoreSlug(payload.slug || name);

    if (!name) {
        throw createAppError(ERROR_CODES.PLATFORM_STORE_NAME_REQUIRED, 400);
    }

    if (ownerEmail && (!ownerPassword || ownerPassword.length < 8)) {
        throw createAppError(ERROR_CODES.PLATFORM_USER_PASSWORD_TOO_SHORT, 400);
    }

    return {
        name,
        slug,
        address,
        ownerEmail,
        ownerPassword,
        plan,
        region,
        status: STORE_STATUSES.ACTIVE,
    };
}

export async function listStores() {
    return listStoresRepo();
}

export async function createStore(payload) {
    const normalizedPayload = normalizeStorePayload(payload);

    const existingBySlug = await findStoreBySlugRepo(normalizedPayload.slug);
    if (existingBySlug) {
        throw createAppError(ERROR_CODES.PLATFORM_STORE_SLUG_EXISTS, 409, {
            slug: normalizedPayload.slug,
        });
    }

    return createStoreRepo(normalizedPayload);
}

export async function updateStoreStatus(id, status) {
    const storeId = parseStoreId(id);
    const targetStatus = ensureStoreStatus(status);
    const current = await ensureStoreExists(storeId);

    if (current.status === targetStatus) {
        return current;
    }

    if (!canTransitionStoreStatus(current.status, targetStatus)) {
        throw createAppError(ERROR_CODES.PLATFORM_STORE_STATUS_TRANSITION_INVALID, 409, {
            fromStatus: current.status,
            toStatus: targetStatus,
        });
    }

    const updated = await updateStoreStatusRepo(storeId, targetStatus);
    if (!updated) {
        throw createAppError(ERROR_CODES.PLATFORM_STORE_NOT_FOUND, 404);
    }
    return updated;
}

export async function getStoreDetails(id) {
    const storeId = parseStoreId(id);
    const store = await ensureStoreExists(storeId);
    const health = await getStoreHealthRepo(storeId);

    return {
        ...store,
        environment: DB_PROVIDER,
        stats: {
            lastActivity: store.lastActiveAt,
            userCount: Number(health?.userCount || 0),
            requests24h: Number(health?.salesCount || 0),
            errorCount24h: 0,
        },
    };
}

export async function getStoreHealth(id) {
    const storeId = parseStoreId(id);
    await ensureStoreExists(storeId);
    const health = await getStoreHealthRepo(storeId);

    const status = "OK";
    return {
        status,
        statusLabel: status,
        backend: {
            status,
            latency: 0,
        },
        database: {
            status,
            latency: 0,
        },
        stockCount: Number(health.stockCount || 0),
        salesCount: Number(health.salesCount || 0),
        userCount: Number(health.userCount || 0),
        warehouseCount: Number(health.warehouseCount || 0),
        stats: {
            userCount: Number(health.userCount || 0),
            requests24h: Number(health.salesCount || 0),
            errorCount24h: 0,
            lastActivity: null,
        },
    };
}

export async function getStoreActivity(id) {
    const storeId = parseStoreId(id);
    await ensureStoreExists(storeId);
    const rows = await getStoreActivityRepo(storeId);

    return rows.map((sale) => ({
        id: sale.id,
        type: "sale",
        message: `Sale ${sale.id}`,
        amount: sale.total_amount,
        payment_type: sale.payment_type,
        status: sale.status,
        created_at: sale.created_at,
    }));
}

export async function getBackendHealth() {
    return {
        status: "OK",
        statusLabel: "OK",
        env: process.env.NODE_ENV || "local",
        uptime: process.uptime(),
        latencyMs: 0,
        version: process.env.npm_package_version || "unknown",
    };
}

export async function getDatabaseHealth() {
    const startedAt = Date.now();

    try {
        await safeQuery("SELECT 1");
        return {
            status: "OK",
            statusLabel: "OK",
            ok: true,
            latencyMs: Date.now() - startedAt,
            info: getDatabaseInfo(),
        };
    } catch (err) {
        console.error("[Platform][DatabaseHealth]", {
            message: err.message,
            code: err.code,
        });
        return {
            status: "DOWN",
            statusLabel: "DOWN",
            ok: false,
            latencyMs: Date.now() - startedAt,
            errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
            error: resolveErrorMessage(ERROR_CODES.INTERNAL_SERVER_ERROR),
            info: getDatabaseInfo(),
        };
    }
}

export async function getSystemHealth() {
    const backend = await getBackendHealth();
    const db = await getDatabaseHealth();
    const status = backend.status === "OK" && db.status === "OK" ? "OK" : "WARN";

    return {
        status,
        statusLabel: status,
        backend,
        database: db,
    };
}

export async function getPlatformLogs() {
    return [];
}

export async function getActivityFeed() {
    const rows = await getPlatformActivityFeedRepo();
    return rows.map((sale) => ({
        id: sale.id,
        type: "sale",
        message: sale.store_name
            ? `Sale ${sale.id} (${sale.store_name})`
            : `Sale ${sale.id}`,
        amount: sale.total_amount,
        status: sale.status,
        created_at: sale.created_at,
    }));
}

export async function getMetricsSummary() {
    const summary = await getPlatformMetricsSummaryRepo();
    return {
        stores: summary.totalStores,
        totalStores: summary.totalStores,
        activeStores: summary.activeStores,
        products: summary.products,
        recentSales: summary.recentSales,
    };
}

export async function getMetricsGrowth() {
    return getPlatformMetricsGrowthRepo(7);
}
