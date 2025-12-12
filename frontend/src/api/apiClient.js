import axios from "axios";

/**
 * API Client Configuration
 * 
 * The API URL can be configured via environment variable:
 * - REACT_APP_API_URL: Full API URL (e.g., "http://localhost:5001/api")
 * 
 * Default: http://localhost:5001/api (backend default port when 5000 is in use)
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Always log the API URL to help debugging
console.log("[API Client] Connecting to:", API_BASE_URL);

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log all requests
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || "");
        
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
        console.log(`[API Response] ${response.status}`, response.data);
        return response;
    },
    (error) => {
        if (!error.response) {
            console.error("[API] Network error - backend may not be running on", API_BASE_URL);
            console.error("[API] Error details:", error.message);
        } else {
            console.error("[API Error]", error.response?.status, error.response?.data?.message || error.message);
        }
        return Promise.reject(error);
    }
);

export default apiClient;
