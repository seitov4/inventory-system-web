import test from "node:test";
import assert from "node:assert/strict";
import pool from "../src/utils/db.js";
import { chatWithAiController } from "../src/controllers/ai.controller.js";
import { evaluateMessageScope } from "../src/services/aiGuard.service.js";
import { resolveAiIntent } from "../src/services/aiIntent.service.js";
import { getAiSystemPrompt, getBusinessContextPrompt } from "../src/services/aiPrompt.service.js";
import { __aiPromptTestHooks, handleChatMessage } from "../src/services/ai.service.js";
import { getOpenAiConfig, getOpenAiModel } from "../src/services/openai.service.js";
import {
    checkAndIncrementAiRateLimit,
    getAiRateLimitConfig,
} from "../src/services/aiRateLimit.service.js";
import {
    buildBasicChatAnswer,
    buildRuleBasedAnswer,
    formatDate,
    formatMoney,
    formatNumber,
    formatPercent,
} from "../src/services/aiResponder.service.js";
import {
    getLowStockItems,
    getProductStock,
    getRecentTransactions,
} from "../src/services/aiTools.service.js";
import {
    sanitizeBusinessContext,
    sanitizeEmployeePerformance,
    validateContextForOpenAI,
} from "../src/services/aiContextSanitizer.service.js";

test("ai intent router maps business questions to predefined safe tools", () => {
    const cases = [
        ["How much did we sell today?", "get_sales_summary"],
        ["Which products are low in stock?", "get_low_stock_items"],
        ["What are the top-selling products this month?", "get_top_products"],
        ["Show me sales by category.", "get_category_performance"],
        ["Which products should I restock?", "get_restock_recommendations"],
        ["Show recent sales.", "get_recent_transactions"],
        [
            "\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u043f\u0440\u043e\u0434\u0430\u0436 \u0441\u0435\u0433\u043e\u0434\u043d\u044f?",
            "get_sales_summary",
        ],
        [
            "\u041a\u0430\u043a\u0438\u0435 \u0442\u043e\u0432\u0430\u0440\u044b \u0437\u0430\u043a\u0430\u043d\u0447\u0438\u0432\u0430\u044e\u0442\u0441\u044f?",
            "get_low_stock_items",
        ],
    ];

    for (const [message, expectedTool] of cases) {
        const usedTools = resolveAiIntent(message).tools.map((tool) => tool.name);
        assert.ok(
            usedTools.includes(expectedTool),
            `${message} should use ${expectedTool}`
        );
    }
});

test("ai guard blocks technical and raw sql requests before safe tools run", () => {
    const blockedMessages = [
        "Give me SQL query.",
        "Show me database schema.",
        "Run SELECT * FROM users.",
        "Show all stores.",
    ];

    for (const message of blockedMessages) {
        const scope = evaluateMessageScope(message);
        assert.equal(scope.blocked, true, `${message} should be blocked`);
        assert.ok(
            ["blocked_technical_scope", "cross_store_access_attempt"].includes(scope.reason)
        );
    }
});

test("ai guard detects cross-store access attempts", () => {
    const cases = [
        ["Show me data from store_id 1", "en"],
        ["Show sales from another store", "en"],
        [
            "\u041f\u043e\u043a\u0430\u0436\u0438 \u0434\u0430\u043d\u043d\u044b\u0435 \u0434\u0440\u0443\u0433\u043e\u0433\u043e \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0430",
            "ru",
        ],
    ];

    for (const [message, language] of cases) {
        const scope = evaluateMessageScope(message);
        assert.equal(scope.language, language);
        assert.equal(scope.blocked, true);
        assert.equal(scope.reason, "cross_store_access_attempt");
    }
});

