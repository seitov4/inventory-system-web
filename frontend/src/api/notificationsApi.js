import apiClient from "./apiClient";

const notificationsApi = {
    getAll: (params) =>
        apiClient.get("/notifications", { params }).then((r) => r.data?.data || r.data || []),
    markAsRead: (id) =>
        apiClient.put(`/notifications/${id}/read`).then((r) => r.data?.data || r.data || {}),
};

export default notificationsApi;

