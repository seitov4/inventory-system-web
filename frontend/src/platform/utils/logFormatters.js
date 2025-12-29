/**
 * Log Formatters Utility
 * 
 * Pure functions for formatting log data for UI display.
 * No React, no state, no side effects.
 */

/**
 * Format timestamp to human-readable format
 */
export function formatTimestamp(isoString) {
    if (!isoString) return "unknown";
    try {
        const date = new Date(isoString);
        return date.toLocaleString();
    } catch {
        return isoString;
    }
}

/**
 * Calculate time ago from timestamp
 */
export function calculateTimeAgo(timestamp) {
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
}

/**
 * Get icon/emoji for severity
 */
export function getSeverityIcon(severity) {
    const normalized = String(severity).toUpperCase();
    switch (normalized) {
        case "ERROR":
            return "🔴";
        case "WARN":
        case "WARNING":
            return "🟡";
        case "INFO":
            return "ℹ️";
        default:
            return "•";
    }
}

/**
 * Get icon/emoji for source
 */
export function getSourceIcon(source) {
    const normalized = String(source).toLowerCase();
    if (normalized.includes("auth")) return "🔐";
    if (normalized.includes("api")) return "🌐";
    if (normalized.includes("db") || normalized.includes("database")) return "💾";
    if (normalized.includes("worker")) return "⚙️";
    if (normalized.includes("scheduler")) return "⏰";
    return "📋";
}

/**
 * Format source name for display
 */
export function formatSource(source) {
    if (!source) return "unknown";
    const normalized = String(source).toLowerCase();
    if (normalized.includes("platform-auth")) return "Platform Auth";
    if (normalized.includes("api")) return "API Gateway";
    if (normalized.includes("db") || normalized.includes("database")) return "Database";
    if (normalized.includes("worker")) return "Background Worker";
    if (normalized.includes("scheduler")) return "Scheduler";
    return source.charAt(0).toUpperCase() + source.slice(1);
}

/**
 * Format environment for display
 */
export function formatEnvironment(env) {
    if (!env) return "unknown";
    const normalized = String(env).toLowerCase();
    if (normalized === "production") return "Production";
    if (normalized === "staging") return "Staging";
    if (normalized === "local") return "Local";
    return env.charAt(0).toUpperCase() + env.slice(1);
}

