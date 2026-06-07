import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

export function getApiErrorMessage(error, fallback = "Request failed") {
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

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        console.error("[API Request Error]", error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
    (response) => {
        // Check if response has unified format with success field
        if (response.data && typeof response.data === "object" && "success" in response.data) {
            if (!response.data.success && response.data.error) {
                const message = getApiErrorMessage({ response });
                // Transform unified error format to standard axios error
                const err = new Error(message);
                err.response = {
                    ...response,
                    data: {
                        message,
                        error: message,
                    },
                };
                err.response.status = response.status >= 400 ? response.status : 400;
                return Promise.reject(err);
            }
        }

        return response;
    },
    (error) => {
        if (!error.response) {
            console.error("[API] Network error - backend may not be running on", API_BASE_URL);
            console.error("[API] Error details:", error.message);
        } else {
            // Handle unified error format
            const errorMessage = getApiErrorMessage(error, error.message);
            if (error.response?.data) {
                error.response.data = {
                    ...error.response.data,
                    message: errorMessage,
                    error: errorMessage,
                };
            }
            console.error("[API Error]", error.response?.status, errorMessage);
        }
        return Promise.reject(error);
    }
);

export default apiClient;
