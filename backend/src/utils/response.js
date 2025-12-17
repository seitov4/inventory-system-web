/**
 * Unified Response Helpers
 * 
 * All controllers should use these helpers for consistent API responses.
 * 
 * Success format: { success: true, data: {}, error: null }
 * Error format: { success: false, data: null, error: "message" }
 */

/**
 * Send successful response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {number} status - HTTP status code (default: 200)
 */
export function success(res, data, status = 200) {
    return res.status(status).json({
        success: true,
        data: data,
        error: null,
    });
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} status - HTTP status code (default: 400)
 */
export function error(res, message, status = 400) {
    return res.status(status).json({
        success: false,
        data: null,
        error: message,
    });
}

