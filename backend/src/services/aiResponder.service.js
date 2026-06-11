import { AI_TOOL_NAMES } from "./aiTools.service.js";

const RULE_BASED_TOOL_NAMES = new Set(Object.values(AI_TOOL_NAMES));
const MAX_DISPLAY_ITEMS = 5;

const BASIC_ANSWERS = Object.freeze({
    en: {
        greeting: "Hello. I can help you analyze your store data, including sales, stock levels, products, reports, and restocking recommendations.",
        thanks: "You are welcome. You can ask me about sales, stock levels, top products, reports, or restocking.",
        confirmation: "Good. Ask me anytime about your store's sales, stock, products, reports, or restocking needs.",
        goodbye: "Goodbye. I will be ready to help with your store data whenever you need.",
    },
    ru: {
        greeting: "\u0417\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435. \u042f \u043c\u043e\u0433\u0443 \u043f\u043e\u043c\u043e\u0447\u044c \u0441 \u0430\u043d\u0430\u043b\u0438\u0437\u043e\u043c \u0434\u0430\u043d\u043d\u044b\u0445 \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0430: \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u043c\u0438, \u043e\u0441\u0442\u0430\u0442\u043a\u0430\u043c\u0438, \u0442\u043e\u0432\u0430\u0440\u0430\u043c\u0438, \u043e\u0442\u0447\u0435\u0442\u0430\u043c\u0438 \u0438 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0438\u044f\u043c\u0438 \u043f\u043e \u0437\u0430\u043a\u0443\u043f\u043a\u0435.",
        thanks: "\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430. \u0412\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u0441\u043f\u0440\u043e\u0441\u0438\u0442\u044c \u043c\u0435\u043d\u044f \u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u0445, \u043e\u0441\u0442\u0430\u0442\u043a\u0430\u0445, \u043f\u043e\u043f\u0443\u043b\u044f\u0440\u043d\u044b\u0445 \u0442\u043e\u0432\u0430\u0440\u0430\u0445, \u043e\u0442\u0447\u0435\u0442\u0430\u0445 \u0438\u043b\u0438 \u0437\u0430\u043a\u0443\u043f\u043a\u0435.",
        confirmation: "\u0425\u043e\u0440\u043e\u0448\u043e. \u0412\u044b \u043c\u043e\u0436\u0435\u0442\u0435 \u0432 \u043b\u044e\u0431\u043e\u0439 \u043c\u043e\u043c\u0435\u043d\u0442 \u0441\u043f\u0440\u043e\u0441\u0438\u0442\u044c \u043c\u0435\u043d\u044f \u043e \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u0445, \u043e\u0441\u0442\u0430\u0442\u043a\u0430\u0445, \u0442\u043e\u0432\u0430\u0440\u0430\u0445, \u043e\u0442\u0447\u0435\u0442\u0430\u0445 \u0438\u043b\u0438 \u0437\u0430\u043a\u0443\u043f\u043a\u0435.",
        goodbye: "\u0414\u043e \u0441\u0432\u0438\u0434\u0430\u043d\u0438\u044f. \u042f \u0431\u0443\u0434\u0443 \u0433\u043e\u0442\u043e\u0432 \u043f\u043e\u043c\u043e\u0447\u044c \u0441 \u0434\u0430\u043d\u043d\u044b\u043c\u0438 \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0430, \u043a\u043e\u0433\u0434\u0430 \u043f\u043e\u043d\u0430\u0434\u043e\u0431\u0438\u0442\u0441\u044f.",
    },
});

