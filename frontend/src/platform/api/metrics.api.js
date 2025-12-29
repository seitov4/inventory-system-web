import platformClient from "./platformClient.js";

/**
 * Platform Metrics API Module
 * Pure HTTP request functions - no state, no React, no hooks
 */

function unwrap(response) {
    return response.data?.data || response.data || {};
}

/**
 * Get platform metrics summary
 * @returns {Promise<Object>} Platform-wide metrics
 */
export async function getPlatformMetrics() {
    const res = await platformClient.get("/metrics/summary");
    return unwrap(res);
}

/**
 * Get store growth metrics
 * @returns {Promise<Object>} Growth trend data (last 7 days)
 */
export async function getStoreGrowthMetrics() {
    const res = await platformClient.get("/metrics/growth");
    return unwrap(res);
}

