import apiClient from "./apiClient";

const authApi = {
    login: (login, password) =>
        apiClient
            .post("/auth/login", { login, password })
            .then((r) => r.data?.data || r.data || {}),

    register: (data) =>
        apiClient.post("/auth/register", data).then((r) => r.data?.data || r.data || {}),

    me: () =>
        apiClient.get("/auth/me").then((r) => r.data?.data || r.data || {}),

    logout: () =>
        apiClient.post("/auth/logout").then((r) => r.data?.data || r.data || {}),
};

export default authApi;
