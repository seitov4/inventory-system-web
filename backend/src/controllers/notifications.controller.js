import {
    getUserNotifications,
    markAsRead as markAsReadService,
} from "../services/notification.service.js";
import { createAppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { success } from "../utils/response.js";

export async function getNotifications(req, res, next) {
    try {
        const userId = req.user.id;
        let status = req.query.status || null;

        if (status === "UNREAD") {
            status = "NEW";
        }

        const limit = Number(req.query.limit || 100);
        const offset = Number(req.query.offset || 0);

        const notifications = await getUserNotifications(req.user.store_id, userId, {
            status,
            limit,
            offset,
        });

        const formattedNotifications = notifications.map((notif) => ({
            id: notif.id,
            type: notif.type,
            status: notif.status === "NEW" ? "UNREAD" : notif.status,
            payload:
                typeof notif.payload === "string"
                    ? JSON.parse(notif.payload)
                    : notif.payload,
            created_at: notif.created_at,
        }));

        return success(res, formattedNotifications);
    } catch (err) {
        return next(err);
    }
}

export async function markAsRead(req, res, next) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const updated = await markAsReadService(req.user.store_id, id, userId);

        if (!updated) {
            return next(
                createAppError(ERROR_CODES.NOTIFICATION_NOT_FOUND_OR_ALREADY_READ, 404)
            );
        }

        return success(res, { success: true });
    } catch (err) {
        return next(err);
    }
}

