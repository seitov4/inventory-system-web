import { useCallback, useEffect, useRef, useState } from "react";
import { getBackendHealth, getDatabaseHealth, getSystemHealth } from "../api/health.api.js";
import {
    evaluateBackendStatus,
    evaluateDatabaseStatus,
    evaluateSystemStatus,
    ERROR_SEVERITY,
} from "../observability/thresholds.js";

/**
 * Normalize error data from backend
 */
function normalizeErrors(rawErrors) {
    if (!rawErrors) {
        return {
            errorCountLast1h: 0,
            errorCountLast24h: 0,
            lastError: null,
        };
    }

    const lastError = rawErrors.lastError
        ? {
              message: rawErrors.lastError.message || rawErrors.lastError.msg || "Unknown error",
              timestamp: rawErrors.lastError.timestamp || rawErrors.lastError.time || null,
              source: rawErrors.lastError.source || rawErrors.lastError.service || "unknown",
              severity:
                  rawErrors.lastError.severity ||
                  rawErrors.lastError.level ||
                  ERROR_SEVERITY.ERROR,
          }
        : null;

    return {
        errorCountLast1h: rawErrors.errorCountLast1h || rawErrors.errors_1h || 0,
        errorCountLast24h: rawErrors.errorCountLast24h || rawErrors.errors_24h || 0,
        lastError,
    };
}

/**
 * Normalize backend health data with threshold evaluation
 */
function normalizeBackendHealth(raw) {
    if (!raw) {
        return {
            status: "DOWN",
            statusLabel: "DOWN",
            latencyMs: 0,
            latencyBudgetMs: 300,
            uptime: 0,
            description: "Backend service unavailable",
            reason: "Backend service unavailable",
            errors: normalizeErrors(null),
        };
    }

    // Evaluate status from thresholds
    const evaluation = evaluateBackendStatus(raw);

    return {
        status: evaluation.status,
        statusLabel: evaluation.status,
        latencyMs: raw.latencyMs || raw.latency_ms || raw.latency || 0,
        latencyBudgetMs: raw.latencyBudgetMs || raw.latency_budget_ms || raw.latency_budget || 300,
        uptime: raw.uptime || raw.uptime_percent || 0,
        description: evaluation.reason, // Use threshold-derived reason
        reason: evaluation.reason,
        errors: normalizeErrors(raw.errors || raw.errorData),
    };
}

/**
 * Normalize database health data with threshold evaluation
 */
function normalizeDatabaseHealth(raw) {
    if (!raw) {
        return {
            status: "DOWN",
            statusLabel: "DOWN",
            latencyMs: 0,
            latencyBudgetMs: 250,
            uptime: 0,
            description: "Database unavailable",
            reason: "Database unavailable",
            errors: normalizeErrors(null),
        };
    }

    // Evaluate status from thresholds
    const evaluation = evaluateDatabaseStatus(raw);

    return {
        status: evaluation.status,
        statusLabel: evaluation.status,
        latencyMs: raw.latencyMs || raw.latency_ms || raw.latency || 0,
        latencyBudgetMs: raw.latencyBudgetMs || raw.latency_budget_ms || raw.latency_budget || 250,
        uptime: raw.uptime || raw.uptime_percent || 0,
        replicaLag: raw.replicaLag || raw.replica_lag || raw.replicaLagSeconds || 0,
        description: evaluation.reason, // Use threshold-derived reason
        reason: evaluation.reason,
        errors: normalizeErrors(raw.errors || raw.errorData),
    };
}

/**
 * Normalize system health data with threshold evaluation
 */
function normalizeSystemHealth(raw) {
    if (!raw) {
        return {
            status: "DOWN",
            statusLabel: "DOWN",
            description: "System metrics unavailable",
            reason: "System metrics unavailable",
            errors: normalizeErrors(null),
        };
    }

    // Evaluate status from thresholds
    const evaluation = evaluateSystemStatus(raw);

    return {
        status: evaluation.status,
        statusLabel: evaluation.status,
        cpu: raw.cpu || raw.cpuPercent || 0,
        memory: raw.memory || raw.memoryPercent || 0,
        queueDelay: raw.queueDelay || raw.queue_delay_seconds || 0,
        description: evaluation.reason,
        reason: evaluation.reason,
        errors: normalizeErrors(raw.errors || raw.errorData),
    };
}

