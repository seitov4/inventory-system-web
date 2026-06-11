import { randomBytes } from "node:crypto";
import { resolveAiIntent } from "./aiIntent.service.js";
import {
    getAiSystemPrompt,
    getBusinessContextPrompt,
} from "./aiPrompt.service.js";
import {
    sanitizeBusinessContext,
    validateContextForOpenAI,
} from "./aiContextSanitizer.service.js";
import { AI_SAFE_TOOLS } from "./aiTools.service.js";
import { generateAiAnswer } from "./openai.service.js";

const PROVIDER_UNAVAILABLE_MESSAGES = Object.freeze({
    en: "AI assistant is temporarily unavailable. Please try again later.",
    ru: "\u0418\u0418-\u043f\u043e\u043c\u043e\u0449\u043d\u0438\u043a \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043f\u043e\u0437\u0436\u0435.",
});

function generateConversationId() {
    return `ai-chat-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

export function getProviderUnavailableMessage(language = "en") {
    return PROVIDER_UNAVAILABLE_MESSAGES[language] || PROVIDER_UNAVAILABLE_MESSAGES.en;
}

function buildSanitizedBusinessContext({ message, toolResults }) {
    const sanitizedContext = sanitizeBusinessContext(toolResults);
    const validation = validateContextForOpenAI(sanitizedContext);

    if (!validation.valid) {
        console.warn("[AI Chat] Sanitized context failed OpenAI safety validation:", {
            issue_count: validation.issues.length,
        });

        return {
            valid: false,
            user_question: message,
            business_context: {},
        };
    }

    return {
        valid: true,
        user_question: message,
        business_context: sanitizedContext,
    };
}

function buildOpenAiPromptPayload({ message, toolResults, language }) {
    const businessContext = buildSanitizedBusinessContext({ message, toolResults });

    if (!businessContext.valid) {
        return {
            valid: false,
            system: getAiSystemPrompt(),
            user: message,
            business_context_prompt: "",
        };
    }

    return {
        valid: true,
        system: getAiSystemPrompt(),
        user: message,
        business_context_prompt: getBusinessContextPrompt({
            businessContext: {
                user_question: businessContext.user_question,
                business_context: businessContext.business_context,
            },
            language,
        }),
    };
}

function sanitizeToolParams(params = {}, toolName) {
    const sanitized = { ...params };

    for (const key of ["store_id", "storeId"]) {
        if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
            delete sanitized[key];
            console.warn("[AI Chat] Ignored store override in tool params:", {
                tool: toolName,
                reason: "cross_store_access_attempt",
            });
        }
    }

    return sanitized;
}

async function executeResolvedTools({ tools, storeId, user }) {
    const toolResults = {};
    const usedTools = [];

    for (const toolRequest of tools) {
        const tool = AI_SAFE_TOOLS[toolRequest.name];
        if (!tool) {
            continue;
        }

        usedTools.push(toolRequest.name);
        const safeParams = sanitizeToolParams(toolRequest.params, toolRequest.name);
        toolResults[toolRequest.name] = await tool({
            storeId,
            userId: user.id,
            role: user.role,
            ...safeParams,
        });
    }

    return {
        usedTools,
        toolResults,
    };
}

export async function handleChatMessage({
    message,
    conversationId,
    user,
    storeId,
    language = "en",
}) {
    const resolvedIntent = resolveAiIntent(message);
    const { usedTools, toolResults } = await executeResolvedTools({
        tools: resolvedIntent.tools,
        storeId,
        user,
    });

    const openAiPromptPayload = buildOpenAiPromptPayload({
        message,
        toolResults,
        language,
    });

    if (!openAiPromptPayload.valid) {
        return {
            answer: getProviderUnavailableMessage(language),
            conversation_id: conversationId || generateConversationId(),
            used_tools: usedTools,
        };
    }

    try {
        if (process.env.NODE_ENV === "development") {
            console.log("[AI Chat] Calling AI provider");
        }

        const aiAnswer = await generateAiAnswer({
            systemPrompt: openAiPromptPayload.system,
            businessContextPrompt: openAiPromptPayload.business_context_prompt,
        });

        if (process.env.NODE_ENV === "development") {
            console.log("[AI Chat] AI provider answer returned");
        }

        return {
            answer: aiAnswer || getProviderUnavailableMessage(language),
            conversation_id: conversationId || generateConversationId(),
            used_tools: usedTools,
        };
    } catch (error) {
        console.warn("[AI Chat] OpenAI response generation failed:", {
            status: error?.status,
            code: error?.code,
            type: error?.type,
            message: error?.message,
        });

        return {
            answer: getProviderUnavailableMessage(language),
            conversation_id: conversationId || generateConversationId(),
            used_tools: usedTools,
        };
    }
}

export const handleAiChat = handleChatMessage;

export const __aiPromptTestHooks = {
    buildOpenAiPromptPayload,
    buildSanitizedBusinessContext,
};
