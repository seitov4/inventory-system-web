import { useCallback, useEffect, useMemo, useState } from "react";
import { getPlatformLogs, getActivityFeed } from "../api/logs.api.js";

/**
 * Normalize log entry from backend to UI-friendly format
 * Handles backend response structure.
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
    const [logs, setLogs] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [apiLogs, apiActivity] = await Promise.all([
                getPlatformLogs(),
                getActivityFeed(),
            ]);

            const normalizedLogs = Array.isArray(apiLogs)
                ? apiLogs.map(normalizeLog).filter(Boolean)
                : [];
            const normalizedActivity = Array.isArray(apiActivity)
                ? apiActivity.map(normalizeLog).filter(Boolean)
                : [];

            setLogs(normalizedLogs);
            setActivity(normalizedActivity);
            setError("");
        } catch (e) {
            setError(e.message || "Failed to load logs");
            setLogs([]);
            setActivity([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const infoCount = useMemo(() => logs.filter((l) => l.severity === "info").length, [logs]);
    const warnCount = useMemo(() => logs.filter((l) => l.severity === "warn").length, [logs]);
    const errorCount = useMemo(() => logs.filter((l) => l.severity === "error").length, [logs]);

    return {
        logs,
        activity,
        loading,
        error,
        fetchLogs,
        stats: { infoCount, warnCount, errorCount },
    };
}