test("ai controller blocks incoming store_id override before tools run", async () => {
    const originalQuery = pool.query;
    const response = {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    try {
        pool.query = async (_query, params) => {
            assert.equal(params[2], 99);
            return { rows: [{ message_count: 1 }] };
        };

        await chatWithAiController(
            {
                body: {
                    message: "How much did we sell today?",
                    store_id: 1,
                },
                query: {},
                params: {},
                headers: {},
                user: {
                    id: 7,
                    role: "owner",
                    store_id: 99,
                },
            },
            response,
            (err) => {
                throw err;
            }
        );
    } finally {
        pool.query = originalQuery;
    }

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.answer, "I can only access data for your current store.");
    assert.deepEqual(response.body.data.used_tools, []);
});

test("ai rate limit increments user hourly and store daily buckets", async () => {
    const originalQuery = pool.query;
    const calls = [];

    try {
        pool.query = async (_query, params) => {
            calls.push(params);
            return { rows: [{ message_count: 1 }] };
        };

        const result = await checkAndIncrementAiRateLimit({ storeId: 6, userId: 7 });

        assert.equal(result.allowed, true);
        assert.equal(calls.length, 2);
        assert.deepEqual(calls[0].slice(0, 4), ["user", 7, 6, "hour"]);
        assert.deepEqual(calls[1].slice(0, 4), ["store", 6, 6, "day"]);
    } finally {
        pool.query = originalQuery;
    }
});

test("ai rate limit returns safe user hourly 429 result", async () => {
    const originalQuery = pool.query;
    const originalUserLimit = process.env.AI_CHAT_USER_HOURLY_LIMIT;
    const originalStoreLimit = process.env.AI_CHAT_STORE_DAILY_LIMIT;
    const counts = [3, 1];

    try {
        process.env.AI_CHAT_USER_HOURLY_LIMIT = "2";
        process.env.AI_CHAT_STORE_DAILY_LIMIT = "100";
        pool.query = async () => ({ rows: [{ message_count: counts.shift() }] });

        const result = await checkAndIncrementAiRateLimit({ storeId: 6, userId: 7 });

        assert.equal(result.allowed, false);
        assert.equal(result.status, 429);
        assert.equal(result.reason, "user_hourly_limit");
        assert.equal(result.message, "AI chat limit reached. Please try again later.");
    } finally {
        pool.query = originalQuery;

        if (originalUserLimit === undefined) {
            delete process.env.AI_CHAT_USER_HOURLY_LIMIT;
        } else {
            process.env.AI_CHAT_USER_HOURLY_LIMIT = originalUserLimit;
        }

        if (originalStoreLimit === undefined) {
            delete process.env.AI_CHAT_STORE_DAILY_LIMIT;
        } else {
            process.env.AI_CHAT_STORE_DAILY_LIMIT = originalStoreLimit;
        }
    }
});

test("ai rate limit returns safe store daily 429 result", async () => {
    const originalQuery = pool.query;
    const originalUserLimit = process.env.AI_CHAT_USER_HOURLY_LIMIT;
    const originalStoreLimit = process.env.AI_CHAT_STORE_DAILY_LIMIT;
    const counts = [1, 4];

    try {
        process.env.AI_CHAT_USER_HOURLY_LIMIT = "100";
        process.env.AI_CHAT_STORE_DAILY_LIMIT = "3";
        pool.query = async () => ({ rows: [{ message_count: counts.shift() }] });

        const result = await checkAndIncrementAiRateLimit({ storeId: 6, userId: 7 });

        assert.equal(result.allowed, false);
        assert.equal(result.status, 429);
        assert.equal(result.reason, "store_daily_limit");
        assert.equal(
            result.message,
            "Daily AI chat limit for this store has been reached. Please try again tomorrow."
        );
    } finally {
        pool.query = originalQuery;

        if (originalUserLimit === undefined) {
            delete process.env.AI_CHAT_USER_HOURLY_LIMIT;
        } else {
            process.env.AI_CHAT_USER_HOURLY_LIMIT = originalUserLimit;
        }

        if (originalStoreLimit === undefined) {
            delete process.env.AI_CHAT_STORE_DAILY_LIMIT;
        } else {
            process.env.AI_CHAT_STORE_DAILY_LIMIT = originalStoreLimit;
        }
    }
});

