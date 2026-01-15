import apiClient from "./apiClient";

const productsApi = {
    getAll: () =>
        apiClient.get("/products").then((r) => r.data?.data || r.data || []),
    getLowStock: () =>
        apiClient.get("/products/low-stock").then((r) => r.data?.data || r.data || []),
    getProductsLeft: () =>
        apiClient.get("/products/left").then((r) => r.data?.data || r.data || []),
    create: (data) =>
        apiClient.post("/products", data).then((r) => r.data?.data || r.data),
    update: (id, data) =>
        apiClient.put(`/products/${id}`, data).then((r) => r.data?.data || r.data),
    remove: (id) =>
        apiClient.delete(`/products/${id}`).then((r) => r.data?.data || r.data),
    /**
     * Import multiple products from CSV/XLSX
     * @param {Array} products - Array of product objects
     * @returns {Promise} Import result with created/skipped counts
     */
    importProducts: (products) =>
        apiClient.post("/products/import", { products }).then((r) => r.data?.data || r.data),
};

export default productsApi;
