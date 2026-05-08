import apiClient from "./apiClient";

const warehousesApi = {
    getAll: () =>
        apiClient.get("/warehouses").then((r) => r.data?.data || r.data || []),
};

export default warehousesApi;
