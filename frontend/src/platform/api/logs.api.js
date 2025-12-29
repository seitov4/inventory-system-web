import platformClient from "./platformClient.js";

/**
 * Platform Logs API Module
 * Pure HTTP request functions - no state, no React, no hooks
 */

function unwrap(response) {
    return response.data?.data || response.data || [];
}

/**
 * Get platform logs with optional filters
 * @param {Object} params - Filter parameters
 * @param {string} params.severity - Filter by severity (info, warn, error)
 * @param {string} params.source - Filter by source (platform-auth, api, db, worker, scheduler)
 * @param {string} params.environment - Filter by environment (production, staging, local)
 * @returns {Promise<Array>} Array of log events
 */
export async function getPlatformLogs(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.severity && params.severity !== "all") {
        queryParams.append("severity", params.severity);
    }
    if (params.source && params.source !== "all") {
        queryParams.append("source", params.source);
    }
    if (params.environment && params.environment !== "all") {
        queryParams.append("environment", params.environment);
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/logs?${queryString}` : "/logs";
    
    const res = await platformClient.get(url);
    return unwrap(res);
}

/**
 * Get activity feed (for dashboard widget)
 * @returns {Promise<Array>} Array of recent activity events
 */
export async function getActivityFeed() {
    const res = await platformClient.get("/activity");
    return unwrap(res);
}
