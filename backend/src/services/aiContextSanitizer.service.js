const FORBIDDEN_KEY_PATTERNS = [
    /password/i,
    /password_hash/i,
    /token/i,
    /^jwt$/i,
    /secret/i,
    /api[_-]?key/i,
    /openai[_-]?api[_-]?key/i,
    /authorization/i,
    /^auth$/i,
    /refresh[_-]?token/i,
    /access[_-]?token/i,
    /database[_-]?url/i,
    /db[_-]?url/i,
    /connection[_-]?string/i,
    /schema/i,
    /^sql$/i,
    /^query$/i,
    /stack/i,
    /stacktrace/i,
    /system[_-]?prompt/i,
    /^prompt$/i,
    /source[_-]?code/i,
    /^route$/i,
    /endpoint/i,
    /platform[_-]?admin/i,
    /last[_-]?login[_-]?ip/i,
    /^store[_-]?id$/i,
    /^cashier[_-]?id$/i,
    /^user[_-]?id$/i,
    /^id$/i,
    /created[_-]?at/i,
    /updated[_-]?at/i,
    /^email$/i,
    /^phone$/i,
];

const TOKEN_LIKE_PATTERNS = [
    /\bsk-[A-Za-z0-9_-]{12,}\b/,
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
];

const ARRAY_LIMITS = Object.freeze({
    top_products: 5,
    items: 20,
    low_stock_items: 20,
    recent_transactions: 20,
    transactions: 20,
    categories: 10,
    employees: 10,
    employee_performance: 10,
    sales_by_day: 31,
    series: 31,
    recommendations: 20,
    matches: 10,
});

function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isForbiddenKey(key) {
    return FORBIDDEN_KEY_PATTERNS.some((pattern) => pattern.test(String(key)));
}

function isPrivateValue(value) {
    if (typeof value !== "string") {
        return false;
    }

    return TOKEN_LIKE_PATTERNS.some((pattern) => pattern.test(value));
}

function toNumber(value, decimals = 2) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 0;
    }
    return Number(parsed.toFixed(decimals));
}

function toInteger(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) ? parsed : 0;
}

function normalizeDate(value) {
    if (!value) {
        return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }

    return date.toISOString().slice(0, 10);
}

function limitArrayByKey(key, value) {
    const limit = ARRAY_LIMITS[key] || ARRAY_LIMITS[value?.name] || 20;
    return value.slice(0, limit);
}

function removeForbiddenFields(value, parentKey = "") {
    if (Array.isArray(value)) {
        return limitArrayByKey(parentKey, value)
            .map((item) => removeForbiddenFields(item, parentKey))
            .filter((item) => item !== undefined && item !== null);
    }

    if (!isPlainObject(value)) {
        if (value === null || value === undefined || isPrivateValue(value)) {
            return undefined;
        }
        return value;
    }

    const sanitized = {};

    for (const [key, childValue] of Object.entries(value)) {
        if (isForbiddenKey(key)) {
            continue;
        }

        const sanitizedValue = removeForbiddenFields(childValue, key);
        if (sanitizedValue === undefined || sanitizedValue === null) {
            continue;
        }

        sanitized[key] = sanitizedValue;
    }

    return sanitized;
}

export function sanitizeSalesSummary(data = {}) {
    return removeForbiddenFields({
        period: data.period,
        from: data.from,
        to: data.to,
        total_revenue: toNumber(data.total_revenue),
        orders_count: toInteger(data.orders_count),
        items_sold: toInteger(data.items_sold),
        average_order_value: toNumber(data.average_order_value),
    });
}

export function sanitizeTopProducts(data = {}) {
    const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];

    return items.slice(0, ARRAY_LIMITS.top_products).map((item) =>
        removeForbiddenFields({
            name: item.product_name || item.name,
            category: item.category,
            quantity_sold: toInteger(item.quantity_sold),
            revenue: toNumber(item.revenue),
        })
    );
}