test("ai rate limit config uses documented defaults", () => {
    const originalUserLimit = process.env.AI_CHAT_USER_HOURLY_LIMIT;
    const originalStoreLimit = process.env.AI_CHAT_STORE_DAILY_LIMIT;

    try {
        delete process.env.AI_CHAT_USER_HOURLY_LIMIT;
        delete process.env.AI_CHAT_STORE_DAILY_LIMIT;

        assert.deepEqual(getAiRateLimitConfig(), {
            userHourlyLimit: 20,
            storeDailyLimit: 100,
        });
    } finally {
        if (originalUserLimit === undefined) {
            delete process.env.AI_CHAT_USER_HOURLY_LIMIT;
        } else {
            process.env.AI_CHAT_USER_HOURLY_LIMIT = originalUserLimit;
        }

        if (originalStoreLimit === undefined) {
            delete process.env.AI_CHAT_STORE_DAILY_LIMIT;
        } else {
            process.env.AI_CHAT_STORE_DAILY_LIMIT = originalStoreLimit;
        }
    }
});

test("ai rule-based responder formats simple sales answers without OpenAI", () => {
    const result = buildRuleBasedAnswer({
        intent: "sales_summary",
        language: "en",
        message: "How much did we sell today?",
        toolResults: {
            get_sales_summary: {
                period: "today",
                total_revenue: 66942.94,
                orders_count: 8,
                items_sold: 31,
                average_order_value: 8367.87,
            },
        },
    });

    assert.equal(result.handled, true);
    assert.equal(
        result.answer,
        "Completed sales for today are 66,942.94 KZT from 8 orders. A total of 31 items were sold, with an average order value of 8,367.87 KZT."
    );
});

test("ai basic responder answers greetings, thanks, confirmations, and goodbyes", () => {
    const cases = [
        [
            "hello?",
            "en",
            "Hello. I can help you analyze your store data, including sales, stock levels, products, reports, and restocking recommendations.",
        ],
        [
            "thank you!",
            "en",
            "You are welcome. You can ask me about sales, stock levels, top products, reports, or restocking.",
        ],
        [
            "ok!",
            "en",
            "Good. Ask me anytime about your store's sales, stock, products, reports, or restocking needs.",
        ],
        [
            "goodbye.",
            "en",
            "Goodbye. I will be ready to help with your store data whenever you need.",
        ],
        [
            "\u043f\u0440\u0438\u0432\u0435\u0442!",
            "ru",
            "\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435. \u042f \u043c\u043e\u0433\u0443 \u043f\u043e\u043c\u043e\u0447\u044c \u0441 \u0430\u043d\u0430\u043b\u0438\u0437\u043e\u043c \u0434\u0430\u043d\u043d\u044b\u0445 \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0430: \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u043c\u0438, \u043e\u0441\u0442\u0430\u0442\u043a\u0430\u043c\u0438, \u0442\u043e\u0432\u0430\u0440\u0430\u043c\u0438, \u043e\u0442\u0447\u0435\u0442\u0430\u043c\u0438 \u0438 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0438\u044f\u043c\u0438 \u043f\u043e \u0437\u0430\u043a\u0443\u043f\u043a\u0435.",
        ],
        [
            "\u0441\u043f\u0430\u0441\u0438\u0431\u043e.",
            "ru",
            "\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430. \u0412\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u0441\u043f\u0440\u043e\u0441\u0438\u0442\u044c \u043c\u0435\u043d\u044f \u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u0445, \u043e\u0441\u0442\u0430\u0442\u043a\u0430\u0445, \u043f\u043e\u043f\u0443\u043b\u044f\u0440\u043d\u044b\u0445 \u0442\u043e\u0432\u0430\u0440\u0430\u0445, \u043e\u0442\u0447\u0435\u0442\u0430\u0445 \u0438\u043b\u0438 \u0437\u0430\u043a\u0443\u043f\u043a\u0435.",
        ],
    ];

    for (const [message, language, answer] of cases) {
        const result = buildBasicChatAnswer({ message, language });
        assert.equal(result.handled, true);
        assert.equal(result.answer, answer);
    }
});

