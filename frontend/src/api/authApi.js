import apiClient from "./apiClient";

const authApi = {
    login: (login, password) =>
        apiClient.post("/auth/login", { login, password }),

    register: (data) => apiClient.post("/auth/register", data),

    me: () => apiClient.get("/auth/me"),

    logout: () => apiClient.post("/auth/logout"),
};

export const register = (data) => apiClient.post("/auth/register", data);
export const login = (login, password) =>
    apiClient.post("/auth/login", { login, password });
export const me = () => apiClient.get("/auth/me");
export const logout = () => apiClient.post("/auth/logout");

export default authApi;

