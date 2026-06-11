const MAX_MESSAGE_LENGTH = 1000;

const SAFE_REFUSAL_MESSAGES = Object.freeze({
    en: "I can only help with business insights based on your store data, such as sales, stock levels, products, reports, analytics, and restocking recommendations.",
    ru: "\u042f \u043c\u043e\u0433\u0443 \u043f\u043e\u043c\u043e\u0433\u0430\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0441 \u0431\u0438\u0437\u043d\u0435\u0441-\u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u043e\u0439 \u043f\u043e \u0434\u0430\u043d\u043d\u044b\u043c \u0432\u0430\u0448\u0435\u0433\u043e \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0430: \u043f\u0440\u043e\u0434\u0430\u0436\u0430\u043c\u0438, \u043e\u0441\u0442\u0430\u0442\u043a\u0430\u043c\u0438, \u0442\u043e\u0432\u0430\u0440\u0430\u043c\u0438, \u043e\u0442\u0447\u0451\u0442\u0430\u043c\u0438, \u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u043e\u0439 \u0438 \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0438\u044f\u043c\u0438 \u043f\u043e \u0437\u0430\u043a\u0443\u043f\u043a\u0435.",
});

const STORE_ISOLATION_MESSAGES = Object.freeze({
    en: "I can only access data for your current store.",
    ru: "\u042f \u043c\u043e\u0433\u0443 \u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c \u0442\u043e\u043b\u044c\u043a\u043e \u0441 \u0434\u0430\u043d\u043d\u044b\u043c\u0438 \u0432\u0430\u0448\u0435\u0433\u043e \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0430.",
});

const CROSS_STORE_PATTERNS = [
    /\bstore_id\b/i,
    /\bstore\s+id\b/i,
    /\bstore\s+\d+\b/i,
    /\banother\s+store\b/i,
    /\bother\s+store\b/i,
    /\bdifferent\s+store\b/i,
    /\ball\s+stores\b/i,
    /\bevery\s+store\b/i,
    /\btenant[_\s]+id\b/i,
    /\bcompany[_\s]+id\b/i,
    /\bshow\s+(me\s+)?data\s+from\s+store\b/i,
    /\bshow\s+(me\s+)?data\s+from\s+another\s+store\b/i,
    /\bsales\s+from\s+another\s+store\b/i,
    /id\s+\u043c\u0430\u0433\u0430\u0437\u0438\u043d/i,
    /\u043c\u0430\u0433\u0430\u0437\u0438\u043d\s+\d+/i,
    /\u0434\u0440\u0443\u0433(\u043e\u0439|\u043e\u0433\u043e|\u043e\u043c)\s+\u043c\u0430\u0433\u0430\u0437\u0438\u043d/i,
    /\u0432\u0441\u0435\s+\u043c\u0430\u0433\u0430\u0437\u0438\u043d/i,
    /\u043a\u0430\u0436\u0434(\u044b\u0439|\u043e\u0433\u043e|\u043e\u043c)\s+\u043c\u0430\u0433\u0430\u0437\u0438\u043d/i,
    /id\s+\u043a\u043e\u043c\u043f\u0430\u043d\u0438/i,
    /\u0434\u0430\u043d\u043d\u044b\u0435\s+\u0434\u0440\u0443\u0433\u043e\u0433\u043e\s+\u043c\u0430\u0433\u0430\u0437\u0438\u043d/i,
    /\u043f\u043e\u043a\u0430\u0436\u0438\s+\u0434\u0430\u043d\u043d\u044b\u0435\s+\u043c\u0430\u0433\u0430\u0437\u0438\u043d/i,
    /\u043f\u043e\u043a\u0430\u0436\u0438\s+\u0434\u0430\u043d\u043d\u044b\u0435\s+\u0434\u0440\u0443\u0433\u043e\u0433\u043e\s+\u043c\u0430\u0433\u0430\u0437\u0438\u043d/i,
];