test("ai basic responder does not catch business or blocked mixed messages", () => {
    assert.equal(
        buildBasicChatAnswer({
            message:
                "\u043f\u0440\u0438\u0432\u0435\u0442, \u0441\u043a\u043e\u043b\u044c\u043a\u043e \u043f\u0440\u043e\u0434\u0430\u0436 \u0441\u0435\u0433\u043e\u0434\u043d\u044f?",
            language: "ru",
        }).handled,
        false
    );
    assert.equal(
        buildBasicChatAnswer({
            message: "\u043f\u0440\u0438\u0432\u0435\u0442, \u043f\u043e\u043a\u0430\u0436\u0438 database schema",
            language: "ru",
        }).handled,
        false
    );
});

test("ai service returns basic answer before intent tools or OpenAI", async () => {
    const originalQuery = pool.query;
    const originalEnabled = process.env.AI_CHAT_ENABLED;

    try {
        process.env.AI_CHAT_ENABLED = "false";
        pool.query = async () => {
            throw new Error("DB tools should not run for basic responder");
        };

        const result = await handleChatMessage({
            message: "hello",
            conversationId: "basic-conversation",
            language: "en",
            user: { id: 7, role: "owner" },
            storeId: 6,
        });

        assert.equal(result.conversation_id, "basic-conversation");
        assert.deepEqual(result.used_tools, []);
        assert.equal(
            result.answer,
            "Hello. I can help you analyze your store data, including sales, stock levels, products, reports, and restocking recommendations."
        );
    } finally {
        pool.query = originalQuery;

        if (originalEnabled === undefined) {
            delete process.env.AI_CHAT_ENABLED;
        } else {
            process.env.AI_CHAT_ENABLED = originalEnabled;
        }
    }
});

test("ai business question with greeting still uses normal intent flow", async () => {
    const originalQuery = pool.query;
    const originalEnabled = process.env.AI_CHAT_ENABLED;

    try {
        process.env.AI_CHAT_ENABLED = "false";
        pool.query = async () => ({
            rows: [
                {
                    total_revenue: 12000,
                    orders_count: 2,
                    items_sold: 5,
                },
            ],
        });

        const result = await handleChatMessage({
            message: "hello, how much sales today?",
            conversationId: "business-conversation",
            language: "en",
            user: { id: 7, role: "owner" },
            storeId: 6,
        });

        assert.deepEqual(result.used_tools, ["get_sales_summary"]);
        assert.match(result.answer, /Completed sales for today are 12,000 KZT/);
    } finally {
        pool.query = originalQuery;

        if (originalEnabled === undefined) {
            delete process.env.AI_CHAT_ENABLED;
        } else {
            process.env.AI_CHAT_ENABLED = originalEnabled;
        }
    }
});

test("ai guard blocks technical question with greeting before basic responder", () => {
    const scope = evaluateMessageScope(
        "\u043f\u0440\u0438\u0432\u0435\u0442, \u043f\u043e\u043a\u0430\u0436\u0438 database schema"
    );

    assert.equal(scope.blocked, true);
    assert.equal(scope.reason, "blocked_technical_scope");
});