const BASIC_PATTERNS = Object.freeze({
    en: {
        greeting: new Set(["hi", "hello", "hey", "good morning", "good afternoon", "good evening"]),
        thanks: new Set(["thanks", "thank you", "thx", "appreciate it"]),
        confirmation: new Set(["ok", "okay", "got it", "understood", "clear"]),
        goodbye: new Set(["bye", "goodbye", "see you", "see you later"]),
    },
    ru: {
        greeting: new Set([
            "\u043f\u0440\u0438\u0432\u0435\u0442",
            "\u0437\u0434\u0440\u0430\u0432\u0441\u0442\u0432\u0443\u0439\u0442\u0435",
            "\u0434\u043e\u0431\u0440\u044b\u0439 \u0434\u0435\u043d\u044c",
            "\u0434\u043e\u0431\u0440\u043e\u0435 \u0443\u0442\u0440\u043e",
            "\u0434\u043e\u0431\u0440\u044b\u0439 \u0432\u0435\u0447\u0435\u0440",
        ]),
        thanks: new Set(["\u0441\u043f\u0430\u0441\u0438\u0431\u043e", "\u0431\u043b\u0430\u0433\u043e\u0434\u0430\u0440\u044e", "\u0441\u043f\u0441"]),
        confirmation: new Set([
            "\u043e\u043a",
            "\u0445\u043e\u0440\u043e\u0448\u043e",
            "\u043f\u043e\u043d\u044f\u0442\u043d\u043e",
            "\u044f\u0441\u043d\u043e",
            "\u043f\u043e\u043d\u044f\u043b",
            "\u043f\u043e\u043d\u044f\u043b\u0430",
        ]),
        goodbye: new Set([
            "\u043f\u043e\u043a\u0430",
            "\u0434\u043e \u0441\u0432\u0438\u0434\u0430\u043d\u0438\u044f",
            "\u0443\u0432\u0438\u0434\u0438\u043c\u0441\u044f",
        ]),
    },
});

const BUSINESS_KEYWORD_PATTERN = /\b(sales?|revenue|stock|products?|reports?|categor(?:y|ies)|restock|warehouse|analytics?)\b|\u043f\u0440\u043e\u0434\u0430\u0436|\u0432\u044b\u0440\u0443\u0447\u043a|\u043e\u0441\u0442\u0430\u0442|\u0442\u043e\u0432\u0430\u0440|\u043e\u0442\u0447[\u0435\u0451]\u0442|\u043a\u0430\u0442\u0435\u0433\u043e\u0440|\u0437\u0430\u043a\u0443\u043f|\u0441\u043a\u043b\u0430\u0434|\u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a/i;

function hasCyrillic(value) {
    return /[\u0400-\u04FF]/.test(String(value || ""));
}

function normalizeLanguage(language, message) {
    if (language === "ru" || language === "en") {
        return language;
    }

    return hasCyrillic(message) ? "ru" : "en";
}

