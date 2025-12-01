import apiClient from "./apiClient";

const productsApi = {
    getAll: () => apiClient.get("/products").then((r) => r.data),
    getLowStock: () => apiClient.get("/products/low-stock").then((r) => r.data),
    getProductsLeft: () => apiClient.get("/products/left").then((r) => r.data),
    create: (data) => apiClient.post("/products", data).then((r) => r.data),
    update: (id, data) =>
        apiClient.put(`/products/${id}`, data).then((r) => r.data),
    remove: (id) => apiClient.delete(`/products/${id}`),
};

export default productsApi;