/**
 * Normalize servers array
 */
function normalizeServers(rawServers) {
    if (!Array.isArray(rawServers) || rawServers.length === 0) {
        return [];
    }

    return rawServers.map((srv) => {
        const evaluation = evaluateSystemStatus(srv);
        return {
            id: srv.id || srv.server_id || `server-${Math.random()}`,
            env: srv.env || srv.environment || "unknown",
            region: srv.region || srv.region_name || "unknown",
            status: evaluation.status,
            statusLabel: evaluation.status,
            reason: evaluation.reason,
        };
    });
}

/**
 * usePlatformHealth Hook
 * 
 * Aggregates health data from backend, database, and system endpoints.
 * Applies thresholds to derive status (not just pass through backend status).
 * Implements polling every 5 seconds for real-time monitoring.
 * Handles partial failures gracefully.
 */
export default function usePlatformHealth() {
    const [health, setHealth] = useState({
        backend: normalizeBackendHealth(null),
        db: normalizeDatabaseHealth(null),
        system: normalizeSystemHealth(null),
        servers: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const intervalRef = useRef(null);

    /**
     * Fetch all health endpoints in parallel
     * Handles partial failures - one endpoint down doesn't break the whole UI
     */
    const fetchHealth = useCallback(async () => {
        setLoading(true);
        const errors = [];

        try {
            // Fetch all endpoints in parallel
            const [backendResult, databaseResult, systemResult] = await Promise.allSettled([
                getBackendHealth(),
                getDatabaseHealth(),
                getSystemHealth(),
            ]);

            // Process backend health
            let backend = null;
            if (backendResult.status === "fulfilled") {
                backend = backendResult.value;
            } else {
                errors.push(`Backend: ${backendResult.reason?.message || "Unavailable"}`);
            }

            // Process database health
            let database = null;
            if (databaseResult.status === "fulfilled") {
                database = databaseResult.value;
            } else {
                errors.push(`Database: ${databaseResult.reason?.message || "Unavailable"}`);
            }

            // Process system health (may contain aggregated data or servers)
            let system = null;
            let servers = null;
            if (systemResult.status === "fulfilled") {
                system = systemResult.value;
                servers = system.servers || system.server_list;
            } else {
                errors.push(`System: ${systemResult.reason?.message || "Unavailable"}`);
            }

            // Aggregate results
            // Use system data if available, otherwise use individual endpoints
            const aggregatedBackend = system?.backend || backend;
            const aggregatedDatabase = system?.db || system?.database || database;
            const aggregatedSystem = system;

            setHealth({
                backend: normalizeBackendHealth(aggregatedBackend),
                db: normalizeDatabaseHealth(aggregatedDatabase),
                system: normalizeSystemHealth(aggregatedSystem),
                servers: normalizeServers(servers || system?.servers || []),
            });

            // Set error only if ALL endpoints failed
            if (errors.length === 3) {
                setError(`All health endpoints unavailable: ${errors.join(", ")}`);
            } else if (errors.length > 0) {
                // Partial failure - show warning but don't block UI
                setError(`Some endpoints unavailable: ${errors.join(", ")}`);
            } else {
                setError(""); // All endpoints succeeded
            }
        } catch (e) {
            // Unexpected error
            // eslint-disable-next-line no-console
            console.error("[usePlatformHealth] Unexpected error", e);
            setError(e.message || "Failed to load platform health");
            // Set all to DOWN state
            setHealth({
                backend: normalizeBackendHealth(null),
                db: normalizeDatabaseHealth(null),
                system: normalizeSystemHealth(null),
                servers: [],
            });
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Set up polling every 5 seconds
     */
    useEffect(() => {
        // Initial fetch
        fetchHealth();

        // Set up interval for polling
        intervalRef.current = setInterval(() => {
            fetchHealth();
        }, 5000); // 5 seconds

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchHealth]);

    return {
        health,
        loading,
        error,
        fetchHealth, // Manual refresh function
    };
}
