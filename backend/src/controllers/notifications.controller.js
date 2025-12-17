import {
    getUserNotifications,
    markAsRead as markAsReadService,
} from "../services/notification.service.js";
import { success, error } from "../utils/response.js";

/**
 * GET /api/notifications
 * Get user's notifications
 */
export async function getNotifications(req, res, next) {
    try {
        const userId = req.user.id;
        let status = req.query.status || null;
        
        // Map API status to DB status
        if (status === "UNREAD") {
            status = "NEW";
        }

        const limit = Number(req.query.limit || 100);
        const offset = Number(req.query.offset || 0);

        const notifications = await getUserNotifications(userId, {
            status,
            limit,
            offset,
        });

        // Parse payload JSON if it's a string and map status for API
        const formattedNotifications = notifications.map((notif) => ({
            id: notif.id,
            type: notif.type,
            status: notif.status === "NEW" ? "UNREAD" : notif.status,
            payload: typeof notif.payload === "string" ? JSON.parse(notif.payload) : notif.payload,
            created_at: notif.created_at,
        }));

        return success(res, formattedNotifications);
    } catch (err) {
        next(err);
    }
}

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
export async function markAsRead(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const updated = await markAsReadService(id, userId);

        if (!updated) {
            return error(res, "Уведомление не найдено или уже прочитано", 404);
        }

        return success(res, { success: true });
    } catch (err) {
        next(err);
    }
}

