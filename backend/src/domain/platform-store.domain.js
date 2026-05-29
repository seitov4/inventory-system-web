export const STORE_STATUSES = Object.freeze({
    ACTIVE: "active",
    SUSPENDED: "suspended",
    INACTIVE: "inactive",
});

export const STORE_STATUS_TRANSITIONS = Object.freeze({
    [STORE_STATUSES.ACTIVE]: [STORE_STATUSES.SUSPENDED, STORE_STATUSES.INACTIVE],
    [STORE_STATUSES.SUSPENDED]: [STORE_STATUSES.ACTIVE, STORE_STATUSES.INACTIVE],
    [STORE_STATUSES.INACTIVE]: [],
});

export function normalizeStoreStatus(status) {
    const normalized = String(status || STORE_STATUSES.ACTIVE).toLowerCase();
    return Object.values(STORE_STATUSES).includes(normalized)
        ? normalized
        : STORE_STATUSES.ACTIVE;
}

export function canTransitionStoreStatus(currentStatus, targetStatus) {
    const current = normalizeStoreStatus(currentStatus);
    const target = normalizeStoreStatus(targetStatus);
    const allowed = STORE_STATUS_TRANSITIONS[current] || [];
    return allowed.includes(target);
}

export function statusToWarehouseType(status) {
    const normalized = normalizeStoreStatus(status);
    if (normalized === STORE_STATUSES.SUSPENDED) {
        return "suspended";
    }
    if (normalized === STORE_STATUSES.INACTIVE) {
        return "inactive";
    }
    return "store";
}

export function toStoreSlug(raw, fallback = "store") {
    const value = String(raw || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");

    return value || fallback;
}

export function mapStoreRow(row) {
    if (!row) {
        return null;
    }

    return {
        id: Number(row.id),
        name: row.name,
        slug: row.slug || toStoreSlug(row.name, `store-${row.id}`),
        ownerEmail: row.owner_email || null,
        status: normalizeStoreStatus(row.status),
        plan: row.plan || "standard",
        region: row.region || "local",
        address: row.address || null,
        primaryWarehouseId: row.primary_warehouse_id ? Number(row.primary_warehouse_id) : null,
        createdAt: row.created_at || null,
        lastActiveAt: row.last_active_at || null,
        warehouseCount: row.warehouse_count !== undefined ? Number(row.warehouse_count || 0) : 0,
    };
}
