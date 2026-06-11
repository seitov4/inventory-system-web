import { randomBytes } from "node:crypto";
import { handleChatMessage } from "../services/ai.service.js";
import {
    evaluateMessageScope,
    getSafeClarificationMessage,
    getSafeRefusalMessage,
    getStoreIsolationMessage,
    validateAiMessage,
} from "../services/aiGuard.service.js";
import { checkAndIncrementAiRateLimit } from "../services/aiRateLimit.service.js";
import { buildBasicChatAnswer } from "../services/aiResponder.service.js";
import { success } from "../utils/response.js";

const ALLOWED_AI_ROLES = new Set(["owner", "manager", "admin"]);
const MAX_CONVERSATION_ID_LENGTH = 100;
const AI_PERMISSION_MESSAGE = "You do not have permission to use AI assistant.";
const AI_STORE_REQUIRED_MESSAGE = "User is not assigned to a store.";
const AI_UNAVAILABLE_MESSAGE = "AI assistant is temporarily unavailable. Please try again later.";

function sendAiError(res, status, message) {
    return res.status(status).json({
        success: false,
        message,
    });
}

function generateConversationId() {
    return `ai-chat-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

function validateConversationId(conversationId) {
    if (conversationId === undefined || conversationId === null || conversationId === "") {
        return {
            valid: true,
            conversationId: generateConversationId(),
        };
    }

    if (typeof conversationId !== "string") {
        return {
            valid: false,
            status: 400,
            message: "Conversation ID must be a string.",
        };
    }

    const trimmedConversationId = conversationId.trim();

    if (trimmedConversationId.length > MAX_CONVERSATION_ID_LENGTH) {
        return {
            valid: false,
            status: 400,
            message: "Conversation ID must be 100 characters or less.",
        };
    }

    return {
        valid: true,
        conversationId: trimmedConversationId || generateConversationId(),
    };
}

function buildSafeUser(user) {
    return {
        id: user.id,
        role: user.role,
    };
}

function hasIncomingStoreId(req) {
    return Boolean(
        Object.prototype.hasOwnProperty.call(req.body || {}, "store_id") ||
            Object.prototype.hasOwnProperty.call(req.body || {}, "storeId") ||
            Object.prototype.hasOwnProperty.call(req.query || {}, "store_id") ||
            Object.prototype.hasOwnProperty.call(req.query || {}, "storeId") ||
            Object.prototype.hasOwnProperty.call(req.params || {}, "store_id") ||
            Object.prototype.hasOwnProperty.call(req.params || {}, "storeId") ||
            req.headers?.["store_id"] !== undefined ||
            req.headers?.storeid !== undefined ||
            req.headers?.["x-store-id"] !== undefined
    );
}

function logCrossStoreAttempt({ storeId, userId, reason }) {
    console.warn("[AI Chat] Cross-store access attempt blocked:", {
        store_id: storeId,
        user_id: userId,
        reason,
        status: "blocked",
    });
}

export async function chatWithAiController(req, res, _next) {
    try {
        const { message, conversation_id } = req.body || {};
        const validation = validateAiMessage(message);

        if (!validation.valid) {
            return sendAiError(res, validation.status, `${validation.message}.`);
        }

        if (!req.user) {
            return sendAiError(res, 401, "Authentication required.");
        }

        if (!ALLOWED_AI_ROLES.has(req.user.role)) {
            return sendAiError(res, 403, AI_PERMISSION_MESSAGE);
        }

        const storeId = req.user.store_id;

        if (!storeId) {
            return sendAiError(res, 403, AI_STORE_REQUIRED_MESSAGE);
        }

        const conversationValidation = validateConversationId(conversation_id);

        if (!conversationValidation.valid) {
            return sendAiError(
                res,
                conversationValidation.status,
                conversationValidation.message
            );
        }

        const trimmedMessage = message.trim();
        const conversationId = conversationValidation.conversationId;
        const rateLimit = await checkAndIncrementAiRateLimit({
            storeId,
            userId: req.user.id,
        });

        if (!rateLimit.allowed) {
            console.warn("[AI Chat] Rate limit reached", {
                storeId,
                userId: req.user.id,
                reason: rateLimit.reason,
            });

            return sendAiError(res, rateLimit.status || 429, rateLimit.message);
        }

        const scope = evaluateMessageScope(trimmedMessage);

        if (hasIncomingStoreId(req) || scope.reason === "cross_store_access_attempt") {
            logCrossStoreAttempt({
                storeId,
                userId: req.user.id,
                reason: "cross_store_access_attempt",
            });

            return success(res, {
                answer: getStoreIsolationMessage(scope.language),
                conversation_id: conversationId,
                used_tools: [],
            });
        }

        if (scope.blocked) {
            return success(res, {
                answer: getSafeRefusalMessage(scope.language),
                conversation_id: conversationId,
                used_tools: [],
            });
        }

        const basicAnswer = buildBasicChatAnswer({
            message: trimmedMessage,
            language: scope.language,
        });

        if (!scope.allowedBusiness && !basicAnswer.handled) {
            return success(res, {
                answer: getSafeClarificationMessage(scope.language),
                conversation_id: conversationId,
                used_tools: [],
            });
        }

        const result = await handleChatMessage({
            message: trimmedMessage,
            conversationId,
            language: scope.language,
            user: buildSafeUser(req.user),
            storeId,
        });

        return success(res, {
            answer: result.answer,
            conversation_id: result.conversation_id,
            used_tools: Array.isArray(result.used_tools) ? result.used_tools : [],
        });
    } catch (err) {
        console.error("[AI Chat] Safe internal error:", {
            name: err?.name,
            code: err?.code,
        });
        return sendAiError(res, 500, AI_UNAVAILABLE_MESSAGE);
    }
}
