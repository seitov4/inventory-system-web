import { useCallback, useEffect, useMemo, useState } from "react";
import {
    getStores,
    createStore as apiCreateStore,
    suspendStore as apiSuspendStore,
    resumeStore as apiResumeStore,
    archiveStore as apiArchiveStore,
} from "../api/stores.api.js";
import storesMock from "../mock/stores.mock.js";

/**
 * Valid store lifecycle statuses
 */
const STORE_STATUSES = {
    PROVISIONING: "provisioning",
    ACTIVE: "active",
    SUSPENDED: "suspended",
    ARCHIVED: "archived",
};

/**
 * Valid lifecycle transitions
 * Maps from current status to allowed next statuses
 */
const ALLOWED_TRANSITIONS = {
    [STORE_STATUSES.PROVISIONING]: [STORE_STATUSES.ACTIVE],
    [STORE_STATUSES.ACTIVE]: [STORE_STATUSES.SUSPENDED, STORE_STATUSES.ARCHIVED],
    [STORE_STATUSES.SUSPENDED]: [STORE_STATUSES.ACTIVE, STORE_STATUSES.ARCHIVED],
    [STORE_STATUSES.ARCHIVED]: [], // No transitions from archived
};

/**
 * Check if a lifecycle transition is allowed
 */
function isTransitionAllowed(currentStatus, targetStatus) {
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
}

/**
 * Normalize store data from backend to UI-friendly format
 * Handles both snake_case (backend) and camelCase (mock) formats
 */
