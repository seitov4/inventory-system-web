import pool from "../utils/db.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

export async function createNotification({ store_id, type, userIds, payload, client = null }) {
    if (!store_id) {
        throw createAppError(ERROR_CODES.AUTH_FORBIDDEN, 403);
    }

    if (!type) {throw createAppError(ERROR_CODES.NOTIFICATION_TYPE_REQUIRED, 400);}
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw createAppError(ERROR_CODES.NOTIFICATION_USER_IDS_REQUIRED, 400);
    }
    if (!payload || typeof payload !== "object") {
        throw createAppError(ERROR_CODES.NOTIFICATION_PAYLOAD_OBJECT_REQUIRED, 400);
    }

    const useExternalClient = client !== null;
    if (!useExternalClient) {client = await pool.connect();}

    try {
        if (!useExternalClient) {await client.query("BEGIN");}

        for (const userId of userIds) {
            const userResult = await client.query(
                `SELECT id FROM users WHERE id = $1 AND store_id = $2`,
                [userId, store_id]
            );
            if (!userResult.rows.length) {continue;}

            await client.query(
                `INSERT INTO notifications (store_id, type, user_id, payload, status)
                 VALUES ($1, $2, $3, $4, 'NEW')`,
                [store_id, type, userId, JSON.stringify(payload)]
            );
        }

        if (!useExternalClient) {await client.query("COMMIT");}
    } catch (err) {
        if (!useExternalClient) {await client.query("ROLLBACK");}
        throw err;
    } finally {
        if (!useExternalClient) {client.release();}
    }
}

export async function getUserNotifications(storeId, userId, { status = null, limit = 100, offset = 0 } = {}) {
    let query = `SELECT id,
                        store_id,
                        type,
                        user_id,
                        payload,
                        status,
                        created_at,
                        read_at
                 FROM notifications
                 WHERE store_id = $1 AND user_id = $2`;

    const params = [storeId, userId];
    let paramIndex = 3;

    if (status) {
        const dbStatus = status === "UNREAD" ? "NEW" : status;
        query += ` AND status = $${paramIndex++}`;
        params.push(dbStatus);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
}

export async function markAsRead(storeId, notificationId, userId) {
    const result = await pool.query(
        `UPDATE notifications
         SET status = 'READ', read_at = CURRENT_TIMESTAMP, is_read = TRUE
         WHERE id = $1 AND user_id = $2 AND store_id = $3 AND status = 'NEW'
         RETURNING id`,
        [notificationId, userId, storeId]
    );

    return result.rows.length > 0;
}

export async function getUsersByRoles(storeId, roles, client = null) {
    if (!storeId || !roles || !Array.isArray(roles) || roles.length === 0) {
        return [];
    }

    const placeholders = roles.map((_, index) => `$${index + 2}`).join(", ");
    const query = `SELECT id FROM users WHERE store_id = $1 AND is_active IS TRUE AND role IN (${placeholders})`;
    const params = [storeId, ...roles];

    if (client) {
        const result = await client.query(query, params);
        return result.rows.map((row) => row.id);
    }

    const result = await pool.query(query, params);
    return result.rows.map((row) => row.id);
}
