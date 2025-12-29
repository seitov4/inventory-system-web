import platformClient from "./platformClient.js";

/**
 * Platform Auth API
 * Handles authentication for platform owner panel
 */

function unwrap(response) {
    return response.data?.data || response.data || {};
}

/**
 * Login to platform
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{token: string, user?: object}>}
 */
export async function platformLogin(credentials) {
    const res = await platformClient.post("/auth/login", credentials);
    return unwrap(res);
}

/**
 * Get current platform user profile
 * @returns {Promise<{user: object}>}
 */
export async function getPlatformProfile() {
    const res = await platformClient.get("/auth/me");
    return unwrap(res);
}

/**
 * Logout from platform
 * @returns {Promise<void>}
 */
export async function platformLogout() {
    await platformClient.post("/auth/logout");
}