function normalizeBasicMessage(message) {
    return String(message || "")
        .trim()
        .toLowerCase()
        .replace(/[!?.,;:()[\]{}"'`]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function detectBasicType(normalizedMessage) {
    for (const language of ["en", "ru"]) {
        for (const [type, values] of Object.entries(BASIC_PATTERNS[language])) {
            if (values.has(normalizedMessage)) {
                return type;
            }
        }
    }

    return null;
}

export function buildBasicChatAnswer({ message, language }) {
    const normalizedMessage = normalizeBasicMessage(message);

    if (!normalizedMessage || BUSINESS_KEYWORD_PATTERN.test(message || "")) {
        return { handled: false, answer: null };
    }

    const type = detectBasicType(normalizedMessage);

    if (!type) {
        return { handled: false, answer: null };
    }

    const answerLanguage = normalizeLanguage(language, message);

    return {
        handled: true,
        type,
        answer: BASIC_ANSWERS[answerLanguage][type],
    };
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : fallback;
}

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function isUnavailable(value) {
    return value && typeof value === "object" && value.unavailable === true;
}

function hasComplexAnalyticalAsk(message) {
    const text = String(message || "").toLowerCase();
    return /\bwhy\b|\bcompare\b|\bcompared\b|\breason\b|\blower\b|\bdrop\b|\bdecline\b|\bdecrease\b|\bchanged\b|\u043f\u043e\u0447\u0435\u043c\u0443|\u0441\u0440\u0430\u0432\u043d|\u043d\u0438\u0436\u0435|\u0443\u043f\u0430\u043b|\u0441\u043d\u0438\u0437/i.test(text);
}

function getFirstToolResult(toolResults) {
    const firstEntry = Object.entries(toolResults || {}).find(([, result]) => result);
    return firstEntry?.[1] || null;
}

function getToolResult(toolResults, toolName) {
    return toolResults?.[toolName] || null;
}

export function formatNumber(value, language = "en") {
    const locale = language === "ru" ? "ru-RU" : "en-US";
    return toNumber(value).toLocaleString(locale, {
        maximumFractionDigits: 2,
    });
}

export function formatMoney(value, language = "en") {
    return `${formatNumber(value, language)} KZT`;
}

export function formatPercent(value, language = "en") {
    const suffix = language === "ru" ? " %" : "%";
    return `${formatNumber(value, language)}${suffix}`;
}

export function formatDate(value, language = "en") {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toISOString().slice(0, 10);
}

function joinNames(items, language) {
    const names = items
        .map((item) => item?.name || item?.product_name || item?.category)
        .filter(Boolean)
        .slice(0, MAX_DISPLAY_ITEMS);

    if (names.length <= 1) {
        return names.join("");
    }

    const last = names[names.length - 1];
    const rest = names.slice(0, -1).join(", ");
    return `${rest} ${language === "ru" ? "\u0438" : "and"} ${last}`;
}

function periodLabel(period, language) {
    const labels = {
        en: {
            today: "today",
            yesterday: "yesterday",
            week: "this week",
            month: "this month",
            custom: "this period",
        },
        ru: {
            today: "\u0441\u0435\u0433\u043e\u0434\u043d\u044f",
            yesterday: "\u0432\u0447\u0435\u0440\u0430",
            week: "\u0437\u0430 \u044d\u0442\u0443 \u043d\u0435\u0434\u0435\u043b\u044e",
            month: "\u0437\u0430 \u044d\u0442\u043e\u0442 \u043c\u0435\u0441\u044f\u0446",
            custom: "\u0437\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u043f\u0435\u0440\u0438\u043e\u0434",
        },
    };

    return labels[language]?.[period] || labels[language].custom;
}

function ruPeriodWithPreposition(period) {
    const label = periodLabel(period, "ru");
    return label.startsWith("\u0437\u0430 ") ? label : `\u0437\u0430 ${label}`;
}

function answerSalesSummary(result, language) {
    const revenue = toNumber(result?.total_revenue);
    const orders = toInteger(result?.orders_count);
    const items = toInteger(result?.items_sold);
    const averageOrderValue = toNumber(result?.average_order_value);
    const period = result?.period || "today";

    if (revenue === 0 && orders === 0) {
        return language === "ru"
            ? `\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043d\u044b\u0445 \u043f\u0440\u043e\u0434\u0430\u0436 ${ruPeriodWithPreposition(period)} \u043d\u0435\u0442.`
            : `There are no completed sales for ${periodLabel(period, language)}.`;
    }

    if (language === "ru") {
        const averagePart = averageOrderValue
            ? `, \u0441\u0440\u0435\u0434\u043d\u0438\u0439 \u0447\u0435\u043a - ${formatMoney(averageOrderValue, language)}`
            : "";
        return `\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043d\u044b\u0435 \u043f\u0440\u043e\u0434\u0430\u0436\u0438 ${periodLabel(period, language)} \u0441\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u044e\u0442 ${formatMoney(revenue, language)} \u043f\u043e ${formatNumber(orders, language)} \u0437\u0430\u043a\u0430\u0437\u0430\u043c. \u0412\u0441\u0435\u0433\u043e \u043f\u0440\u043e\u0434\u0430\u043d\u043e ${formatNumber(items, language)} \u0442\u043e\u0432\u0430\u0440\u043e\u0432${averagePart}.`;
    }

    const averagePart = averageOrderValue
        ? `, with an average order value of ${formatMoney(averageOrderValue, language)}`
        : "";
    return `Completed sales for ${periodLabel(period, language)} are ${formatMoney(revenue, language)} from ${formatNumber(orders, language)} orders. A total of ${formatNumber(items, language)} items were sold${averagePart}.`;
}

function answerSalesByPeriod(result, language) {
    const summary = result?.summary || {};
    const revenue = toNumber(summary.total_revenue);
    const orders = toInteger(summary.orders_count);
    const items = toInteger(summary.items_sold);
    const series = asArray(result?.series);
    const highestDay = series.reduce((best, row) => {
        if (!best || toNumber(row.revenue) > toNumber(best.revenue)) {
            return row;
        }
        return best;
    }, null);

    if (revenue === 0 && orders === 0 && series.length === 0) {
        return language === "ru"
            ? "\u0417\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u043f\u0435\u0440\u0438\u043e\u0434 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043d\u044b\u0445 \u043f\u0440\u043e\u0434\u0430\u0436 \u043d\u0435\u0442."
            : "There are no completed sales for this period.";
    }

    if (language === "ru") {
        const highestPart = highestDay
            ? ` \u0421\u0430\u043c\u044b\u0439 \u0432\u044b\u0441\u043e\u043a\u0438\u0439 \u0434\u0435\u043d\u044c \u043f\u0440\u043e\u0434\u0430\u0436 - ${formatDate(highestDay.date, language)}, \u0432\u044b\u0440\u0443\u0447\u043a\u0430 ${formatMoney(highestDay.revenue, language)}.`
            : "";
        return `\u041f\u0440\u043e\u0434\u0430\u0436\u0438 \u0437\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u043f\u0435\u0440\u0438\u043e\u0434 \u0441\u043e\u0441\u0442\u0430\u0432\u043b\u044f\u044e\u0442 ${formatMoney(revenue, language)} \u043f\u043e ${formatNumber(orders, language)} \u0437\u0430\u043a\u0430\u0437\u0430\u043c. \u0412\u0441\u0435\u0433\u043e \u043f\u0440\u043e\u0434\u0430\u043d\u043e ${formatNumber(items, language)} \u0442\u043e\u0432\u0430\u0440\u043e\u0432.${highestPart}`;
    }

    const highestPart = highestDay
        ? ` The highest sales day was ${formatDate(highestDay.date, language)} with ${formatMoney(highestDay.revenue, language)}.`
        : "";
    return `Sales for this period reached ${formatMoney(revenue, language)} across ${formatNumber(orders, language)} orders. The data includes ${formatNumber(items, language)} sold items.${highestPart}`;
}

function answerLowStock(result, language) {
    const items = asArray(result?.items);
    const count = toInteger(result?.count, items.length);
    const names = joinNames(items, language);

    if (!items.length) {
        return language === "ru"
            ? "\u0421\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0442 \u0442\u043e\u0432\u0430\u0440\u043e\u0432 \u0441 \u043d\u0438\u0437\u043a\u0438\u043c \u043e\u0441\u0442\u0430\u0442\u043a\u043e\u043c."
            : "There are no low-stock products at the moment.";
    }

    if (count === 1) {
        return language === "ru"
            ? `\u0421\u0435\u0439\u0447\u0430\u0441 \u0435\u0441\u0442\u044c 1 \u0442\u043e\u0432\u0430\u0440 \u0441 \u043d\u0438\u0437\u043a\u0438\u043c \u043e\u0441\u0442\u0430\u0442\u043a\u043e\u043c: ${names}.`
            : `There is 1 low-stock product: ${names}.`;
    }

    return language === "ru"
        ? `\u0421\u0435\u0439\u0447\u0430\u0441 \u0432 \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0435 ${formatNumber(count, language)} \u0442\u043e\u0432\u0430\u0440\u043e\u0432 \u0441 \u043d\u0438\u0437\u043a\u0438\u043c \u043e\u0441\u0442\u0430\u0442\u043a\u043e\u043c. \u0412 \u043f\u0435\u0440\u0432\u0443\u044e \u043e\u0447\u0435\u0440\u0435\u0434\u044c \u0441\u0442\u043e\u0438\u0442 \u043f\u0440\u043e\u0432\u0435\u0440\u0438\u0442\u044c: ${names}.`
        : `There are ${formatNumber(count, language)} low-stock products. The most urgent items to check are ${names}.`;
}

function answerTopProducts(result, language) {
    const items = asArray(result?.items);

    if (!items.length) {
        return language === "ru"
            ? "\u0417\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u043f\u0435\u0440\u0438\u043e\u0434 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e \u043f\u0440\u043e\u0434\u0430\u0432\u0430\u0435\u043c\u044b\u0445 \u0442\u043e\u0432\u0430\u0440\u043e\u0432."
            : "No top-selling products were found for this period.";
    }

    const top = items[0];
    const others = joinNames(items.slice(1), language);

    if (language === "ru") {
        const otherPart = others ? ` \u0422\u0430\u043a\u0436\u0435 \u0445\u043e\u0440\u043e\u0448\u043e \u043f\u0440\u043e\u0434\u0430\u044e\u0442\u0441\u044f ${others}.` : "";
        return `\u0421\u0430\u043c\u044b\u0439 \u043f\u0440\u043e\u0434\u0430\u0432\u0430\u0435\u043c\u044b\u0439 \u0442\u043e\u0432\u0430\u0440 ${periodLabel(result?.period || "month", language)} - ${top.product_name}: \u043f\u0440\u043e\u0434\u0430\u043d\u043e ${formatNumber(top.quantity_sold, language)} \u0435\u0434\u0438\u043d\u0438\u0446, \u0432\u044b\u0440\u0443\u0447\u043a\u0430 ${formatMoney(top.revenue, language)}.${otherPart}`;
    }

    const otherPart = others ? ` Other strong products include ${others}.` : "";
    return `The top-selling product ${periodLabel(result?.period || "month", language)} is ${top.product_name} with ${formatNumber(top.quantity_sold, language)} units sold and ${formatMoney(top.revenue, language)} in revenue.${otherPart}`;
}

function answerProductStock(result, language) {
    const matches = asArray(result?.matches);

    if (!matches.length) {
        return language === "ru"
            ? "\u0422\u0430\u043a\u043e\u0439 \u0442\u043e\u0432\u0430\u0440 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d \u0432 \u0432\u0430\u0448\u0435\u043c \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0435."
            : "No matching product was found in your store.";
    }

    const item = matches[0];
    const stock = toInteger(item.stock ?? item.current_stock);
    const minStock = toInteger(item.min_stock);
    const isBelowMinimum = stock <= minStock;

    if (language === "ru") {
        return isBelowMinimum
            ? `${item.name} \u0441\u0435\u0439\u0447\u0430\u0441 \u0438\u043c\u0435\u0435\u0442 ${formatNumber(stock, language)} \u0435\u0434\u0438\u043d\u0438\u0446 \u043d\u0430 \u0441\u043a\u043b\u0430\u0434\u0435. \u041c\u0438\u043d\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u043e\u0441\u0442\u0430\u0442\u043e\u043a - ${formatNumber(minStock, language)}, \u043f\u043e\u044d\u0442\u043e\u043c\u0443 \u0442\u043e\u0432\u0430\u0440 \u043d\u0438\u0436\u0435 \u043d\u0443\u0436\u043d\u043e\u0433\u043e \u0443\u0440\u043e\u0432\u043d\u044f.`
            : `${item.name} \u0441\u0435\u0439\u0447\u0430\u0441 \u0438\u043c\u0435\u0435\u0442 ${formatNumber(stock, language)} \u0435\u0434\u0438\u043d\u0438\u0446 \u043d\u0430 \u0441\u043a\u043b\u0430\u0434\u0435. \u042d\u0442\u043e \u0432\u044b\u0448\u0435 \u043c\u0438\u043d\u0438\u043c\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u043e\u0441\u0442\u0430\u0442\u043a\u0430 ${formatNumber(minStock, language)}.`;
    }

    return isBelowMinimum
        ? `${item.name} currently has ${formatNumber(stock, language)} units in stock. The minimum stock level is ${formatNumber(minStock, language)}, so this product is below the required level.`
        : `${item.name} currently has ${formatNumber(stock, language)} units in stock. This is above the minimum stock level of ${formatNumber(minStock, language)}.`;
}

function answerCategoryPerformance(result, language) {
    const categories = asArray(result?.categories);

    if (!categories.length) {
        return language === "ru"
            ? "\u0417\u0430 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0439 \u043f\u0435\u0440\u0438\u043e\u0434 \u043f\u0440\u043e\u0434\u0430\u0436\u0438 \u043f\u043e \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f\u043c \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b."
            : "No category sales were found for this period.";
    }

    const top = categories[0];
    const others = joinNames(categories.slice(1), language);

    if (language === "ru") {
        const otherPart = others ? ` \u0422\u0430\u043a\u0436\u0435 \u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438: ${others}.` : ` \u042d\u0442\u043e ${formatPercent(top.share_percent, language)} \u043f\u0440\u043e\u0434\u0430\u0436 \u043f\u043e \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f\u043c.`;
        return `\u041b\u0438\u0434\u0438\u0440\u0443\u044e\u0449\u0430\u044f \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f ${periodLabel(result?.period || "month", language)} - ${top.category} \u0441 \u0432\u044b\u0440\u0443\u0447\u043a\u043e\u0439 ${formatMoney(top.revenue, language)}.${otherPart}`;
    }

    const otherPart = others ? ` Other active categories include ${others}.` : ` It represents ${formatPercent(top.share_percent, language)} of category sales.`;
    return `The leading category ${periodLabel(result?.period || "month", language)} is ${top.category} with ${formatMoney(top.revenue, language)} in revenue.${otherPart}`;
}

function answerRecentTransactions(result, language) {
    const transactions = asArray(result?.transactions);

    if (!transactions.length) {
        return language === "ru"
            ? "\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043d\u044b\u0435 \u043f\u0440\u043e\u0434\u0430\u0436\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b."
            : "No recent completed sales were found.";
    }

    const latest = transactions[0];
    const paymentType = latest.payment_type || (language === "ru" ? "\u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d" : "not specified");

    return language === "ru"
        ? `\u041d\u0430\u0439\u0434\u0435\u043d\u043e ${formatNumber(transactions.length, language)} \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0445 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043d\u044b\u0445 \u043f\u0440\u043e\u0434\u0430\u0436. \u041f\u043e\u0441\u043b\u0435\u0434\u043d\u044f\u044f \u043f\u0440\u043e\u0434\u0430\u0436\u0430 \u0441\u043e\u0441\u0442\u0430\u0432\u0438\u043b\u0430 ${formatMoney(latest.total_amount, language)}, \u0442\u0438\u043f \u043e\u043f\u043b\u0430\u0442\u044b - ${paymentType}.`
        : `The system found ${formatNumber(transactions.length, language)} recent completed sales. The latest transaction was ${formatMoney(latest.total_amount, language)} paid by ${paymentType}.`;
}

function answerRestockRecommendations(result, language) {
    const recommendations = asArray(result?.recommendations);
    const names = joinNames(recommendations, language);

    if (!recommendations.length) {
        return language === "ru"
            ? "\u0421\u0435\u0439\u0447\u0430\u0441 \u043d\u0435\u0442 \u0441\u0440\u043e\u0447\u043d\u044b\u0445 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0438\u0439 \u043f\u043e \u0437\u0430\u043a\u0443\u043f\u043a\u0435."
            : "There are no urgent restock recommendations at the moment.";
    }

    if (recommendations.length === 1) {
        const item = recommendations[0];
        return language === "ru"
            ? `\u0412 \u043f\u0435\u0440\u0432\u0443\u044e \u043e\u0447\u0435\u0440\u0435\u0434\u044c \u0441\u0442\u043e\u0438\u0442 \u0434\u043e\u043a\u0443\u043f\u0438\u0442\u044c ${item.product_name}. \u0422\u0435\u043a\u0443\u0449\u0438\u0439 \u043e\u0441\u0442\u0430\u0442\u043e\u043a - ${formatNumber(item.current_stock, language)}, \u043c\u0438\u043d\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u043e\u0441\u0442\u0430\u0442\u043e\u043a - ${formatNumber(item.min_stock, language)}, \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u043c\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0434\u043b\u044f \u0437\u0430\u043a\u0443\u043f\u043a\u0438 - ${formatNumber(item.recommended_quantity, language)}.`
            : `You should prioritize restocking ${item.product_name}. Current stock is ${formatNumber(item.current_stock, language)}, minimum stock is ${formatNumber(item.min_stock, language)}, and the recommended restock quantity is ${formatNumber(item.recommended_quantity, language)}.`;
    }

    return language === "ru"
        ? `\u0412 \u043f\u0435\u0440\u0432\u0443\u044e \u043e\u0447\u0435\u0440\u0435\u0434\u044c \u0441\u0442\u043e\u0438\u0442 \u0434\u043e\u043a\u0443\u043f\u0438\u0442\u044c ${names}. \u042d\u0442\u0438 \u0442\u043e\u0432\u0430\u0440\u044b \u043d\u0438\u0436\u0435 \u043c\u0438\u043d\u0438\u043c\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u043e\u0441\u0442\u0430\u0442\u043a\u0430 \u0438 \u0438\u043c\u0435\u044e\u0442 \u043d\u0435\u0434\u0430\u0432\u043d\u044e\u044e \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c \u043f\u0440\u043e\u0434\u0430\u0436.`
        : `You should prioritize restocking ${names}. These products are below their minimum stock level and have recent sales activity.`;
}

function getPrimaryToolName({ intent, toolResults }) {
    if (intent === "sales_summary") return AI_TOOL_NAMES.SALES_SUMMARY;
    if (intent === "sales_by_period" || intent === "sales_trend") return AI_TOOL_NAMES.SALES_BY_PERIOD;
    if (intent === "low_stock" || intent === "low_stock_items") return AI_TOOL_NAMES.LOW_STOCK_ITEMS;
    if (intent === "top_products") return AI_TOOL_NAMES.TOP_PRODUCTS;
    if (intent === "product_stock") return AI_TOOL_NAMES.PRODUCT_STOCK;
    if (intent === "category_performance") return AI_TOOL_NAMES.CATEGORY_PERFORMANCE;
    if (intent === "recent_transactions") return AI_TOOL_NAMES.RECENT_TRANSACTIONS;
    if (intent === "restock" || intent === "restock_recommendations") return AI_TOOL_NAMES.RESTOCK_RECOMMENDATIONS;

    return Object.keys(toolResults || {}).find((toolName) => RULE_BASED_TOOL_NAMES.has(toolName));
}

function buildAnswerForTool(toolName, result, language) {
    if (toolName === AI_TOOL_NAMES.SALES_SUMMARY) return answerSalesSummary(result, language);
    if (toolName === AI_TOOL_NAMES.SALES_BY_PERIOD) return answerSalesByPeriod(result, language);
    if (toolName === AI_TOOL_NAMES.LOW_STOCK_ITEMS) return answerLowStock(result, language);
    if (toolName === AI_TOOL_NAMES.TOP_PRODUCTS) return answerTopProducts(result, language);
    if (toolName === AI_TOOL_NAMES.PRODUCT_STOCK) return answerProductStock(result, language);
    if (toolName === AI_TOOL_NAMES.CATEGORY_PERFORMANCE) return answerCategoryPerformance(result, language);
    if (toolName === AI_TOOL_NAMES.RECENT_TRANSACTIONS) return answerRecentTransactions(result, language);
    if (toolName === AI_TOOL_NAMES.RESTOCK_RECOMMENDATIONS) return answerRestockRecommendations(result, language);
    return null;
}

export function buildRuleBasedAnswer({ intent, toolResults, language, message }) {
    const answerLanguage = normalizeLanguage(language, message);
    const results = toolResults || {};

    if (!Object.keys(results).length || Object.values(results).some(isUnavailable)) {
        return { handled: false, answer: null };
    }

    if (hasComplexAnalyticalAsk(message)) {
        return { handled: false, answer: null };
    }

    const primaryToolName = getPrimaryToolName({ intent, toolResults: results });
    const primaryResult = getToolResult(results, primaryToolName) || getFirstToolResult(results);

    if (!primaryToolName || !primaryResult) {
        return { handled: false, answer: null };
    }

    const answer = buildAnswerForTool(primaryToolName, primaryResult, answerLanguage);

    return answer
        ? { handled: true, answer }
        : { handled: false, answer: null };
}
