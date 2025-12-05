import apiClient from "./apiClient";

const usersApi = {
    createEmployee: (data) => apiClient.post("/users", data),
    getAll: () => apiClient.get("/users"),
    updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
    deleteUser: (id) => apiClient.delete(`/users/${id}`),
};

export default usersApi;


