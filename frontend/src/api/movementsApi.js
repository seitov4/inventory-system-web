import apiClient from "./apiClient";

const movementsApi = {
    movementIn: (data) =>
        apiClient.post("/movements/in", data).then((r) => r.data?.data || r.data),
    movementOut: (data) =>
        apiClient.post("/movements/out", data).then((r) => r.data?.data || r.data),
    movementTransfer: (data) =>
        apiClient.post("/movements/transfer", data).then((r) => r.data?.data || r.data),
    getMovements: (params) =>
        apiClient.get("/movements", { params }).then((r) => r.data?.data || r.data || []),
};

export default movementsApi;

