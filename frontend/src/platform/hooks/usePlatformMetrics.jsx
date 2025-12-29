import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getPlatformMetrics, getStoreGrowthMetrics } from "../api/metrics.api.js";
import useStores from "./useStores.jsx";

/**
 * Calculate trend direction from two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {string} "up" | "down" | "stable"
 */
function calculateTrend(current, previous) {
    if (current === previous) return "stable";
    if (current > previous) return "up";
    return "down";
}

/**
 * Calculate percentage change
 */
function calculateChange(current, previous) {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change * 10) / 10; // Round to 1 decimal
}

/**
 * Normalize platform metrics from backend
 */
function normalizeMetrics(raw, stores) {
    if (!raw) {
        // Fallback to calculated values from stores
        const totalStores = stores.length;
        const activeStores = stores.filter((s) => s.status === "active").length;
        const activeRatio = totalStores > 0 ? (activeStores / totalStores) * 100 : 0;

        return {
            totalStores,
            activeStores,
            activeRatio: Math.round(activeRatio * 10) / 10,
            requestVolume24h: 0,
            averageLatency: 0,
            errorRate: 0,
        };
    }

    const totalStores = raw.totalStores || raw.total_stores || stores.length;
    const activeStores = raw.activeStores || raw.active_stores || stores.filter((s) => s.status === "active").length;
    const activeRatio = totalStores > 0 ? (activeStores / totalStores) * 100 : 0;

    return {
        totalStores,
        activeStores,
        activeRatio: Math.round(activeRatio * 10) / 10,
        requestVolume24h: raw.requestVolume24h || raw.request_volume_24h || raw.requests24h || 0,
        averageLatency: raw.averageLatency || raw.average_latency || raw.avgLatency || 0,
        errorRate: raw.errorRate || raw.error_rate || raw.errorRatePercent || 0,
    };
}

/**
 * Normalize growth metrics
 */
function normalizeGrowth(raw) {
    if (!raw || !raw.dailyGrowth) {
        // Generate mock growth data if backend doesn't provide it
        const today = new Date();
        const dailyGrowth = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dailyGrowth.push({
                date: date.toISOString().split("T")[0],
                count: Math.floor(Math.random() * 5), // Mock: 0-4 new stores per day
            });
        }
        return { dailyGrowth };
    }

    return {
        dailyGrowth: raw.dailyGrowth || raw.daily_growth || [],
    };
}

/**
 * Calculate trends from metrics
 */
function calculateTrends(current, previous) {
    if (!previous) {
        return {
            totalStores: "stable",
            activeRatio: "stable",
            requestVolume: "stable",
            averageLatency: "stable",
            errorRate: "stable",
        };
    }

    return {
        totalStores: calculateTrend(current.totalStores, previous.totalStores),
        activeRatio: calculateTrend(current.activeRatio, previous.activeRatio),
        requestVolume: calculateTrend(current.requestVolume24h, previous.requestVolume24h),
        averageLatency: calculateTrend(current.averageLatency, previous.averageLatency),
        errorRate: calculateTrend(current.errorRate, previous.errorRate),
    };
}

/**
 * usePlatformMetrics Hook
 * 
 * Fetches and processes platform-wide metrics.
 * This is the ONLY place where calculations and trend logic exists.
 */
export default function usePlatformMetrics() {
    const { stores } = useStores();
    const [metrics, setMetrics] = useState(null);
    const [previousMetrics, setPreviousMetrics] = useState(null);
    const [growth, setGrowth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const intervalRef = useRef(null);

    /**
     * Fetch metrics from API
     */
    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            // Fetch metrics and growth in parallel
            const [metricsResult, growthResult] = await Promise.allSettled([
                getPlatformMetrics(),
                getStoreGrowthMetrics(),
            ]);

            // Process metrics
            let rawMetrics = null;
            if (metricsResult.status === "fulfilled") {
                rawMetrics = metricsResult.value;
            } else {
                // eslint-disable-next-line no-console
                console.warn("[usePlatformMetrics] Failed to fetch metrics, using calculated values", metricsResult.reason);
            }

            // Process growth
            let rawGrowth = null;
            if (growthResult.status === "fulfilled") {
                rawGrowth = growthResult.value;
            } else {
                // eslint-disable-next-line no-console
                console.warn("[usePlatformMetrics] Failed to fetch growth, using mock data", growthResult.reason);
            }

            // Normalize metrics (use stores data as fallback)
            const normalized = normalizeMetrics(rawMetrics, stores);
            
            // Store previous metrics for trend calculation before updating
            setMetrics((prev) => {
                if (prev) {
                    setPreviousMetrics(prev);
                }
                return normalized;
            });
            
            setGrowth(normalizeGrowth(rawGrowth));

            // Set error only if both endpoints failed
            if (metricsResult.status === "rejected" && growthResult.status === "rejected") {
                setError("Platform metrics API unavailable. Using calculated values.");
            } else {
                setError(""); // Clear errors if at least one call succeeded
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("[usePlatformMetrics] Unexpected error", e);
            setError(e.message || "Failed to load platform metrics");
            // Use fallback metrics
            setMetrics(normalizeMetrics(null, stores));
            setGrowth(normalizeGrowth(null));
        } finally {
            setLoading(false);
        }
    }, [stores]);

    /**
     * Set up polling every 30 seconds
     */
    useEffect(() => {
        // Initial fetch
        fetchMetrics();

        // Set up interval for polling
        intervalRef.current = setInterval(() => {
            fetchMetrics();
        }, 30000); // 30 seconds

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchMetrics]);

    /**
     * Calculate trends
     */
    const trends = useMemo(() => {
        if (!metrics || !previousMetrics) {
            return {
                totalStores: "stable",
                activeRatio: "stable",
                requestVolume: "stable",
                averageLatency: "stable",
                errorRate: "stable",
            };
        }
        return calculateTrends(metrics, previousMetrics);
    }, [metrics, previousMetrics]);

    /**
     * Calculate percentage changes
     */
    const changes = useMemo(() => {
        if (!metrics || !previousMetrics) {
            return {};
        }
        return {
            totalStores: calculateChange(metrics.totalStores, previousMetrics.totalStores),
            activeRatio: calculateChange(metrics.activeRatio, previousMetrics.activeRatio),
            requestVolume: calculateChange(metrics.requestVolume24h, previousMetrics.requestVolume24h),
            averageLatency: calculateChange(metrics.averageLatency, previousMetrics.averageLatency),
            errorRate: calculateChange(metrics.errorRate, previousMetrics.errorRate),
        };
    }, [metrics, previousMetrics]);

    return {
        metrics: metrics || normalizeMetrics(null, stores),
        growth: growth || normalizeGrowth(null),
        trends,
        changes,
        loading,
        error,
        refresh: fetchMetrics,
    };
}

