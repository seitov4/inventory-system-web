import axios from "axios";

// Simple token holder configured by PlatformAuthProvider
let platformAuthToken = null;
let unauthorizedHandler = null;

export function setPlatformAuthToken(token) {
    platformAuthToken = token || null;
}

export function setPlatformUnauthorizedHandler(handler) {
    unauthorizedHandler = typeof handler === "function" ? handler : null;
}

export function getPlatformApiErrorMessage(error, fallback = "Platform API error") {
    const data = error?.response?.data;

    if (typeof data?.error?.message === "string") {
        return data.error.message;
    }

    if (typeof data?.error === "string") {
        return data.error;
    }

    if (typeof data?.message === "string") {
        return data.message;
    }

    if (typeof error?.message === "string") {
        return error.message;
    }

    return fallback;
}

/**
 * Platform API Base URL
 * Defaults to relative path (works with proxy in development)
 * Can be overridden with REACT_APP_PLATFORM_API_URL env variable
 * Example: REACT_APP_PLATFORM_API_URL=http://localhost:5000/api/platform
 */
const API_BASE_URL = process.env.REACT_APP_API_URL;
const PLATFORM_BASE_URL =
    process.env.REACT_APP_PLATFORM_API_URL ||
    (API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, "")}/platform` : "/api/platform");

const platformClient = axios.create({
    baseURL: PLATFORM_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach auth token if present
platformClient.interceptors.request.use(
    (config) => {
        if (platformAuthToken) {
            config.headers.Authorization = `Bearer ${platformAuthToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Basic error normalization
platformClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = getPlatformApiErrorMessage(error);
        const status = error?.response?.status;
        if (status === 401 && unauthorizedHandler) {
            unauthorizedHandler();
        }

        // eslint-disable-next-line no-console
        console.error("[Platform API]", message);
        const normalizedError = new Error(message);
        normalizedError.response = error?.response;
        normalizedError.original = error;
        return Promise.reject(normalizedError);
    }
);

export default platformClient;
