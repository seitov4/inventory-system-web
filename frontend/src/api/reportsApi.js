import apiClient from "./apiClient";

const reportsApi = {
    /**
     * Get sales report data for a date range
     * @param {string} from - Start date (YYYY-MM-DD)
     * @param {string} to - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} Array of sales data rows
     */
    getSalesReport: (from, to) =>
        apiClient
            .get("/reports/sales", { params: { from, to } })
            .then((r) => r.data?.data || r.data || []),
};

export default reportsApi;