function normalizeStore(raw) {
    if (!raw) return null;
    const status = raw.status || "active";
    // Ensure status is one of the valid lifecycle statuses
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

/**
 * useStores Hook
 * 
 * Manages store lifecycle state and transitions.
 * This is the ONLY place that knows store lifecycle rules.
 */
export default function useStores() {
    const [stores, setStores] = useState(() => storesMock.map(normalizeStore));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchStores = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const apiStores = await getStores();
            if (Array.isArray(apiStores) && apiStores.length > 0) {
                const normalized = apiStores.map(normalizeStore).filter(Boolean);
                if (normalized.length > 0) {
                    setStores(normalized);
                    setError("");
                } else {
                    // eslint-disable-next-line no-console
                    console.warn("[useStores] Normalization failed, using mock data");
                    setStores(storesMock.map(normalizeStore));
                }
            } else {
                // eslint-disable-next-line no-console
                console.warn("[useStores] Backend returned empty array, using mock data");
                setStores(storesMock.map(normalizeStore));
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[useStores] API call failed, falling back to mock", e);
            const errorMessage =
                e?.response?.status === 404
                    ? "Platform API not available (using mock data)"
                    : e.message || "Failed to load stores";
            setError(errorMessage);
            setStores(storesMock.map(normalizeStore));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    /**
     * Optimistic update helper
     * Updates store status immediately, returns rollback function
     */
    const optimisticUpdate = useCallback((storeId, newStatus) => {
        let previousStore = null;
        setStores((prev) => {
            const updated = prev.map((s) => {
                if (s.id === storeId) {
                    previousStore = { ...s };
                    return { ...s, status: newStatus };
                }
                return s;
            });
            return updated;
        });
        return () => {
            // Rollback function
            if (previousStore) {
                setStores((prev) =>
                    prev.map((s) => (s.id === storeId ? previousStore : s))
                );
            }
        };
    }, []);

    const createStore = useCallback(
        async (payload) => {
            setLoading(true);
            setError("");
            try {
                const created = await apiCreateStore(payload);
                const normalized = normalizeStore(created);
                // New stores start as "provisioning"
                if (!normalized.status) {
                    normalized.status = STORE_STATUSES.PROVISIONING;
                }
                setStores((prev) => [normalized, ...prev]);
                return normalized;
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("[useStores] Failed to create store", e);
                const errorMessage =
                    e?.response?.status === 404
                        ? "Platform API not available. Store creation not persisted."
                        : e?.response?.data?.error ||
                          e?.response?.data?.message ||
                          e.message ||
                          "Failed to create store";
                setError(errorMessage);
                throw e;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const suspendStore = useCallback(
        async (id) => {
            const store = stores.find((s) => s.id === id);
            if (!store) {
                throw new Error("Store not found");
            }

            // Validate transition
            if (!isTransitionAllowed(store.status, STORE_STATUSES.SUSPENDED)) {
                throw new Error(
                    `Cannot suspend store with status "${store.status}". Only active stores can be suspended.`
                );
            }

            // Optimistic update
            const rollback = optimisticUpdate(id, STORE_STATUSES.SUSPENDED);
            setError("");

            try {
                const updated = await apiSuspendStore(id);
                const normalized = normalizeStore(updated);
                setStores((prev) =>
                    prev.map((s) => (s.id === normalized.id ? normalized : s))
                );
                return normalized;
            } catch (e) {
                // Rollback on failure
                rollback();
                // eslint-disable-next-line no-console
                console.error("[useStores] Failed to suspend store", e);
                const errorMessage =
                    e?.response?.status === 404
                        ? "Platform API not available. Suspension not persisted."
                        : e?.response?.data?.error ||
                          e?.response?.data?.message ||
                          e.message ||
                          "Failed to suspend store";
                setError(errorMessage);
                throw e;
            }
        },
        [stores, optimisticUpdate]
    );

    const resumeStore = useCallback(
        async (id) => {
            const store = stores.find((s) => s.id === id);
            if (!store) {
                throw new Error("Store not found");
            }

            // Validate transition
            if (!isTransitionAllowed(store.status, STORE_STATUSES.ACTIVE)) {
                throw new Error(
                    `Cannot resume store with status "${store.status}". Only suspended stores can be resumed.`
                );
            }

            // Optimistic update
            const rollback = optimisticUpdate(id, STORE_STATUSES.ACTIVE);
            setError("");

            try {
                const updated = await apiResumeStore(id);
                const normalized = normalizeStore(updated);
                setStores((prev) =>
                    prev.map((s) => (s.id === normalized.id ? normalized : s))
                );
                return normalized;
            } catch (e) {
                // Rollback on failure
                rollback();
                // eslint-disable-next-line no-console
                console.error("[useStores] Failed to resume store", e);
                const errorMessage =
                    e?.response?.status === 404
                        ? "Platform API not available. Resume not persisted."
                        : e?.response?.data?.error ||
                          e?.response?.data?.message ||
                          e.message ||
                          "Failed to resume store";
                setError(errorMessage);
                throw e;
            }
        },
        [stores, optimisticUpdate]
    );

    const archiveStore = useCallback(
        async (id) => {
            const store = stores.find((s) => s.id === id);
            if (!store) {
                throw new Error("Store not found");
            }

            // Validate transition
            if (!isTransitionAllowed(store.status, STORE_STATUSES.ARCHIVED)) {
                throw new Error(
                    `Cannot archive store with status "${store.status}". Only active or suspended stores can be archived.`
                );
            }

            // Optimistic update
            const rollback = optimisticUpdate(id, STORE_STATUSES.ARCHIVED);
            setError("");

            try {
                const updated = await apiArchiveStore(id);
                const normalized = normalizeStore(updated);
                setStores((prev) =>
                    prev.map((s) => (s.id === normalized.id ? normalized : s))
                );
                return normalized;
            } catch (e) {
                // Rollback on failure
                rollback();
                // eslint-disable-next-line no-console
                console.error("[useStores] Failed to archive store", e);
                const errorMessage =
                    e?.response?.status === 404
                        ? "Platform API not available. Archive not persisted."
                        : e?.response?.data?.error ||
                          e?.response?.data?.message ||
                          e.message ||
                          "Failed to archive store";
                setError(errorMessage);
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
