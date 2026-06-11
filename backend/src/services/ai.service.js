import { randomBytes } from "node:crypto";
import { resolveAiIntent } from "./aiIntent.service.js";
import {
    getAiSystemPrompt,
    getBusinessContextPrompt,
    getMissingDataMessage,
} from "./aiPrompt.service.js";
import {
    sanitizeBusinessContext,
    validateContextForOpenAI,
} from "./aiContextSanitizer.service.js";
import { buildBasicChatAnswer, buildRuleBasedAnswer } from "./aiResponder.service.js";
import { AI_SAFE_TOOLS, AI_TOOL_NAMES } from "./aiTools.service.js";
import { generateAiAnswer } from "./openai.service.js";

const TOOL_FAILURE_ANSWER =
    "Some business data is temporarily unavailable. Please try again later.";

function generateConversationId() {
    return `ai-chat-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

function toMoney(value) {
    return Number(value || 0).toLocaleString("en-US", {
        maximumFractionDigits: 2,
    });
}

function isToolUnavailable(value) {
    return value && typeof value === "object" && value.unavailable === true;
}

function summarizeToolResult(toolName, result) {
    if (isToolUnavailable(result)) {
        return TOOL_FAILURE_ANSWER;
    }

    if (toolName === AI_TOOL_NAMES.SALES_SUMMARY) {
        return `Sales ${result.period}: revenue ${toMoney(result.total_revenue)}, ${result.orders_count} orders, ${result.items_sold} items sold.`;
    }

    if (toolName === AI_TOOL_NAMES.SALES_BY_PERIOD) {
        return `Sales trend has ${result.series.length} day(s) with completed sales and total revenue ${toMoney(result.summary.total_revenue)}.`;
    }

    if (toolName === AI_TOOL_NAMES.LOW_STOCK_ITEMS) {
        if (!result.items.length) {
            return "There are no low-stock products in the returned data.";
        }
        const topItem = result.items[0];
        return `${result.count} low-stock item(s) found. Most urgent: ${topItem.name}, recommended restock ${topItem.recommended_restock} unit(s).`;
    }

    if (toolName === AI_TOOL_NAMES.TOP_PRODUCTS) {
        if (!result.items.length) {
            return "No top-selling products were found for this period.";
        }
        const topItem = result.items[0];
        return `Top product ${result.period}: ${topItem.product_name}, ${topItem.quantity_sold} sold, revenue ${toMoney(topItem.revenue)}.`;
    }

    if (toolName === AI_TOOL_NAMES.PRODUCT_STOCK) {
        if (!result.matches.length) {
            return "No matching products were found in this store.";
        }
        const match = result.matches[0];
        return `${match.name}: stock ${match.stock ?? match.current_stock}, minimum stock ${match.min_stock}, status ${match.status}.`;
    }

    if (toolName === AI_TOOL_NAMES.CATEGORY_PERFORMANCE) {
        if (!result.categories.length) {
            return "No category sales were found for this period.";
        }
        const category = result.categories[0];
        return `Top category ${result.period}: ${category.category}, revenue ${toMoney(category.revenue)}, ${category.share_percent}% share.`;
    }

    if (toolName === AI_TOOL_NAMES.RECENT_TRANSACTIONS) {
        return `${result.transactions.length} recent completed sale transaction(s) found.`;
    }

    if (toolName === AI_TOOL_NAMES.RESTOCK_RECOMMENDATIONS) {
        if (!result.recommendations.length) {
            return "No restock recommendations were found in the returned data.";
        }
        const item = result.recommendations[0];
        return `Restock recommendation: ${item.product_name}, recommended quantity ${item.recommended_quantity}.`;
    }

    return "Business data is available for this question.";
}

function buildAnswer({ toolResults }) {
    const results = Object.entries(toolResults);

    if (results.length === 0) {
        return null;
    }

    if (results.some(([, result]) => isToolUnavailable(result))) {
        return TOOL_FAILURE_ANSWER;
    }

    return results.map(([toolName, result]) => summarizeToolResult(toolName, result)).join(" ");
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
    const basicAnswer = buildBasicChatAnswer({ message, language });

    if (basicAnswer.handled) {
        if (process.env.NODE_ENV === "development") {
            console.log("[AI Chat] Basic responder used", {
                type: basicAnswer.type,
            });
        }

        return {
            answer: basicAnswer.answer,
            conversation_id: conversationId || generateConversationId(),
            used_tools: [],
        };
    }

    const resolvedIntent = resolveAiIntent(message);
    const { usedTools, toolResults } = await executeResolvedTools({
        tools: resolvedIntent.tools,
        storeId,
        user,
    });
    const ruleBased = buildRuleBasedAnswer({
        intent: resolvedIntent.intent,
        toolResults,
        language,
        message,
    });

    if (ruleBased.handled) {
        if (process.env.NODE_ENV === "development") {
            console.log("[AI Chat] Rule-based answer used", {
                intent: resolvedIntent.intent,
                usedTools,
            });
        }

        return {
            answer: ruleBased.answer,
            conversation_id: conversationId || generateConversationId(),
            used_tools: usedTools,
        };
    }

    const openAiPromptPayload = buildOpenAiPromptPayload({
        message,
        toolResults,
        language,
    });

    if (!openAiPromptPayload.valid) {
        return {
            answer: TOOL_FAILURE_ANSWER,
            conversation_id: conversationId || generateConversationId(),
            used_tools: usedTools,
        };
    }

    try {
        const aiAnswer = await generateAiAnswer({
            systemPrompt: openAiPromptPayload.system,
            businessContextPrompt: openAiPromptPayload.business_context_prompt,
        });

        return {
            answer:
                aiAnswer ||
                buildAnswer({ intent: resolvedIntent.intent, toolResults }) ||
                getMissingDataMessage(language),
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
            answer:
                buildAnswer({ intent: resolvedIntent.intent, toolResults }) ||
                TOOL_FAILURE_ANSWER,
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
