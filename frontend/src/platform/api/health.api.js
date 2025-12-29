import platformClient from "./platformClient.js";

/**
 * Health API Module
 * Pure HTTP request functions - no state, no React, no hooks
 */

function unwrap(response) {
    return response.data?.data || response.data || {};
}

/**
 * Get backend health status
 * @returns {Promise<Object>} Backend health data
 */
export async function getBackendHealth() {
    const res = await platformClient.get("/health/backend");
    return unwrap(res);
}

/**
 * Get database health status
 * @returns {Promise<Object>} Database health data
 */
export async function getDatabaseHealth() {
    const res = await platformClient.get("/health/database");
    return unwrap(res);
}

/**
 * Get system health status (aggregated)
 * @returns {Promise<Object>} System health data
 */
export async function getSystemHealth() {
    const res = await platformClient.get("/health/system");
    return unwrap(res);
}


