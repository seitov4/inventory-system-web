/**
 * Platform Observability Thresholds
 * 
 * Centralized threshold configuration for deriving health status from metrics.
 * Status colors are DERIVED from these thresholds, not hardcoded in UI.
 * 
 * Pure constants - no React, no state, no side effects.
 */

/**
 * Backend health thresholds
 */
export const BACKEND_THRESHOLDS = {
    // Latency thresholds (ms)
    LATENCY_WARN: 300,
    LATENCY_DOWN: 800,
    
    // Uptime thresholds (%)
    UPTIME_WARN: 99.0,
    UPTIME_DOWN: 95.0,
};

/**
 * Database health thresholds
 */
export const DATABASE_THRESHOLDS = {
    // Latency thresholds (ms)
    LATENCY_WARN: 250,
    LATENCY_DOWN: 500,
    
    // Replica lag thresholds (seconds)
    REPLICA_LAG_WARN: 100,
    REPLICA_LAG_DOWN: 300,
    
    // Uptime thresholds (%)
    UPTIME_WARN: 99.0,
    UPTIME_DOWN: 95.0,
};

/**
 * System/Worker health thresholds
 */
export const SYSTEM_THRESHOLDS = {
    // CPU usage thresholds (%)
    CPU_WARN: 75,
    CPU_CRITICAL: 90,
    
    // Memory usage thresholds (%)
    MEMORY_WARN: 80,
    MEMORY_CRITICAL: 95,
    
    // Worker queue delay thresholds (seconds)
    QUEUE_DELAY_WARN: 60,
    QUEUE_DELAY_CRITICAL: 300,
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
    INFO: "INFO",
    WARN: "WARN",
    ERROR: "ERROR",
    CRITICAL: "CRITICAL",
};

/**
 * Evaluate backend status from metrics
 * @param {Object} metrics - Backend metrics
 * @returns {Object} { status: "OK"|"WARN"|"DOWN", reason: string }
 */
export function evaluateBackendStatus(metrics) {
    if (!metrics) {
        return { status: "DOWN", reason: "Backend service unavailable" };
    }

    const latency = metrics.latencyMs || metrics.latency_ms || metrics.latency || 0;
    const uptime = metrics.uptime || metrics.uptime_percent || 100;

    // Check latency thresholds
    if (latency >= BACKEND_THRESHOLDS.LATENCY_DOWN) {
        return {
            status: "DOWN",
            reason: `API latency exceeded ${BACKEND_THRESHOLDS.LATENCY_DOWN}ms threshold (${latency}ms)`,
        };
    }
    if (latency >= BACKEND_THRESHOLDS.LATENCY_WARN) {
        return {
            status: "WARN",
            reason: `API latency spike detected (${latency}ms, threshold: ${BACKEND_THRESHOLDS.LATENCY_WARN}ms)`,
        };
    }

    // Check uptime thresholds
    if (uptime < BACKEND_THRESHOLDS.UPTIME_DOWN) {
        return {
            status: "DOWN",
            reason: `Uptime below ${BACKEND_THRESHOLDS.UPTIME_DOWN}% threshold (${uptime}%)`,
        };
    }
    if (uptime < BACKEND_THRESHOLDS.UPTIME_WARN) {
        return {
            status: "WARN",
            reason: `Uptime degraded (${uptime}%, threshold: ${BACKEND_THRESHOLDS.UPTIME_WARN}%)`,
        };
    }

    return { status: "OK", reason: "All metrics within normal range" };
}

/**
 * Evaluate database status from metrics
 * @param {Object} metrics - Database metrics
 * @returns {Object} { status: "OK"|"WARN"|"DOWN", reason: string }
 */
