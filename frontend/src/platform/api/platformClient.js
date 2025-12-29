import axios from "axios";

// Simple token holder configured by PlatformAuthProvider
let platformAuthToken = null;

export function setPlatformAuthToken(token) {
    platformAuthToken = token || null;
}

/**
 * Platform API Base URL
 * Defaults to relative path (works with proxy in development)
 * Can be overridden with REACT_APP_PLATFORM_API_URL env variable
 * Example: REACT_APP_PLATFORM_API_URL=http://localhost:5000/api/platform
 */
const PLATFORM_BASE_URL =
    process.env.REACT_APP_PLATFORM_API_URL || "/api/platform";

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
        const message =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            error?.message ||
            "Platform API error";
        // eslint-disable-next-line no-console
        console.error("[Platform API]", message);
        const normalizedError = new Error(message);
        normalizedError.original = error;
        return Promise.reject(normalizedError);
    }
);

export default platformClient;


