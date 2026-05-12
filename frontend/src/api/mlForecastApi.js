import axios from "axios";

const ML_API_BASE_URL = process.env.REACT_APP_ML_API_URL || "http://localhost:8000";

const mlClient = axios.create({
    baseURL: ML_API_BASE_URL,
    timeout: 120000,
});

const mlForecastApi = {
    async getStatus() {
        const response = await mlClient.get("/models/status");
        return response.data;
    },

    async forecastCsv(file, { model = "ensemble", horizon = 30, compare = true } = {}) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", model);
        formData.append("horizon", String(horizon));
        formData.append("compare", String(compare));

        const response = await mlClient.post("/forecast", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },
};

export default mlForecastApi;
