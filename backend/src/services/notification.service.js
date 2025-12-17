import pool from "../utils/db.js";

/**
 * Create notification for multiple users
 * @param {Object} params
 * @param {string} params.type - Notification type (e.g., 'LOW_STOCK')
 * @param {number[]} params.userIds - Array of user IDs to notify
 * @param {Object} params.payload - JSON payload with notification data
 * @param {Object} [params.client] - Optional database client for use within existing transaction
 * @returns {Promise<void>}
 */
export async function createNotification({ type, userIds, payload, client = null }) {
    if (!type) {
        throw new Error("Notification type is required");
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("User IDs array is required and cannot be empty");
    }

    if (!payload || typeof payload !== "object") {
        throw new Error("Payload must be an object");
    }

    const useExternalClient = client !== null;
    if (!useExternalClient) {
        client = await pool.connect();
    }

    try {
        if (!useExternalClient) {
            await client.query("BEGIN");
        }

        // Create notification for each user
        // Note: DB uses 'NEW' status (matches schema), API maps it to 'UNREAD'
        for (const userId of userIds) {
            await client.query(
                `INSERT INTO notifications (type, user_id, payload, status)
                 VALUES ($1, $2, $3, 'NEW')`,
                [type, userId, JSON.stringify(payload)]
            );
        }

        if (!useExternalClient) {
            await client.query("COMMIT");
        }
    } catch (err) {
        if (!useExternalClient) {
            await client.query("ROLLBACK");
        }
        throw err;
    } finally {
        if (!useExternalClient) {
            client.release();
        }
    }
}

/**
 * Get notifications for a user
 * @param {number} userId - User ID
 * @param {Object} [options] - Query options
 * @param {string} [options.status] - Filter by status (UNREAD, READ)
 * @param {number} [options.limit] - Limit results
 * @param {number} [options.offset] - Offset for pagination
 * @returns {Promise<Array>} Array of notifications
 */
export async function getUserNotifications(userId, { status = null, limit = 100, offset = 0 } = {}) {
    let query = `SELECT id,
                        type,
                        user_id,
                        payload,
                        status,
                        created_at,
                        read_at
                 FROM notifications
                 WHERE user_id = $1`;

    const params = [userId];
    let paramIndex = 2;

    if (status) {
        // Map UNREAD to NEW for DB query (DB uses 'NEW', API uses 'UNREAD')
        const dbStatus = status === "UNREAD" ? "NEW" : status;
        query += ` AND status = $${paramIndex++}`;
        params.push(dbStatus);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
}

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for authorization check)
 * @returns {Promise<boolean>} True if updated, false if not found or unauthorized
 */
export async function markAsRead(notificationId, userId) {
    const result = await pool.query(
        `UPDATE notifications
         SET status = 'READ', read_at = NOW()
         WHERE id = $1 AND user_id = $2 AND status = 'NEW'
         RETURNING id`,
        [notificationId, userId]
    );

    return result.rows.length > 0;
}

/**
 * Get users with specific roles (for low stock notifications)
 * @param {string[]} roles - Array of roles (e.g., ['owner', 'manager'])
 * @param {Object} [client] - Optional database client
 * @returns {Promise<number[]>} Array of user IDs
 */
export async function getUsersByRoles(roles, client = null) {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return [];
    }

    const query = `SELECT id FROM users WHERE role = ANY($1::text[])`;
    const params = [roles];

    if (client) {
        const result = await client.query(query, params);
        return result.rows.map((row) => row.id);
    } else {
        const result = await pool.query(query, params);
        return result.rows.map((row) => row.id);
    }
}

