import OpenAI from "openai";
import "../utils/load-env.js";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

let cachedClient = null;

export class OpenAiServiceError extends Error {
    constructor(code, options = {}) {
        super(code);
        this.name = "OpenAiServiceError";
        this.code = code;
        this.status = options.status;
        this.type = options.type;
        this.cause = options.cause;
    }
}

export function isAiChatEnabled() {
    return String(process.env.AI_CHAT_ENABLED ?? "true").toLowerCase() !== "false";
}

export function getOpenAiModel() {
    return process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
}

export function hasOpenAiApiKey() {
    return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAiConfig() {
    return {
        enabled: isAiChatEnabled(),
        model: getOpenAiModel(),
        hasApiKey: hasOpenAiApiKey(),
    };
}

export function getOpenAiClient() {
    if (!isAiChatEnabled()) {
        throw new OpenAiServiceError("AI_CHAT_DISABLED");
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new OpenAiServiceError("OPENAI_API_KEY_NOT_CONFIGURED");
    }

    if (!cachedClient) {
        cachedClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    return cachedClient;
}

export async function generateAiAnswer({ systemPrompt, businessContextPrompt }) {
    const client = getOpenAiClient();
    const model = getOpenAiModel();

    const response = await client.responses.create({
        model,
        instructions: systemPrompt,
        input: businessContextPrompt,
    });

    return response.output_text?.trim() || null;
}
