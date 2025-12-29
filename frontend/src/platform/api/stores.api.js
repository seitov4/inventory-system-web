import platformClient from "./platformClient.js";

/**
 * Stores API Module
 * Pure HTTP request functions for store lifecycle management
 * No state, no React, no hooks
 */

function unwrap(response) {
    return response.data?.data || response.data || [];
}

/**
 * Get all stores
 * @returns {Promise<Array>} List of stores
 */
export async function getStores() {
    const res = await platformClient.get("/stores");
    return unwrap(res);
}

/**
 * Create a new store
 * @param {Object} payload - Store creation data
 * @returns {Promise<Object>} Created store
 */
export async function createStore(payload) {
    const res = await platformClient.post("/stores", payload);
    return unwrap(res);
}

/**
 * Suspend a store (active → suspended)
 * @param {string|number} id - Store ID
 * @returns {Promise<Object>} Updated store
 */
export async function suspendStore(id) {
    const res = await platformClient.post(`/stores/${id}/suspend`);
    return unwrap(res);
}

/**
 * Resume a store (suspended → active)
 * @param {string|number} id - Store ID
 * @returns {Promise<Object>} Updated store
 */
export async function resumeStore(id) {
    const res = await platformClient.post(`/stores/${id}/resume`);
    return unwrap(res);
}

/**
 * Archive a store (active/suspended → archived)
 * @param {string|number} id - Store ID
 * @returns {Promise<Object>} Updated store
 */
export async function archiveStore(id) {
    const res = await platformClient.post(`/stores/${id}/archive`);
    return unwrap(res);
}

/**
 * Get store details (READ-ONLY)
 * @param {string|number} id - Store ID
 * @returns {Promise<Object>} Store metadata
 */
export async function getStoreDetails(id) {
    const res = await platformClient.get(`/stores/${id}`);
    return unwrap(res);
}

/**
 * Get store health (READ-ONLY)
 * @param {string|number} id - Store ID
 * @returns {Promise<Object>} Store health metrics
 */
export async function getStoreHealth(id) {
    const res = await platformClient.get(`/stores/${id}/health`);
    return unwrap(res);
}

/**
 * Get store activity (READ-ONLY)
 * @param {string|number} id - Store ID
 * @returns {Promise<Array>} Store activity events
 */
export async function getStoreActivity(id) {
    const res = await platformClient.get(`/stores/${id}/activity`);
    return unwrap(res);
}


