import apiClient from "./apiClient";

const usersApi = {
    createEmployee: (data) =>
        apiClient.post("/users", data).then((r) => r.data?.data || r.data),
    getAll: () =>
        apiClient.get("/users").then((r) => r.data?.data || r.data || []),
    updateUser: (id, data) =>
        apiClient.put(`/users/${id}`, data).then((r) => r.data?.data || r.data),
    deleteUser: (id) =>
        apiClient.delete(`/users/${id}`).then((r) => r.data?.data || r.data),
};

export default usersApi;
