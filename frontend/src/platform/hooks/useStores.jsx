import { useCallback, useEffect, useMemo, useState } from "react";
import {
    getStores,
    createStore as apiCreateStore,
    suspendStore as apiSuspendStore,
    resumeStore as apiResumeStore,
    archiveStore as apiArchiveStore,
} from "../api/stores.api.js";

const STORE_STATUSES = {
    ACTIVE: "active",
    SUSPENDED: "suspended",
    INACTIVE: "inactive",
};

const ALLOWED_TRANSITIONS = {
    [STORE_STATUSES.ACTIVE]: [STORE_STATUSES.SUSPENDED, STORE_STATUSES.INACTIVE],
    [STORE_STATUSES.SUSPENDED]: [STORE_STATUSES.ACTIVE, STORE_STATUSES.INACTIVE],
    [STORE_STATUSES.INACTIVE]: [],
};

function isTransitionAllowed(currentStatus, targetStatus) {
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
}

function normalizeStore(raw) {
    if (!raw) {
        return null;
    }

    const status = raw.status || STORE_STATUSES.ACTIVE;
    const normalizedStatus = Object.values(STORE_STATUSES).includes(status)
        ? status
        : STORE_STATUSES.ACTIVE;

    return {
        id: raw.id || raw.store_id,
        name: raw.name || raw.store_name,
        slug: raw.slug || raw.store_slug,
        ownerEmail: raw.ownerEmail || raw.owner_email || raw.ownerEmail,
        status: normalizedStatus,
        plan: raw.plan || raw.plan_name || raw.plan,
        region: raw.region || raw.region_name || "unknown",
        createdAt: raw.createdAt || raw.created_at || raw.createdAt,
        lastActiveAt: raw.lastActiveAt || raw.last_active_at || raw.lastActiveAt,
    };
}

export default function useStores() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchStores = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const apiStores = await getStores();
            const normalized = Array.isArray(apiStores)
                ? apiStores.map(normalizeStore).filter(Boolean)
                : [];
            setStores(normalized);
            setError("");
        } catch (e) {
            setError(e.message || "Failed to load stores");
            setStores([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    const optimisticUpdate = useCallback((storeId, newStatus) => {
        let previousStore = null;
        setStores((prev) =>
            prev.map((store) => {
                if (store.id === storeId) {
                    previousStore = { ...store };
                    return { ...store, status: newStatus };
                }
                return store;
            })
        );
        return () => {
            if (previousStore) {
                setStores((prev) => prev.map((store) => (store.id === storeId ? previousStore : store)));
            }
        };
    }, []);

    const createStore = useCallback(async (payload) => {
        setLoading(true);
        setError("");
        try {
            const created = await apiCreateStore(payload);
            const normalized = normalizeStore(created);
            setStores((prev) => [normalized, ...prev]);
            return normalized;
        } catch (e) {
            console.error("[useStores] Failed to create store", e);
            const errorMessage =
                e?.response?.data?.error?.message ||
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                e.message ||
                "Failed to create store";
            setError(errorMessage);
            throw e;
        } finally {
            setLoading(false);
        }
    }, []);

    const suspendStore = useCallback(
        async (id) => {
            const store = stores.find((item) => item.id === id);
            if (!store) {
                throw new Error("Store not found");
            }

            if (!isTransitionAllowed(store.status, STORE_STATUSES.SUSPENDED)) {
                throw new Error(`Cannot suspend store with status "${store.status}".`);
            }

            const rollback = optimisticUpdate(id, STORE_STATUSES.SUSPENDED);
            setError("");

            try {
                const updated = await apiSuspendStore(id);
                const normalized = normalizeStore(updated);
                setStores((prev) => prev.map((item) => (item.id === normalized.id ? normalized : item)));
                return normalized;
            } catch (e) {
                rollback();
                console.error("[useStores] Failed to suspend store", e);
                setError(e?.response?.data?.error?.message || e.message || "Failed to suspend store");
                throw e;
            }
        },
        [stores, optimisticUpdate]
    );

    const resumeStore = useCallback(
        async (id) => {
            const store = stores.find((item) => item.id === id);
            if (!store) {
                throw new Error("Store not found");
            }

            if (!isTransitionAllowed(store.status, STORE_STATUSES.ACTIVE)) {
                throw new Error(`Cannot resume store with status "${store.status}".`);
            }

            const rollback = optimisticUpdate(id, STORE_STATUSES.ACTIVE);
            setError("");

            try {
                const updated = await apiResumeStore(id);
                const normalized = normalizeStore(updated);
                setStores((prev) => prev.map((item) => (item.id === normalized.id ? normalized : item)));
                return normalized;
            } catch (e) {
                rollback();
                console.error("[useStores] Failed to resume store", e);
                setError(e?.response?.data?.error?.message || e.message || "Failed to resume store");
                throw e;
            }
        },
        [stores, optimisticUpdate]
    );

    const archiveStore = useCallback(
        async (id) => {
            const store = stores.find((item) => item.id === id);
            if (!store) {
                throw new Error("Store not found");
            }

            if (!isTransitionAllowed(store.status, STORE_STATUSES.INACTIVE)) {
                throw new Error(`Cannot deactivate store with status "${store.status}".`);
            }

            const rollback = optimisticUpdate(id, STORE_STATUSES.INACTIVE);
            setError("");

            try {
                const updated = await apiArchiveStore(id);
                const normalized = normalizeStore(updated);
                setStores((prev) => prev.map((item) => (item.id === normalized.id ? normalized : item)));
                return normalized;
            } catch (e) {
                rollback();
                console.error("[useStores] Failed to deactivate store", e);
                setError(e?.response?.data?.error?.message || e.message || "Failed to deactivate store");
                throw e;
            }
        },
        [stores, optimisticUpdate]
    );

    const hasStores = useMemo(() => stores.length > 0, [stores]);

    return {
        stores,
        loading,
        error,
        hasStores,
        fetchStores,
        createStore,
        suspendStore,
        resumeStore,
        archiveStore,
    };
}