export function sanitizeLowStockItems(data = {}) {
    const items = Array.isArray(data.items) ? data.items : [];

    return {
        count: toInteger(data.count || items.length),
        items: items.slice(0, ARRAY_LIMITS.low_stock_items).map((item) =>
            removeForbiddenFields({
                name: item.name,
                category: item.category,
                current_stock: toInteger(item.current_stock ?? item.stock),
                min_stock: toInteger(item.min_stock),
                shortage: toInteger(item.shortage),
                recommended_restock: toInteger(item.recommended_restock),
            })
        ),
    };
}

export function sanitizeCategoryPerformance(data = {}) {
    const categories = Array.isArray(data.categories) ? data.categories : [];

    return {
        period: data.period,
        categories: categories.slice(0, ARRAY_LIMITS.categories).map((item) =>
            removeForbiddenFields({
                category: item.category,
                revenue: toNumber(item.revenue),
                quantity_sold: toInteger(item.quantity_sold),
                orders_count: toInteger(item.orders_count),
                share_percent: toNumber(item.share_percent, 1),
            })
        ),
    };
}

export function sanitizeRecentTransactions(data = {}) {
    const transactions = Array.isArray(data.transactions) ? data.transactions : [];

    return transactions.slice(0, ARRAY_LIMITS.recent_transactions).map((item) =>
        removeForbiddenFields({
            date: normalizeDate(item.date),
            total_revenue: toNumber(item.total_amount ?? item.revenue),
            payment_type: item.payment_type,
            employee_name: item.employee_name,
            items_count: toInteger(item.items_count),
        })
    );
}

export function sanitizeEmployeePerformance(data = {}) {
    const employees = Array.isArray(data.employees)
        ? data.employees
        : Array.isArray(data.employee_performance)
          ? data.employee_performance
          : Array.isArray(data)
            ? data
            : [];

    return employees.slice(0, ARRAY_LIMITS.employee_performance).map((employee) =>
        removeForbiddenFields({
            name: employee.name || employee.display_name || employee.role || "Employee",
            role: employee.role,
            sales_total: toNumber(employee.sales_total ?? employee.total_revenue),
            orders_count: toInteger(employee.orders_count),
        })
    );
}

export function sanitizeRestockRecommendations(data = {}) {
    const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

    return recommendations.slice(0, ARRAY_LIMITS.recommendations).map((item) =>
        removeForbiddenFields({
            product_name: item.product_name || item.name,
            category: item.category,
            reason: item.reason,
            current_stock: toInteger(item.current_stock),
            min_stock: toInteger(item.min_stock),
            recent_quantity_sold: toInteger(item.recent_quantity_sold),
            recommended_quantity: toInteger(item.recommended_quantity),
        })
    );
}

export function sanitizeProductStock(data = {}) {
    const matches = Array.isArray(data.matches) ? data.matches : [];

    return matches.slice(0, ARRAY_LIMITS.matches).map((item) =>
        removeForbiddenFields({
            name: item.name,
            category: item.category,
            stock: toInteger(item.stock ?? item.current_stock),
            min_stock: toInteger(item.min_stock),
            status: item.status,
        })
    );
}

export function sanitizeSalesByDay(data = {}) {
    const series = Array.isArray(data.series) ? data.series : [];

    return {
        period: data.period,
        sales_by_day: series.slice(0, ARRAY_LIMITS.sales_by_day).map((item) =>
            removeForbiddenFields({
                date: normalizeDate(item.date),
                revenue: toNumber(item.revenue),
                orders_count: toInteger(item.orders_count),
                items_sold: toInteger(item.items_sold),
            })
        ),
        summary: removeForbiddenFields({
            total_revenue: toNumber(data.summary?.total_revenue),
            orders_count: toInteger(data.summary?.orders_count),
            items_sold: toInteger(data.summary?.items_sold),
        }),
    };
}