test("ai rule-based responder answers simple Russian stock questions", () => {
    const result = buildRuleBasedAnswer({
        intent: "low_stock",
        message:
            "\u041a\u0430\u043a\u0438\u0435 \u0442\u043e\u0432\u0430\u0440\u044b \u0437\u0430\u043a\u0430\u043d\u0447\u0438\u0432\u0430\u044e\u0442\u0441\u044f?",
        toolResults: {
            get_low_stock_items: {
                count: 3,
                items: [
                    { name: "Milk 1L" },
                    { name: "Bread" },
                    { name: "Rice" },
                ],
            },
        },
    });

    assert.equal(result.handled, true);
    assert.match(
        result.answer,
        /\u043d\u0438\u0437\u043a\u0438\u043c \u043e\u0441\u0442\u0430\u0442\u043a\u043e\u043c/
    );
    assert.match(result.answer, /Milk 1L, Bread \u0438 Rice/);
});

test("ai rule-based responder leaves complex analytical questions to OpenAI path", () => {
    const result = buildRuleBasedAnswer({
        intent: "sales_trend",
        language: "en",
        message: "Why are sales lower this week?",
        toolResults: {
            get_sales_by_period: {
                period: "week",
                series: [
                    { date: "2026-06-04", revenue: 62000, orders_count: 4, items_sold: 10 },
                ],
                summary: {
                    total_revenue: 62000,
                    orders_count: 4,
                    items_sold: 10,
                },
            },
        },
    });

    assert.deepEqual(result, { handled: false, answer: null });
});

test("ai responder number helpers use locale-specific formatting", () => {
    assert.equal(formatMoney(66942.94, "en"), "66,942.94 KZT");
    assert.equal(formatMoney(66942.94, "ru"), "66\u00a0942,94 KZT");
    assert.equal(formatNumber(31, "ru"), "31");
    assert.equal(formatPercent(43.6, "ru"), "43,6 %");
    assert.equal(formatDate("2026-06-04T10:00:00.000Z", "en"), "2026-06-04");
});

test("ai service returns rule-based answer before OpenAI provider for simple questions", async () => {
    const originalQuery = pool.query;
    const originalEnabled = process.env.AI_CHAT_ENABLED;

    try {
        process.env.AI_CHAT_ENABLED = "false";
        pool.query = async () => ({
            rows: [
                {
                    total_revenue: 66942.94,
                    orders_count: 8,
                    items_sold: 31,
                },
            ],
        });

        const result = await handleChatMessage({
            message: "How much did we sell today?",
            conversationId: "test-conversation",
            language: "en",
            user: { id: 7, role: "owner" },
            storeId: 6,
        });

        assert.equal(result.conversation_id, "test-conversation");
        assert.deepEqual(result.used_tools, ["get_sales_summary"]);
        assert.match(result.answer, /Completed sales for today are 66,942\.94 KZT/);
        assert.doesNotMatch(result.answer, /Sales today: revenue/);
    } finally {
        pool.query = originalQuery;

        if (originalEnabled === undefined) {
            delete process.env.AI_CHAT_ENABLED;
        } else {
            process.env.AI_CHAT_ENABLED = originalEnabled;
        }
    }
});

test("ai service keeps OpenAI fallback path for complex analytical questions", async () => {
    const originalQuery = pool.query;
    const originalEnabled = process.env.AI_CHAT_ENABLED;
    let queryCount = 0;

    try {
        process.env.AI_CHAT_ENABLED = "false";
        pool.query = async () => {
            queryCount += 1;
            if (queryCount === 1) {
                return {
                    rows: [
                        {
                            total_revenue: 62000,
                            orders_count: 4,
                            items_sold: 10,
                        },
                    ],
                };
            }

            return {
                rows: [
                    {
                        date: "2026-06-04",
                        revenue: 62000,
                        orders_count: 4,
                        items_sold: 10,
                    },
                ],
            };
        };

        const result = await handleChatMessage({
            message: "Why are sales lower this week?",
            conversationId: "test-conversation",
            language: "en",
            user: { id: 7, role: "owner" },
            storeId: 6,
        });

        assert.deepEqual(result.used_tools, ["get_sales_summary", "get_sales_by_period"]);
        assert.match(result.answer, /Sales week: revenue/);
    } finally {
        pool.query = originalQuery;

        if (originalEnabled === undefined) {
            delete process.env.AI_CHAT_ENABLED;
        } else {
            process.env.AI_CHAT_ENABLED = originalEnabled;
        }
    }
});