export function evaluateDatabaseStatus(metrics) {
    if (!metrics) {
        return { status: "DOWN", reason: "Database unavailable" };
    }

    const latency = metrics.latencyMs || metrics.latency_ms || metrics.latency || 0;
    const replicaLag = metrics.replicaLag || metrics.replica_lag || metrics.replicaLagSeconds || 0;
    const uptime = metrics.uptime || metrics.uptime_percent || 100;

    // Check replica lag thresholds
    if (replicaLag >= DATABASE_THRESHOLDS.REPLICA_LAG_DOWN) {
        return {
            status: "DOWN",
            reason: `Replica lag exceeded ${DATABASE_THRESHOLDS.REPLICA_LAG_DOWN}s threshold (${replicaLag}s)`,
        };
    }
    if (replicaLag >= DATABASE_THRESHOLDS.REPLICA_LAG_WARN) {
        return {
            status: "WARN",
            reason: `Replica lag high (${replicaLag}s, threshold: ${DATABASE_THRESHOLDS.REPLICA_LAG_WARN}s)`,
        };
    }

    // Check latency thresholds
    if (latency >= DATABASE_THRESHOLDS.LATENCY_DOWN) {
        return {
            status: "DOWN",
            reason: `Database latency exceeded ${DATABASE_THRESHOLDS.LATENCY_DOWN}ms threshold (${latency}ms)`,
        };
    }
    if (latency >= DATABASE_THRESHOLDS.LATENCY_WARN) {
        return {
            status: "WARN",
            reason: `Database latency elevated (${latency}ms, threshold: ${DATABASE_THRESHOLDS.LATENCY_WARN}ms)`,
        };
    }

    // Check uptime thresholds
    if (uptime < DATABASE_THRESHOLDS.UPTIME_DOWN) {
        return {
            status: "DOWN",
            reason: `Uptime below ${DATABASE_THRESHOLDS.UPTIME_DOWN}% threshold (${uptime}%)`,
        };
    }
    if (uptime < DATABASE_THRESHOLDS.UPTIME_WARN) {
        return {
            status: "WARN",
            reason: `Uptime degraded (${uptime}%, threshold: ${DATABASE_THRESHOLDS.UPTIME_WARN}%)`,
        };
    }

    return { status: "OK", reason: "All metrics within normal range" };
}

/**
 * Evaluate system/worker status from metrics
 * @param {Object} metrics - System metrics
 * @returns {Object} { status: "OK"|"WARN"|"DOWN", reason: string }
 */
export function evaluateSystemStatus(metrics) {
    if (!metrics) {
        return { status: "DOWN", reason: "System metrics unavailable" };
    }

    const cpu = metrics.cpu || metrics.cpuPercent || 0;
    const memory = metrics.memory || metrics.memoryPercent || 0;
    const queueDelay = metrics.queueDelay || metrics.queue_delay_seconds || 0;

    // Check CPU thresholds
    if (cpu >= SYSTEM_THRESHOLDS.CPU_CRITICAL) {
        return {
            status: "DOWN",
            reason: `CPU usage critical (${cpu}%, threshold: ${SYSTEM_THRESHOLDS.CPU_CRITICAL}%)`,
        };
    }
    if (cpu >= SYSTEM_THRESHOLDS.CPU_WARN) {
        return {
            status: "WARN",
            reason: `CPU usage elevated (${cpu}%, threshold: ${SYSTEM_THRESHOLDS.CPU_WARN}%)`,
        };
    }

    // Check memory thresholds
    if (memory >= SYSTEM_THRESHOLDS.MEMORY_CRITICAL) {
        return {
            status: "DOWN",
            reason: `Memory usage critical (${memory}%, threshold: ${SYSTEM_THRESHOLDS.MEMORY_CRITICAL}%)`,
        };
    }
    if (memory >= SYSTEM_THRESHOLDS.MEMORY_WARN) {
        return {
            status: "WARN",
            reason: `Memory usage elevated (${memory}%, threshold: ${SYSTEM_THRESHOLDS.MEMORY_WARN}%)`,
        };
    }

    // Check queue delay thresholds
    if (queueDelay >= SYSTEM_THRESHOLDS.QUEUE_DELAY_CRITICAL) {
        return {
            status: "DOWN",
            reason: `Background worker queue delayed (${queueDelay}s, threshold: ${SYSTEM_THRESHOLDS.QUEUE_DELAY_CRITICAL}s)`,
        };
    }
    if (queueDelay >= SYSTEM_THRESHOLDS.QUEUE_DELAY_WARN) {
        return {
            status: "WARN",
            reason: `Background worker queue delay detected (${queueDelay}s, threshold: ${SYSTEM_THRESHOLDS.QUEUE_DELAY_WARN}s)`,
        };
    }

    return { status: "OK", reason: "All metrics within normal range" };
}

