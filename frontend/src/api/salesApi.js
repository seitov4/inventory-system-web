import apiClient from "./apiClient";

const salesApi = {
    getDaily: () => apiClient.get("/sales/daily").then(r => r.data),
    getWeekly: () => apiClient.get("/sales/weekly").then(r => r.data),
    getMonthly: () => apiClient.get("/sales/monthly").then(r => r.data),
    getChart: () => apiClient.get("/sales/chart").then(r => r.data),
};

export default salesApi;