const BLOCKED_PATTERNS = [
    /\bbackend\b/i,
    /\bfront\s*end\b/i,
    /\bfrontend\b/i,
    /\bdatabase\s+schema\b/i,
    /\bschema\b/i,
    /\bsql\b/i,
    /\bselect\s+.+\s+from\b/i,
    /\brun\s+select\b/i,
    /\b(raw\s+)?query\b/i,
    /\bapi\s+routes?\b/i,
    /\bbackend\s+api\b/i,
    /\broutes?\b/i,
    /\bendpoint(s)?\b/i,
    /\bsource\s+code\b/i,
    /\bcodebase\b/i,
    /\brepository\b/i,
    /\bmigration\b/i,
    /\.env\b/i,
    /\benvironment\s+variable(s)?\b/i,
    /\bjwt\b/i,
    /\btokens?\b/i,
    /\bsecrets?\b/i,
    /\bpassword(s)?\b/i,
    /\bpassword_hash\b/i,
    /\bhash(es)?\b/i,
    /\bopenai\s+api\s+key\b/i,
    /\bapi\s+key\b/i,
    /\bsystem\s+prompt\b/i,
    /\binternal\s+prompt(s)?\b/i,
    /\bprompt\b/i,
    /\bignore\s+previous\b/i,
    /\bignore\s+previous\s+instructions\b/i,
    /\bbypass\b/i,
    /\bjailbreak\b/i,
    /\badmin\s+password\b/i,
    /\bplatform\s+admin(s)?\b/i,
    /\busers\s+from\s+all\s+stores\b/i,
    /\u0431\u044d\u043a\u0435\u043d\u0434/i,
    /\u0444\u0440\u043e\u043d\u0442\u0435\u043d\u0434/i,
    /\u0431\u0430\u0437\u0430\s+\u0434\u0430\u043d\u043d\u044b\u0445/i,
    /\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440[\u0430\u0443\u044b]?\s+\u0431\u0430\u0437[\u044b\u0430]/i,
    /\u0441\u0445\u0435\u043c\u0430\s+\u0431\u0430\u0437\u044b/i,
    /sql[-\s]?\u0437\u0430\u043f\u0440\u043e\u0441/i,
    /\u0440\u043e\u0443\u0442/i,
    /\u043c\u0430\u0440\u0448\u0440\u0443\u0442/i,
    /\u0438\u0441\u0445\u043e\u0434\u043d\u044b\u0439\s+\u043a\u043e\u0434/i,
    /\u043a\u043e\u0434\s+\u043f\u0440\u043e\u0435\u043a\u0442\u0430/i,
    /\u0440\u0435\u043f\u043e\u0437\u0438\u0442\u043e\u0440/i,
    /\u043c\u0438\u0433\u0440\u0430\u0446/i,
    /\u043f\u0435\u0440\u0435\u043c\u0435\u043d\u043d(\u0430\u044f|\u044b\u0435|\u0443\u044e|\u044b\u0445)\s+\u043e\u043a\u0440\u0443\u0436\u0435\u043d\u0438/i,
    /\u0442\u043e\u043a\u0435\u043d/i,
    /\u0441\u0435\u043a\u0440\u0435\u0442/i,
    /\u043f\u0430\u0440\u043e\u043b/i,
    /\u0445[\u044d\u0435]\u0448\s+\u043f\u0430\u0440\u043e\u043b/i,
    /api\s+\u043a\u043b\u044e\u0447/i,
    /\u0441\u0438\u0441\u0442\u0435\u043c\u043d(\u044b\u0439|\u043e\u0433\u043e|\u043e\u043c\u0443)\s+\u043f\u0440\u043e\u043c\u043f\u0442/i,
    /\u043f\u0440\u043e\u043c\u043f\u0442/i,
    /\u0438\u0433\u043d\u043e\u0440\u0438\u0440\u0443\u0439\s+\u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0446/i,
    /\u0438\u0433\u043d\u043e\u0440\u0438\u0440\u0443\u0439\s+\u043f\u0440\u0435\u0434\u044b\u0434\u0443\u0449/i,
    /\u043e\u0431\u043e\u0439\u0434\u0438\s+\u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438/i,
    /\u043f\u0430\u0440\u043e\u043b\u044c\s+\u0430\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440/i,
    /\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b(\u0438|\u0435\u0439)\s+\u0432\u0441\u0435\u0445\s+\u043c\u0430\u0433\u0430\u0437\u0438\u043d/i,
];

