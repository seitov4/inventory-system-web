import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStoreDetails, getStoreHealth, getStoreActivity } from "../api/stores.api.js";

/**
 * Normalize store health data
 */
function normalizeHealth(raw) {
    if (!raw) {
        return {
            status: "DOWN",
            statusLabel: "DOWN",
            backend: { status: "DOWN", latency: 0 },
            database: { status: "DOWN", latency: 0 },
            lastSync: null,
        };
    }

    return {
        status: raw.status || raw.health_status || "UNKNOWN",
        statusLabel: raw.statusLabel || raw.status_label || raw.status || "UNKNOWN",
        backend: {
            status: raw.backend?.status || raw.api?.status || "UNKNOWN",
            latency: raw.backend?.latency || raw.api?.latency_ms || 0,
        },
        database: {
            status: raw.database?.status || raw.db?.status || "UNKNOWN",
            latency: raw.database?.latency || raw.db?.latency_ms || 0,
        },
        lastSync: raw.lastSync || raw.last_sync || raw.lastSyncAt || null,
    };
}

/**
 * Normalize store stats
 */
function normalizeStats(raw) {
    if (!raw) {
        return {
            lastActivity: null,
            userCount: 0,
            requests24h: 0,
            errorCount24h: 0,
        };
    }

    return {
        lastActivity: raw.lastActivity || raw.last_activity || raw.lastActiveAt || null,
        userCount: raw.userCount || raw.user_count || raw.users || 0,
        requests24h: raw.requests24h || raw.requests_24h || raw.requestsLast24h || 0,
        errorCount24h: raw.errorCount24h || raw.error_count_24h || raw.errorsLast24h || 0,
    };
}

/**
 * Normalize activity events
 */
function normalizeActivity(rawEvents) {
    if (!Array.isArray(rawEvents)) return [];

    return rawEvents.map((event) => ({
        id: event.id || event.event_id || `event-${Math.random()}`,
        timestamp: event.timestamp || event.created_at || event.time || new Date().toISOString(),
        severity: (event.severity || event.level || "info").toLowerCase(),
        type: event.type || event.event_type || "unknown",
        message: event.message || event.msg || event.text || "",
        source: event.source || event.service || "unknown",
    }));
}

/**
 * useStoreOverview Hook
 * 
 * Fetches and aggregates store-level observability data.
 * READ-ONLY only - no write operations.
 */
export default function useStoreOverview(storeId) {
    const [store, setStore] = useState(null);
    const [health, setHealth] = useState(null);
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const intervalRef = useRef(null);

    /**
     * Fetch all store observability data
     */
    const fetchStoreOverview = useCallback(async () => {
        if (!storeId) {
            setError("Store ID is required");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Fetch all endpoints in parallel
            const [detailsResult, healthResult, activityResult] = await Promise.allSettled([
                getStoreDetails(storeId),
                getStoreHealth(storeId),
                getStoreActivity(storeId),
            ]);

            // Process store details
            if (detailsResult.status === "fulfilled") {
                setStore(detailsResult.value);
                // Extract stats from details if available
                if (detailsResult.value.stats) {
                    setStats(normalizeStats(detailsResult.value.stats));
                }
            } else {
                // eslint-disable-next-line no-console
                console.warn("[useStoreOverview] Failed to fetch store details", detailsResult.reason);
            }

            // Process health
            if (healthResult.status === "fulfilled") {
                setHealth(normalizeHealth(healthResult.value));
                // Extract stats from health if available
                if (healthResult.value.stats) {
                    setStats(normalizeStats(healthResult.value.stats));
                }
            } else {
                // eslint-disable-next-line no-console
                console.warn("[useStoreOverview] Failed to fetch store health", healthResult.reason);
                setHealth(normalizeHealth(null));
            }

            // Process activity
            if (activityResult.status === "fulfilled") {
                const normalized = normalizeActivity(activityResult.value);
                // Sort by timestamp descending (most recent first)
                normalized.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                setActivity(normalized);
            } else {
                // eslint-disable-next-line no-console
                console.warn("[useStoreOverview] Failed to fetch store activity", activityResult.reason);
                setActivity([]);
            }

            // Set error only if ALL endpoints failed
            if (
                detailsResult.status === "rejected" &&
                healthResult.status === "rejected" &&
                activityResult.status === "rejected"
            ) {
                setError("Failed to load store overview. Platform API may be unavailable.");
            } else {
                setError(""); // Clear errors if at least one call succeeded
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("[useStoreOverview] Unexpected error", e);
            setError(e.message || "Failed to load store overview");
            setHealth(normalizeHealth(null));
            setStats(normalizeStats(null));
            setActivity([]);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    /**
     * Set up polling every 15 seconds
     */
    useEffect(() => {
        if (!storeId) return;

        // Initial fetch
        fetchStoreOverview();

        // Set up interval for polling
        intervalRef.current = setInterval(() => {
            fetchStoreOverview();
        }, 15000); // 15 seconds

        // Cleanup on unmount or storeId change
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [storeId, fetchStoreOverview]);

    /**
     * Manual refresh
     */
    const refresh = useCallback(() => {
        fetchStoreOverview();
    }, [fetchStoreOverview]);

    return {
        store,
        health: health || normalizeHealth(null),
        stats: stats || normalizeStats(null),
        activity,
        loading,
        error,
        refresh,
    };
}

