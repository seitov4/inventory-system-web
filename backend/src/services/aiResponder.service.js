export function buildBasicChatAnswer() {
    return { handled: false, answer: null };
}

export function buildRuleBasedAnswer() {
    return { handled: false, answer: null };
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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

export function formatDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toISOString().slice(0, 10);
}