test("ai safe tools expose requested stock output fields", async () => {
    const originalQuery = pool.query;

    try {
        pool.query = async (_query, params) => {
            assert.equal(params[0], 6);

            return {
                rows: [
                    {
                        id: 12,
                        name: "Milk 1L",
                        sku: "MILK-001",
                        category: "Food",
                        current_stock: 4,
                        min_stock: 10,
                    },
                ],
            };
        };

        const lowStock = await getLowStockItems({ storeId: 6, limit: 5 });
        assert.equal(lowStock.count, 1);
        assert.equal(lowStock.items[0].recommended_restock, 16);

        const productStock = await getProductStock({
            storeId: 6,
            productName: "Milk",
            limit: 5,
        });
        assert.equal(productStock.matches[0].stock, 4);
        assert.equal(productStock.matches[0].status, "low_stock");
    } finally {
        pool.query = originalQuery;
    }
});

test("ai recent transactions never use email or phone as employee name fallback", async () => {
    const originalQuery = pool.query;
    let capturedQuery = "";

    try {
        pool.query = async (query, params) => {
            capturedQuery = query;
            assert.equal(params[0], 6);

            return {
                rows: [
                    {
                        date: "2026-06-09T10:35:00.000Z",
                        total_amount: 2400,
                        payment_type: "card",
                        employee_name: "Employee",
                        items_count: 3,
                    },
                ],
            };
        };

        const result = await getRecentTransactions({ storeId: 6, limit: 5 });

        assert.equal(result.transactions[0].employee_name, "Employee");
        assert.doesNotMatch(capturedQuery, /\.email\b/i);
        assert.doesNotMatch(capturedQuery, /\.phone\b/i);
        assert.match(capturedQuery, /'Employee'/);
    } finally {
        pool.query = originalQuery;
    }
});

test("ai prompt service defines strict business assistant behavior", () => {
    const prompt = getAiSystemPrompt();

    assert.match(prompt, /AI business assistant inside an inventory management system/);
    assert.match(prompt, /Answer only using the business data provided by backend tools/);
    assert.match(prompt, /Do not mention backend implementation/);
    assert.match(prompt, /Do not invent numbers/);
    assert.match(prompt, /Use the same language as the user/);
    assert.match(prompt, /I can only help with business insights based on your store data/);
});

test("ai service prepares only sanitized business context for future OpenAI use", () => {
    const payload = __aiPromptTestHooks.buildOpenAiPromptPayload({
        message: "How much did we sell today?",
        language: "en",
        toolResults: {
            get_sales_summary: {
                period: "today",
                total_revenue: 100,
                orders_count: 2,
                store_id: 6,
                password_hash: "secret",
                sql: "SELECT * FROM users",
            },
        },
    });

    const serializedPayload = JSON.stringify(payload);
    assert.equal(payload.user, "How much did we sell today?");
    assert.equal(payload.valid, true);
    assert.match(payload.system, /AI business assistant/);
    assert.match(payload.business_context_prompt, /Business context:/);
    assert.match(payload.business_context_prompt, /Do not invent data/);
    assert.doesNotMatch(serializedPayload, /password_hash/);
    assert.doesNotMatch(serializedPayload, /store_id/);
    assert.doesNotMatch(serializedPayload, /SELECT \* FROM users/);
    assert.doesNotMatch(serializedPayload, /JWT/);
});

test("business context prompt includes language instruction", () => {
    const prompt = getBusinessContextPrompt({
        businessContext: { business_context: {} },
        language: "ru",
    });

    assert.match(prompt, /Answer in Russian/);
});

