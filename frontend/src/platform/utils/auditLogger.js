/**
 * Platform Access Audit Logger
 * 
 * Frontend-level event tracking for platform access events.
 * Stores entries in localStorage for persistence across sessions.
 * 
 * TODO: Replace with backend audit API when available
 */

const AUDIT_STORAGE_KEY = "platform_audit_logs";
const MAX_AUDIT_ENTRIES = 100; // Keep last 100 entries

/**
 * Get all audit logs from storage
 */
export function getAuditLogs() {
    try {
        const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (e) {
        console.error("[AuditLogger] Failed to read audit logs", e);
        return [];
    }
}

/**
 * Add a new audit log entry
 */
export function logAuditEvent(event) {
    try {
        const logs = getAuditLogs();
        const entry = {
            type: event.type, // "AUTH_LOGIN" | "AUTH_LOGOUT" | "AUTH_FAILED"
            email: event.email || "unknown",
            timestamp: new Date().toISOString(),
            source: "platform-auth",
            ...event.metadata, // Allow additional metadata
        };

        // Add to beginning of array (newest first)
        logs.unshift(entry);

        // Keep only last MAX_AUDIT_ENTRIES
        const trimmed = logs.slice(0, MAX_AUDIT_ENTRIES);

        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
        return entry;
    } catch (e) {
        console.error("[AuditLogger] Failed to write audit log", e);
        return null;
    }
}

/**
 * Clear all audit logs
 */
export function clearAuditLogs() {
    try {
        localStorage.removeItem(AUDIT_STORAGE_KEY);
    } catch (e) {
        console.error("[AuditLogger] Failed to clear audit logs", e);
    }
}

/**
 * Get audit logs filtered by type
 */
export function getAuditLogsByType(type) {
    const logs = getAuditLogs();
    return logs.filter((log) => log.type === type);
}