const ALLOWED_BUSINESS_PATTERNS = [
    /\bsales?\b/i,
    /\bsell\b/i,
    /\bsold\b/i,
    /\brevenue\b/i,
    /\bincome\b/i,
    /\bprofit\b/i,
    /\borders?\b/i,
    /\bproducts?\b/i,
    /\bstock\b/i,
    /\binventory\b/i,
    /\bwarehouse\b/i,
    /\blow\s+(in\s+)?stock\b/i,
    /\bout\s+of\s+stock\b/i,
    /\brestock\b/i,
    /\bcategor(y|ies)\b/i,
    /\breports?\b/i,
    /\banalytics?\b/i,
    /\bdashboard\b/i,
    /\btop[-\s]?selling\b/i,
    /\bbest[-\s]?selling\b/i,
    /\btoday\b/i,
    /\byesterday\b/i,
    /\bweek\b/i,
    /\bmonth\b/i,
    /\bperformance\b/i,
    /\u043f\u0440\u043e\u0434\u0430\u0436/i,
    /\u043f\u0440\u043e\u0434\u0430\u043b\u0438/i,
    /\u0432\u044b\u0440\u0443\u0447\u043a/i,
    /\u0434\u043e\u0445\u043e\u0434/i,
    /\u043f\u0440\u0438\u0431\u044b\u043b/i,
    /\u0437\u0430\u043a\u0430\u0437/i,
    /\u0442\u043e\u0432\u0430\u0440/i,
    /\u043f\u0440\u043e\u0434\u0443\u043a\u0442/i,
    /\u043e\u0441\u0442\u0430\u0442/i,
    /\u0441\u043a\u043b\u0430\u0434/i,
    /\u0438\u043d\u0432\u0435\u043d\u0442\u0430\u0440/i,
    /\u0437\u0430\u043a\u0430\u043d\u0447\u0438\u0432\u0430/i,
    /\u043d\u0438\u0437\u043a(\u0438\u0439|\u0438\u043c|\u043e\u0433\u043e|\u043e\u043c)\s+\u043e\u0441\u0442\u0430\u0442/i,
    /\u043d\u0435\u0442\s+\u0432\s+\u043d\u0430\u043b\u0438\u0447\u0438\u0438/i,
    /\u0434\u043e\u043a\u0443\u043f/i,
    /\u0437\u0430\u043a\u0443\u043f/i,
    /\u043a\u0430\u0442\u0435\u0433\u043e\u0440/i,
    /\u043e\u0442\u0447[\u0435\u0451]\u0442/i,
    /\u0430\u043d\u0430\u043b\u0438\u0442\u0438\u043a/i,
    /\u0434\u0430\u0448\u0431\u043e\u0440\u0434/i,
    /\u0441\u0430\u043c\u044b\u0435\s+\u043f\u0440\u043e\u0434\u0430\u0432\u0430\u0435\u043c\u044b\u0435/i,
    /\u043b\u0443\u0447\u0448\u0438\u0435\s+\u0442\u043e\u0432\u0430\u0440/i,
    /\u0441\u0435\u0433\u043e\u0434\u043d\u044f/i,
    /\u0432\u0447\u0435\u0440\u0430/i,
    /\u043d\u0435\u0434\u0435\u043b/i,
    /\u043c\u0435\u0441\u044f\u0446/i,
    /\u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b/i,
];

export function detectLanguage(message) {
    return /[\u0400-\u04ff]/i.test(String(message || "")) ? "ru" : "en";
}

export function isCrossStoreAccessAttempt(message) {
    const text = String(message || "");
    return CROSS_STORE_PATTERNS.some((pattern) => pattern.test(text));
}

export function isBlockedQuestion(message) {
    const text = String(message || "");
    return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

export function isAllowedBusinessQuestion(message) {
    const text = String(message || "");
    return ALLOWED_BUSINESS_PATTERNS.some((pattern) => pattern.test(text));
}

export function getSafeRefusalMessage(language = "en") {
    return SAFE_REFUSAL_MESSAGES[language] || SAFE_REFUSAL_MESSAGES.en;
}

export function getStoreIsolationMessage(language = "en") {
    return STORE_ISOLATION_MESSAGES[language] || STORE_ISOLATION_MESSAGES.en;
}

export function validateAiMessage(message) {
    if (message === undefined || message === null) {
        return {
            valid: false,
            status: 400,
            message: "Message is required",
        };
    }

    if (typeof message !== "string") {
        return {
            valid: false,
            status: 400,
            message: "Message must be a string",
        };
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
        return {
            valid: false,
            status: 400,
            message: "Message is required",
        };
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
        return {
            valid: false,
            status: 400,
            message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less`,
        };
    }

    return {
        valid: true,
    };
}

export function evaluateMessageScope(message) {
    const language = detectLanguage(message);
    const crossStoreAccess = isCrossStoreAccessAttempt(message);
    const blocked = crossStoreAccess || isBlockedQuestion(message);
    const allowedBusiness = !blocked && isAllowedBusinessQuestion(message);

    let reason = "unclear_scope";

    if (crossStoreAccess) {
        reason = "cross_store_access_attempt";
    } else if (blocked) {
        reason = "blocked_technical_scope";
    } else if (allowedBusiness) {
        reason = "allowed_business_scope";
    }

    return {
        language,
        blocked,
        allowedBusiness,
        reason,
    };
}