test("ai context sanitizer strips forbidden fields and limits arrays", () => {
    const rawContext = {
        get_low_stock_items: {
            count: 30,
            items: Array.from({ length: 25 }, (_, index) => ({
                product_id: index + 1,
                name: `Product ${index + 1}`,
                category: "Food",
                current_stock: 1,
                min_stock: 10,
                shortage: 9,
                store_id: 6,
                password_hash: "hidden",
                sql: "SELECT * FROM products",
            })),
        },
        get_top_products: {
            items: Array.from({ length: 8 }, (_, index) => ({
                product_id: index + 1,
                product_name: `Top ${index + 1}`,
                quantity_sold: 10,
                revenue: 100.555,
                store_id: 6,
            })),
        },
        get_recent_transactions: {
            transactions: Array.from({ length: 25 }, (_, index) => ({
                id: index + 1,
                date: "2026-06-09T10:35:00.000Z",
                total_amount: 2400.129,
                payment_type: "card",
                employee_name: "Test Owner",
                employee_email: "owner@example.com",
                phone: "123",
                items_count: 3,
                store_id: 6,
            })),
        },
    };

    const sanitized = sanitizeBusinessContext(rawContext);
    const serialized = JSON.stringify(sanitized);

    assert.equal(sanitized.low_stock_items.items.length, 20);
    assert.equal(sanitized.top_products.length, 5);
    assert.equal(sanitized.recent_transactions.length, 20);
    assert.equal(sanitized.top_products[0].revenue, 100.56);
    assert.doesNotMatch(serialized, /password_hash/);
    assert.doesNotMatch(serialized, /store_id/);
    assert.doesNotMatch(serialized, /SELECT \* FROM/);
    assert.doesNotMatch(serialized, /owner@example.com/);
    assert.doesNotMatch(serialized, /"id":/);
});

test("employee performance sanitizer keeps minimal employee fields only", () => {
    const sanitized = sanitizeEmployeePerformance({
        employees: [
            {
                id: 1,
                name: "Test Owner",
                role: "owner",
                email: "owner@example.com",
                phone: "123",
                password_hash: "hidden",
                store_id: 6,
                sales_total: 120000.456,
                orders_count: 15,
                last_login_ip: "127.0.0.1",
            },
        ],
    });

    assert.deepEqual(sanitized, [
        {
            name: "Test Owner",
            role: "owner",
            sales_total: 120000.46,
            orders_count: 15,
        },
    ]);
});

test("openai context validation rejects forbidden keys and token-like values", () => {
    const result = validateContextForOpenAI({
        sales_summary: {
            total_revenue: 100,
            password_hash: "hidden",
            note: ["sk", "testsecret1234567890"].join("-"),
        },
    });

    assert.equal(result.valid, false);
    assert.ok(result.issues.length >= 2);
});

test("openai service exposes safe backend-only config metadata", () => {
    const originalModel = process.env.OPENAI_MODEL;
    const originalApiKey = process.env.OPENAI_API_KEY;
    const originalEnabled = process.env.AI_CHAT_ENABLED;

    try {
        delete process.env.OPENAI_MODEL;
        process.env.OPENAI_API_KEY = "test-only-placeholder";
        process.env.AI_CHAT_ENABLED = "true";

        assert.equal(getOpenAiModel(), "gpt-4.1-mini");
        assert.deepEqual(getOpenAiConfig(), {
            enabled: true,
            model: "gpt-4.1-mini",
            hasApiKey: true,
        });
    } finally {
        if (originalModel === undefined) {
            delete process.env.OPENAI_MODEL;
        } else {
            process.env.OPENAI_MODEL = originalModel;
        }

        if (originalApiKey === undefined) {
            delete process.env.OPENAI_API_KEY;
        } else {
            process.env.OPENAI_API_KEY = originalApiKey;
        }

        if (originalEnabled === undefined) {
            delete process.env.AI_CHAT_ENABLED;
        } else {
            process.env.AI_CHAT_ENABLED = originalEnabled;
        }
    }
});
