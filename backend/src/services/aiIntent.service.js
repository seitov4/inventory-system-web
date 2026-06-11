import { AI_TOOL_NAMES } from "./aiTools.service.js";

function detectPeriod(message) {
    const text = String(message || "").toLowerCase();

    if (/\byesterday\b|\u0432\u0447\u0435\u0440\u0430/i.test(text)) {
        return "yesterday";
    }

    if (/\bweek\b|\u043d\u0435\u0434\u0435\u043b/i.test(text)) {
        return "week";
    }

    if (/\bmonth\b|\u043c\u0435\u0441\u044f\u0446/i.test(text)) {
        return "month";
    }

    if (/\btoday\b|\u0441\u0435\u0433\u043e\u0434\u043d\u044f/i.test(text)) {
        return "today";
    }

    return "today";
}

function cleanProductName(value) {
    return String(value || "")
        .replace(/[?.!,]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
}

function detectProductName(message) {
    const text = String(message || "");
    const patterns = [
        /how\s+much\s+(.+?)\s+(do\s+we\s+have|is\s+left|left|in\s+stock)/i,
        /stock\s+(for|of)\s+(.+)/i,
        /\u0441\u043a\u043e\u043b\u044c\u043a\u043e\s+\u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c\s+(.+)/i,
        /\u043e\u0441\u0442\u0430\u0442(\u043e\u043a|\u043a\u0438)\s+(.+)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (!match) {
            continue;
        }

        return cleanProductName(match[2] || match[1]);
    }

    return "";
}

export function resolveAiIntent(message) {
    const text = String(message || "").toLowerCase();
    const period = detectPeriod(message);
    const productName = detectProductName(message);

    if (
        /\brestock\b|should\s+i\s+restock|what\s+.*buy|\u0434\u043e\u043a\u0443\u043f|\u0437\u0430\u043a\u0443\u043f/i.test(text)
    ) {
        return {
            intent: "restock",
            tools: [
                {
                    name: AI_TOOL_NAMES.RESTOCK_RECOMMENDATIONS,
                    params: { limit: 10 },
                },
            ],
        };
    }

    if (/\blow\s+(in\s+)?stock\b|out\s+of\s+stock|\u0437\u0430\u043a\u0430\u043d\u0447\u0438\u0432\u0430|\u043d\u0438\u0437\u043a.*\u043e\u0441\u0442\u0430\u0442|\u043d\u0435\u0442\s+\u0432\s+\u043d\u0430\u043b\u0438\u0447\u0438\u0438/i.test(text)) {
        return {
            intent: "low_stock",
            tools: [
                {
                    name: AI_TOOL_NAMES.LOW_STOCK_ITEMS,
                    params: { limit: 10 },
                },
            ],
        };
    }

    if (/\btop[-\s]?selling\b|\bbest[-\s]?selling\b|best.*products|\u043b\u0443\u0447\u0448\u0438\u0435\s+\u0442\u043e\u0432\u0430\u0440|\u0441\u0430\u043c\u044b\u0435\s+\u043f\u0440\u043e\u0434\u0430\u0432\u0430\u0435\u043c|\u043f\u0440\u043e\u0434\u0430\u044e\u0442\u0441\u044f/i.test(text)) {
        return {
            intent: "top_products",
            tools: [
                {
                    name: AI_TOOL_NAMES.TOP_PRODUCTS,
                    params: { period: period === "today" ? "month" : period, limit: 5 },
                },
            ],
        };
    }

    if (/\bcategory\b|\bcategories\b|by\s+category|\u043a\u0430\u0442\u0435\u0433\u043e\u0440/i.test(text)) {
        return {
            intent: "category_performance",
            tools: [
                {
                    name: AI_TOOL_NAMES.CATEGORY_PERFORMANCE,
                    params: { period: period === "today" ? "month" : period },
                },
            ],
        };
    }

    if (/\brecent\s+sales\b|\brecent\s+transactions\b|last\s+sales|\u043f\u043e\u0441\u043b\u0435\u0434\u043d.*\u043f\u0440\u043e\u0434\u0430\u0436/i.test(text)) {
        return {
            intent: "recent_transactions",
            tools: [
                {
                    name: AI_TOOL_NAMES.RECENT_TRANSACTIONS,
                    params: { limit: 10 },
                },
            ],
        };
    }

    if (productName && /\bstock\b|do\s+we\s+have|is\s+left|\u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c|\u043e\u0441\u0442\u0430\u0442/i.test(text)) {
        return {
            intent: "product_stock",
            tools: [
                {
                    name: AI_TOOL_NAMES.PRODUCT_STOCK,
                    params: { productName, limit: 5 },
                },
            ],
        };
    }

    if (/\blower\b|trend|chart|show\s+sales|\u0434\u0438\u043d\u0430\u043c\u0438\u043a|\u043d\u0438\u0436\u0435/i.test(text)) {
        return {
            intent: "sales_trend",
            tools: [
                {
                    name: AI_TOOL_NAMES.SALES_SUMMARY,
                    params: { period },
                },
                {
                    name: AI_TOOL_NAMES.SALES_BY_PERIOD,
                    params: { period: period === "today" ? "week" : period },
                },
            ],
        };
    }

    if (/\bsales?\b|\bsell\b|\bsold\b|\brevenue\b|\bincome\b|\borders?\b|\u043f\u0440\u043e\u0434\u0430\u0436|\u0432\u044b\u0440\u0443\u0447\u043a|\u0434\u043e\u0445\u043e\u0434|\u0437\u0430\u043a\u0430\u0437/i.test(text)) {
        return {
            intent: "sales_summary",
            tools: [
                {
                    name: AI_TOOL_NAMES.SALES_SUMMARY,
                    params: { period },
                },
            ],
        };
    }

    return {
        intent: "general_business_context",
        tools: [
            {
                name: AI_TOOL_NAMES.SALES_SUMMARY,
                params: { period: "today" },
            },
            {
                name: AI_TOOL_NAMES.LOW_STOCK_ITEMS,
                params: { limit: 5 },
            },
            {
                name: AI_TOOL_NAMES.TOP_PRODUCTS,
                params: { period: "month", limit: 5 },
            },
        ],
    };
}
