import apiClient from "./apiClient";

function getFilenameFromDisposition(disposition, fallback) {
    const match = String(disposition || "").match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    return match ? decodeURIComponent(match[1]) : fallback;
}

function triggerBlobDownload(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

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

    downloadSalesForecastCsv: async ({ from, to, format = "realistic" } = {}) => {
        const response = await apiClient.get("/reports/sales-forecast-csv", {
            params: { from, to, format },
            responseType: "blob",
        });
        const filename = getFilenameFromDisposition(
            response.headers?.["content-disposition"],
            `sales_forecast_${format}.csv`
        );

        triggerBlobDownload(response.data, filename);
        return { filename };
    },
};

export default reportsApi;

