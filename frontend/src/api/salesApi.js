import apiClient from "./apiClient";

const salesApi = {
    // Analytics endpoints
    getDaily: () =>
        apiClient.get("/sales/daily").then((r) => r.data?.data || r.data || null),
    getWeekly: () =>
        apiClient.get("/sales/weekly").then((r) => r.data?.data || r.data || null),
    getMonthly: () =>
        apiClient.get("/sales/monthly").then((r) => r.data?.data || r.data || null),
    getChart: () =>
        apiClient.get("/sales/chart").then((r) => r.data?.data || r.data || []),

    // POS endpoints
    create: (data) =>
        apiClient.post("/sales", data).then((r) => r.data?.data || r.data || {}),

    getById: (id) =>
        apiClient.get(`/sales/${id}`).then((r) => r.data?.data || r.data || null),

    return: (id, warehouse_id) =>
        apiClient
            .post(`/sales/${id}/return`, { warehouse_id })
            .then((r) => r.data?.data || r.data || {}),
};

export default salesApi;
