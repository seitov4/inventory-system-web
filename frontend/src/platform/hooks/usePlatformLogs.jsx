import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPlatformLogs } from "../api/logs.api.js";
import { calculateTimeAgo } from "../utils/logFormatters.js";

/**
 * Normalize log entry from backend to UI-friendly format
 */
function normalizeLog(raw) {
    if (!raw) return null;

    return {
        id: raw.id || raw.log_id || raw.event_id || `log-${Math.random()}`,
        timestamp: raw.timestamp || raw.created_at || raw.time || new Date().toISOString(),
        timeAgo: raw.timeAgo || raw.time_ago || calculateTimeAgo(raw.timestamp || raw.created_at),
        severity: (raw.severity || raw.level || "info").toLowerCase(),
        source: raw.source || raw.service || raw.origin || "unknown",
        message: raw.message || raw.msg || raw.text || "",
        store: raw.store || raw.store_slug || null,
        environment: raw.environment || raw.env || null,
    };
}

/**
 * usePlatformLogs Hook
 *
 * Manages platform-level logs and events.
 * Supports filtering, polling, and normalization.
 * This is the ONLY place where log logic exists.
 */
export default function usePlatformLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        severity: "all",
        source: "all",
        environment: "all",
    });

    const intervalRef = useRef(null);

    /**
     * Fetch logs from API with current filters
     */
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const apiLogs = await getPlatformLogs(filters);

            const normalized = Array.isArray(apiLogs)
                ? apiLogs.map(normalizeLog).filter(Boolean)
                : [];
            normalized.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setLogs(normalized);
            setError("");
        } catch (e) {
            const errorMessage = e.message || "Failed to load logs";
            setError(errorMessage);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    /**
     * Update a single filter
     */
    const updateFilter = useCallback((key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    /**
     * Clear all filters
     */
    const clearFilters = useCallback(() => {
        setFilters({
            severity: "all",
            source: "all",
            environment: "all",
        });
    }, []);

    /**
     * Manual refresh
     */
    const refreshLogs = useCallback(() => {
        fetchLogs();
    }, [fetchLogs]);

    /**
     * Apply client-side filtering
     */
    const filteredLogs = useMemo(() => {
        let result = [...logs];

        // Filter by severity
        if (filters.severity !== "all") {
            result = result.filter((log) => log.severity === filters.severity);
        }

        // Filter by source
        if (filters.source !== "all") {
            result = result.filter((log) => {
                const source = String(log.source).toLowerCase();
                return source.includes(filters.source.toLowerCase());
            });
        }

        // Filter by environment
        if (filters.environment !== "all") {
            result = result.filter((log) => {
                const env = String(log.environment || "").toLowerCase();
                return env === filters.environment.toLowerCase();
            });
        }

        return result;
    }, [logs, filters]);

    /**
     * Set up polling every 10 seconds
     */
    useEffect(() => {
        // Initial fetch
        fetchLogs();

        // Set up interval for polling
        intervalRef.current = setInterval(() => {
            fetchLogs();
        }, 10000); // 10 seconds

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchLogs]);

    // Stats
    const stats = useMemo(() => {
        return {
            total: logs.length,
            info: logs.filter((l) => l.severity === "info").length,
            warn: logs.filter((l) => l.severity === "warn").length,
            error: logs.filter((l) => l.severity === "error").length,
        };
    }, [logs]);

    return {
        logs: filteredLogs,
        allLogs: logs, // Unfiltered for stats
        loading,
        error,
        filters,
        setFilters: updateFilter,
        clearFilters,
        refreshLogs,
        stats,
    };
}
