import apiClient from "./apiClient";

const authApi = {
    login: (email, password) =>
        apiClient.post("/auth/login", { email, password }),

    register: (data) =>
        apiClient.post("/auth/register", data),

    me: () =>
        apiClient.get("/auth/me"),

    logout: () =>
        apiClient.post("/auth/logout")
};

export const register = (data) => apiClient.post("/auth/register", data);
export const login = (data) => apiClient.post("/auth/login", data);
export const me = () => apiClient.get("/auth/me");
export const logout = () => apiClient.post("/auth/logout");

export default authApi;
