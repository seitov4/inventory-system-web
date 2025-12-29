import { useCallback, useEffect, useMemo, useState } from "react";
import { getPlatformLogs, getActivityFeed } from "../api/logs.api.js";
import logsMock from "../mock/logs.mock.js";

/**
 * Normalize log entry from backend to UI-friendly format
 * Handles both backend response structure and mock structure
 */
function normalizeLog(raw) {
    if (!raw) return null;
    
    // Calculate timeAgo if not provided
    const calculateTimeAgo = (timestamp) => {
        if (!timestamp) return "unknown";
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 1) return "just now";
            if (diffMins < 60) return `${diffMins} min ago`;
            if (diffHours < 24) return `${diffHours} h ago`;
            return `${diffDays} days ago`;
        } catch {
            return "unknown";
        }
    };

    return {
        id: raw.id || raw.log_id || raw.event_id,
        timestamp: raw.timestamp || raw.created_at || raw.time || new Date().toISOString(),
        timeAgo: raw.timeAgo || raw.time_ago || calculateTimeAgo(raw.timestamp || raw.created_at),
        severity: (raw.severity || raw.level || "info").toLowerCase(),
        source: raw.source || raw.service || raw.origin || "unknown",
        message: raw.message || raw.msg || raw.text || "",
    };
}

export default function useLogs() {
    const [logs, setLogs] = useState(() => logsMock.map(normalizeLog));
    const [activity, setActivity] = useState(() => logsMock.map(normalizeLog));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            // Fetch logs and activity in parallel
            const [apiLogs, apiActivity] = await Promise.all([
                getPlatformLogs().catch((e) => {
                    // eslint-disable-next-line no-console
                    console.warn("[useLogs] Failed to fetch logs", e);
                    return null;
                }),
                getActivityFeed().catch((e) => {
                    // eslint-disable-next-line no-console
                    console.warn("[useLogs] Failed to fetch activity", e);
                    return null;
                }),
            ]);

            // Process logs
            if (apiLogs && Array.isArray(apiLogs) && apiLogs.length > 0) {
                const normalizedLogs = apiLogs.map(normalizeLog).filter(Boolean);
                if (normalizedLogs.length > 0) {
                    setLogs(normalizedLogs);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn("[useLogs] Backend returned logs but normalization failed, using mock");
                    setLogs(logsMock.map(normalizeLog));
                }
            } else {
                // eslint-disable-next-line no-console
                console.warn("[useLogs] Backend returned empty logs, using mock");
                setLogs(logsMock.map(normalizeLog));
            }

            // Process activity
            if (apiActivity && Array.isArray(apiActivity) && apiActivity.length > 0) {
                const normalizedActivity = apiActivity.map(normalizeLog).filter(Boolean);
                if (normalizedActivity.length > 0) {
                    setActivity(normalizedActivity);
                } else {
                    // eslint-disable-next-line no-console
                    console.warn("[useLogs] Backend returned activity but normalization failed, using mock");
                    setActivity(logsMock.map(normalizeLog));
                }
            } else {
                // eslint-disable-next-line no-console
                console.warn("[useLogs] Backend returned empty activity, using mock");
                setActivity(logsMock.map(normalizeLog));
            }

            // Set error only if both calls failed
            if (!apiLogs && !apiActivity) {
                const errorMessage = "Platform API not available (using mock data)";
                setError(errorMessage);
            } else {
                setError(""); // Clear errors if at least one call succeeded
            }
        } catch (e) {
            // Fallback to mock on any unexpected error
            // eslint-disable-next-line no-console
            console.error("[useLogs] Unexpected error, falling back to mock", e);
            setError(e.message || "Failed to load logs");
            setLogs(logsMock.map(normalizeLog));
            setActivity(logsMock.map(normalizeLog));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const infoCount = useMemo(
        () => logs.filter((l) => l.severity === "info").length,
        [logs]
    );
    const warnCount = useMemo(
        () => logs.filter((l) => l.severity === "warn").length,
        [logs]
    );
    const errorCount = useMemo(
        () => logs.filter((l) => l.severity === "error").length,
        [logs]
    );

    return {
        logs,
        activity,
        loading,
        error,
        fetchLogs,
        stats: { infoCount, warnCount, errorCount },
    };
}