export function sanitizeBusinessContext(rawContext = {}) {
    const context = {};

    if (rawContext.get_sales_summary || rawContext.sales_summary) {
        context.sales_summary = sanitizeSalesSummary(
            rawContext.get_sales_summary || rawContext.sales_summary
        );
    }

    if (rawContext.get_sales_by_period || rawContext.sales_by_day) {
        Object.assign(
            context,
            sanitizeSalesByDay(rawContext.get_sales_by_period || rawContext.sales_by_day)
        );
    }

    if (rawContext.get_low_stock_items || rawContext.low_stock_items) {
        context.low_stock_items = sanitizeLowStockItems(
            rawContext.get_low_stock_items || rawContext.low_stock_items
        );
    }

    if (rawContext.get_top_products || rawContext.top_products) {
        context.top_products = sanitizeTopProducts(
            rawContext.get_top_products || rawContext.top_products
        );
    }

    if (rawContext.get_product_stock || rawContext.product_stock) {
        context.product_stock = sanitizeProductStock(
            rawContext.get_product_stock || rawContext.product_stock
        );
    }

    if (rawContext.get_category_performance || rawContext.category_performance) {
        context.category_performance = sanitizeCategoryPerformance(
            rawContext.get_category_performance || rawContext.category_performance
        );
    }

    if (rawContext.get_recent_transactions || rawContext.recent_transactions) {
        context.recent_transactions = sanitizeRecentTransactions(
            rawContext.get_recent_transactions || rawContext.recent_transactions
        );
    }

    if (rawContext.get_restock_recommendations || rawContext.restock_recommendations) {
        context.restock_recommendations = sanitizeRestockRecommendations(
            rawContext.get_restock_recommendations || rawContext.restock_recommendations
        );
    }

    if (rawContext.employee_performance || rawContext.employees) {
        context.employee_performance = sanitizeEmployeePerformance(
            rawContext.employee_performance || rawContext.employees
        );
    }

    return removeForbiddenFields(context);
}

function findForbiddenContextIssues(value, path = []) {
    const issues = [];

    if (Array.isArray(value)) {
        value.forEach((item, index) => {
            issues.push(...findForbiddenContextIssues(item, [...path, String(index)]));
        });
        return issues;
    }

    if (isPlainObject(value)) {
        for (const [key, childValue] of Object.entries(value)) {
            const nextPath = [...path, key];
            if (isForbiddenKey(key)) {
                issues.push(nextPath.join("."));
            }
            issues.push(...findForbiddenContextIssues(childValue, nextPath));
        }
        return issues;
    }

    if (typeof value === "string") {
        if (isPrivateValue(value) || /\bSELECT\b.+\bFROM\b/i.test(value) || /\bCREATE\s+TABLE\b/i.test(value)) {
            issues.push(path.join("."));
        }
    }

    return issues;
}

function validateArrayLimits(context) {
    const checks = [
        ["top_products", context.top_products, ARRAY_LIMITS.top_products],
        ["low_stock_items.items", context.low_stock_items?.items, ARRAY_LIMITS.low_stock_items],
        ["recent_transactions", context.recent_transactions, ARRAY_LIMITS.recent_transactions],
        ["category_performance.categories", context.category_performance?.categories, ARRAY_LIMITS.categories],
        ["employee_performance", context.employee_performance, ARRAY_LIMITS.employee_performance],
        ["sales_by_day", context.sales_by_day, ARRAY_LIMITS.sales_by_day],
    ];

    return checks
        .filter(([, value, limit]) => Array.isArray(value) && value.length > limit)
        .map(([key]) => key);
}

export function validateContextForOpenAI(sanitizedContext = {}) {
    const forbiddenIssues = findForbiddenContextIssues(sanitizedContext);
    const limitIssues = validateArrayLimits(sanitizedContext);
    const valid = forbiddenIssues.length === 0 && limitIssues.length === 0;

    return {
        valid,
        issues: [...forbiddenIssues, ...limitIssues],
    };
}
