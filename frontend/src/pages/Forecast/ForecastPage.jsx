import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Label,
    LabelList,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import Layout from "../../components/Layout/Layout";
import mlForecastApi from "../../api/mlForecastApi";

const Grid = styled.div`
    display: grid;
    grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
    gap: 18px;

    @media (max-width: 920px) {
        grid-template-columns: 1fr;
    }
`;

const ForecastSurface = styled.div`
    --forecast-grid: rgba(100, 116, 139, 0.26);
    --forecast-axis: #64748b;
    --forecast-tooltip-bg: #ffffff;
    --forecast-tooltip-border: #dbe3ef;
    --forecast-tooltip-text: #0f172a;
    --forecast-actual: #334155;
    --forecast-ensemble: #c2410c;
    --forecast-lightgbm: #15803d;
    --forecast-xgboost: #2563eb;
    --forecast-fallback: #7c3aed;

    @media (prefers-color-scheme: dark) {
        --forecast-grid: rgba(148, 163, 184, 0.28);
        --forecast-axis: #94a3b8;
        --forecast-tooltip-bg: #111827;
        --forecast-tooltip-border: #334155;
        --forecast-tooltip-text: #e5e7eb;
        --forecast-actual: #f8fafc;
        --forecast-ensemble: #f59e0b;
        --forecast-lightgbm: #22c55e;
        --forecast-xgboost: #60a5fa;
        --forecast-fallback: #c084fc;
    }

    :root[data-theme="dark"] &,
    body[data-theme="dark"] & {
        --forecast-grid: rgba(148, 163, 184, 0.28);
        --forecast-axis: #94a3b8;
        --forecast-tooltip-bg: #111827;
        --forecast-tooltip-border: #334155;
        --forecast-tooltip-text: #e5e7eb;
        --forecast-actual: #f8fafc;
        --forecast-ensemble: #f59e0b;
        --forecast-lightgbm: #22c55e;
        --forecast-xgboost: #60a5fa;
        --forecast-fallback: #c084fc;
    }
`;

const Panel = styled.section`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    padding: 16px;
    margin-bottom: 18px;
`;

const PanelTitle = styled.h2`
    color: var(--text-primary);
    font-size: 16px;
    margin: 0 0 12px;
`;

const Form = styled.form`
    display: grid;
    gap: 14px;
`;

const Field = styled.label`
    display: grid;
    gap: 6px;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
`;

const Input = styled.input`
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 14px;
    padding: 10px 12px;
    width: 100%;
`;

const Select = styled.select`
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 14px;
    padding: 10px 12px;
    width: 100%;
`;

const Button = styled.button`
    background: var(--primary-color);
    border: 0;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    font-weight: 700;
    min-height: 40px;
    padding: 10px 14px;

    &:disabled {
        cursor: not-allowed;
        opacity: 0.55;
    }
`;

const SecondaryButton = styled(Button)`
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
`;

const DangerButton = styled(SecondaryButton)`
    color: var(--error-color);
`;

const ButtonRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
`;

const TableToolbar = styled.div`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
    margin-bottom: 12px;
`;

const PaginationControls = styled.div`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
`;

const PageInfo = styled.span`
    color: var(--text-tertiary);
    font-size: 13px;
`;

const ModeTabs = styled.div`
    display: inline-flex;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 14px;
`;

const ModeButton = styled.button`
    background: ${(props) => (props.$active ? "var(--primary-color)" : "transparent")};
    border: 0;
    border-radius: 6px;
    color: ${(props) => (props.$active ? "#fff" : "var(--text-secondary)")};
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    min-height: 34px;
    padding: 8px 12px;
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 820px) {
        grid-template-columns: 1fr;
    }
`;

const StatusGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

const Stat = styled.div`
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color-subtle);
    border-radius: 8px;
    padding: 12px;
`;

const StatLabel = styled.div`
    color: var(--text-tertiary);
    font-size: 12px;
`;

const StatValue = styled.div`
    color: var(--text-primary);
    font-size: 20px;
    font-weight: 800;
    margin-top: 4px;
`;

const Muted = styled.p`
    color: var(--text-tertiary);
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
`;

const ErrorBox = styled.div`
    background: var(--error-bg);
    border-radius: 8px;
    color: var(--error-color);
    font-size: 14px;
    margin-bottom: 16px;
    padding: 12px;
`;

const ChartBox = styled.div`
    height: 430px;
    min-width: 0;
`;

const ResultActions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
    margin-bottom: 18px;
`;

const TableWrap = styled.div`
    overflow: auto;
`;

const Table = styled.table`
    border-collapse: collapse;
    color: var(--text-secondary);
    font-size: 13px;
    min-width: 560px;
    width: 100%;

    th,
    td {
        border-bottom: 1px solid var(--border-color-subtle);
        padding: 10px 8px;
        text-align: left;
    }

    th {
        color: var(--text-primary);
        font-weight: 700;
    }
`;

const COLORS = {
    actual: "var(--forecast-actual)",
    ensemble: "var(--forecast-ensemble)",
    lightgbm: "var(--forecast-lightgbm)",
    xgboost: "var(--forecast-xgboost)",
};

const SIMPLE_FORM_DEFAULTS = {
    date: "",
    store_id: "",
    sales: "",
    revenue: "",
    total: "",
};

const FULL_FORM_DEFAULTS = {
    date: "",
    store_id: "",
    sales: "",
    revenue: "",
    total: "",
    has_promotion: "",
    quantity_sold: "",
    profit: "",
    customer_traffic: "",
    is_holiday: "",
};

const CSV_HEADERS = [
    "date",
    "store_id",
    "sales",
    "revenue",
    "total",
    "has_promotion",
    "quantity_sold",
    "profit",
    "customer_traffic",
    "is_holiday",
];

function formatValue(value) {
    if (value === null || value === undefined) return "";
    return Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function compactValue(value) {
    if (value === null || value === undefined) return "";
    const number = Number(value);
    if (Math.abs(number) >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
    if (Math.abs(number) >= 1000) return `${Math.round(number / 1000)}k`;
    return `${Math.round(number)}`;
}

function normalizeError(error) {
    return error?.response?.data?.detail || error?.message || "Forecast request failed.";
}

function csvEscape(value) {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function buildCsv(rows) {
    const headers = CSV_HEADERS.filter((header) => {
        if (header === "date") return true;
        if (["sales", "revenue", "total"].includes(header)) {
            return rows.some((row) => row[header] !== "" && row[header] !== undefined);
        }
        return rows.some((row) => row[header] !== "" && row[header] !== undefined);
    });

    return [
        headers.join(","),
        ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
    ].join("\n");
}

function createCsvFile(rows) {
    const csv = buildCsv(rows);
    return new File([csv], "manual-forecast.csv", { type: "text/csv" });
}

function hasAnyMetric(row) {
    return ["sales", "revenue", "total"].some(
        (field) => row[field] !== "" && row[field] !== undefined
    );
}

export default function ForecastPage() {
    const forecastSurfaceRef = useRef(null);
    const predictionChartRef = useRef(null);
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState(null);
    const [file, setFile] = useState(null);
    const [manualRows, setManualRows] = useState([]);
    const [manualMode, setManualMode] = useState("simple");
    const [simpleForm, setSimpleForm] = useState(SIMPLE_FORM_DEFAULTS);
    const [fullForm, setFullForm] = useState(FULL_FORM_DEFAULTS);
    const [model, setModel] = useState("ensemble");
    const [horizon, setHorizon] = useState(30);
    const [result, setResult] = useState(null);
    const [forecastPageSize, setForecastPageSize] = useState(10);
    const [forecastPage, setForecastPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        mlForecastApi
            .getStatus()
            .then(setStatus)
            .catch((err) => {
                setError(`ML service is unavailable: ${normalizeError(err)}`);
                setStatus({ loaded_models: [], feature_count: 0, has_scaler: false, has_encoders: false });
            });
    }, []);

    const availableModels = status?.loaded_models?.length
        ? status.loaded_models
        : ["ensemble", "lightgbm", "xgboost"];

    const summaries = useMemo(() => {
        if (!result) return [];
        if (result.mode === "single") {
            return [{ model: result.model, ...result.summary }];
        }
        return Object.entries(result.results || {}).map(([modelName, modelResult]) => ({
            model: modelName,
            ...modelResult.summary,
        }));
    }, [result]);

    const chartData = useMemo(() => {
        if (!result) return [];

        const rows = {};
        const history =
            result.history ||
            Object.values(result.results || {})[0]?.history ||
            [];

        history.forEach((item) => {
            const key = `${item.store_id}-${item.date}`;
            rows[key] = {
                date: item.date,
                store_id: item.store_id,
                actual: item.actual,
            };
        });

        if (result.mode === "single") {
            result.predictions.forEach((item) => {
                const key = `${item.store_id}-${item.date}`;
                rows[key] = rows[key] || { date: item.date, store_id: item.store_id };
                rows[key][result.model] = item.prediction;
            });
            return Object.values(rows).sort((a, b) =>
                `${a.store_id}-${a.date}`.localeCompare(`${b.store_id}-${b.date}`)
            );
        }

        Object.entries(result.results || {}).forEach(([modelName, modelResult]) => {
            modelResult.predictions.forEach((item) => {
                const key = `${item.store_id}-${item.date}`;
                rows[key] = rows[key] || { date: item.date, store_id: item.store_id };
                rows[key][modelName] = item.prediction;
            });
        });

        return Object.values(rows).sort((a, b) =>
            `${a.store_id}-${a.date}`.localeCompare(`${b.store_id}-${b.date}`)
        );
    }, [result]);

    useEffect(() => {
        setForecastPage(1);
    }, [result, forecastPageSize]);

    const forecastPageCount = Math.max(1, Math.ceil(chartData.length / forecastPageSize));
    const safeForecastPage = Math.min(forecastPage, forecastPageCount);
    const forecastStartIndex = (safeForecastPage - 1) * forecastPageSize;
    const pagedForecastRows = chartData.slice(
        forecastStartIndex,
        forecastStartIndex + forecastPageSize
    );
    const forecastRangeStart = chartData.length ? forecastStartIndex + 1 : 0;
    const forecastRangeEnd = Math.min(forecastStartIndex + forecastPageSize, chartData.length);

    const runForecast = async (sourceFile) => {
        if (!sourceFile) {
            setError("Select a CSV file first.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            const data = await mlForecastApi.forecastCsv(sourceFile, {
                model,
                horizon: Number(horizon),
                compare: true,
            });
            setResult(data);
        } catch (err) {
            setError(normalizeError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        await runForecast(file);
    };

    const handleSimpleChange = (field, value) => {
        setSimpleForm((current) => ({ ...current, [field]: value }));
    };

    const handleFullChange = (field, value) => {
        setFullForm((current) => ({ ...current, [field]: value }));
    };

    const handleManualSubmit = (event) => {
        event.preventDefault();
        setError("");

        const row =
            manualMode === "simple"
                ? { ...simpleForm }
                : { ...fullForm };

        if (!row.date) {
            setError("Manual row needs a date.");
            return;
        }

        if (!hasAnyMetric(row)) {
            setError("Manual row needs sales, revenue, or total.");
            return;
        }

        setManualRows((current) => [...current, row]);
        if (manualMode === "simple") {
            setSimpleForm(SIMPLE_FORM_DEFAULTS);
        } else {
            setFullForm(FULL_FORM_DEFAULTS);
        }
    };

    const removeManualRow = (index) => {
        setManualRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    };

    const selectManualRowsAsCsv = () => {
        if (!manualRows.length) {
            setError("Add at least one manual row first.");
            return null;
        }
        const csvFile = createCsvFile(manualRows);
        setFile(csvFile);
        setError("");
        return csvFile;
    };

    const downloadManualCsv = () => {
        if (!manualRows.length) {
            setError("Add at least one manual row first.");
            return;
        }

        const csv = buildCsv(manualRows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "manual-forecast.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setError("");
    };

    const forecastManualRows = async () => {
        const csvFile = selectManualRowsAsCsv();
        if (csvFile) {
            await runForecast(csvFile);
        }
    };

    const resetForecastWorkspace = () => {
        setFile(null);
        setManualRows([]);
        setSimpleForm(SIMPLE_FORM_DEFAULTS);
        setFullForm(FULL_FORM_DEFAULTS);
        setResult(null);
        setError("");
        setForecastPage(1);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const buildPredictionChartSvg = () => {
        if (!chartData.length || !summaries.length) {
            setError("Generate a forecast before downloading the chart.");
            return null;
        }

        const styles = getComputedStyle(forecastSurfaceRef.current || document.documentElement);
        const cssVars = {
            "--forecast-grid": styles.getPropertyValue("--forecast-grid").trim(),
            "--forecast-axis": styles.getPropertyValue("--forecast-axis").trim(),
            "--forecast-actual": styles.getPropertyValue("--forecast-actual").trim(),
            "--forecast-ensemble": styles.getPropertyValue("--forecast-ensemble").trim(),
            "--forecast-lightgbm": styles.getPropertyValue("--forecast-lightgbm").trim(),
            "--forecast-xgboost": styles.getPropertyValue("--forecast-xgboost").trim(),
            "--forecast-fallback": styles.getPropertyValue("--forecast-fallback").trim(),
            "--text-secondary": styles.getPropertyValue("--text-secondary").trim(),
            "--text-primary": styles.getPropertyValue("--text-primary").trim(),
            "--bg-secondary": styles.getPropertyValue("--bg-secondary").trim(),
        };
        const colors = {
            actual: cssVars["--forecast-actual"] || "#334155",
            ensemble: cssVars["--forecast-ensemble"] || "#c2410c",
            lightgbm: cssVars["--forecast-lightgbm"] || "#15803d",
            xgboost: cssVars["--forecast-xgboost"] || "#2563eb",
            fallback: cssVars["--forecast-fallback"] || "#7c3aed",
            grid: cssVars["--forecast-grid"] || "rgba(100, 116, 139, 0.26)",
            axis: cssVars["--forecast-axis"] || "#64748b",
            text: cssVars["--text-primary"] || "#0f172a",
            muted: cssVars["--text-secondary"] || "#475569",
            background: cssVars["--bg-secondary"] || "#ffffff",
        };

        const escapeSvg = (value) =>
            String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");

        const width = 1120;
        const height = 640;
        const margin = { top: 72, right: 48, bottom: 92, left: 88 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const series = [
            { key: "actual", name: "Actual sales", color: colors.actual, dash: "" },
            ...summaries.map((item) => ({
                key: item.model,
                name: `${item.model} forecast`,
                color: colors[item.model] || colors.fallback,
                dash: "7 5",
            })),
        ];

        const values = chartData.flatMap((row) =>
            series
                .map((item) => Number(row[item.key]))
                .filter((value) => Number.isFinite(value))
        );
        const maxValue = Math.max(...values, 1);
        const minValue = Math.min(0, ...values);
        const yMax = maxValue * 1.1;
        const yMin = minValue;

        const xScale = (index) =>
            margin.left + (chartData.length <= 1 ? 0 : (index / (chartData.length - 1)) * plotWidth);
        const yScale = (value) =>
            margin.top + plotHeight - ((value - yMin) / Math.max(yMax - yMin, 1)) * plotHeight;

        const yTicks = Array.from({ length: 6 }, (_, index) => yMin + ((yMax - yMin) / 5) * index);
        const xTickCount = Math.min(8, chartData.length);
        const xTickIndexes = Array.from({ length: xTickCount }, (_, index) =>
            xTickCount <= 1 ? 0 : Math.round((index / (xTickCount - 1)) * (chartData.length - 1))
        );

        const lineSegments = (key) => {
            const segments = [];
            let current = [];
            chartData.forEach((row, index) => {
                const value = Number(row[key]);
                if (Number.isFinite(value)) {
                    current.push(`${xScale(index).toFixed(2)},${yScale(value).toFixed(2)}`);
                    return;
                }
                if (current.length) {
                    segments.push(current);
                    current = [];
                }
            });
            if (current.length) segments.push(current);
            return segments;
        };

        const gridLines = yTicks
            .map((tick) => {
                const y = yScale(tick);
                return `
                    <line x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}" stroke="${colors.grid}" stroke-width="1" />
                    <text x="${margin.left - 12}" y="${y + 4}" text-anchor="end" font-size="12" fill="${colors.axis}">${compactValue(tick)}</text>
                `;
            })
            .join("");

        const xTicks = xTickIndexes
            .map((index) => {
                const row = chartData[index];
                const x = xScale(index);
                return `
                    <line x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}" stroke="${colors.grid}" stroke-width="1" />
                    <text x="${x}" y="${height - margin.bottom + 24}" text-anchor="middle" font-size="12" fill="${colors.axis}">${escapeSvg(row?.date || "")}</text>
                `;
            })
            .join("");

        const polylines = series
            .flatMap((item) =>
                lineSegments(item.key).map((segment) => `
                    <polyline
                        points="${segment.join(" ")}"
                        fill="none"
                        stroke="${item.color}"
                        stroke-width="${item.key === "actual" ? 3 : 2.5}"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ${item.dash ? `stroke-dasharray="${item.dash}"` : ""}
                    />
                `)
            )
            .join("");

        const legend = series
            .map((item, index) => {
                const x = margin.left + index * 180;
                const y = 42;
                return `
                    <line x1="${x}" y1="${y}" x2="${x + 28}" y2="${y}" stroke="${item.color}" stroke-width="3" ${item.dash ? `stroke-dasharray="${item.dash}"` : ""} />
                    <text x="${x + 36}" y="${y + 4}" font-size="13" fill="${colors.text}">${escapeSvg(item.name)}</text>
                `;
            })
            .join("");

        const svgText = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
                <rect width="100%" height="100%" fill="${colors.background}" />
                <style>
                    * { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
                </style>
                <text x="${margin.left}" y="24" font-size="18" font-weight="700" fill="${colors.text}">Forecast prediction chart</text>
                ${legend}
                ${gridLines}
                ${xTicks}
                <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="${colors.axis}" stroke-width="1.4" />
                <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="${colors.axis}" stroke-width="1.4" />
                <text x="${margin.left + plotWidth / 2}" y="${height - 26}" text-anchor="middle" font-size="13" fill="${colors.muted}">Date</text>
                <text x="24" y="${margin.top + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 24 ${margin.top + plotHeight / 2})" font-size="13" fill="${colors.muted}">Sales</text>
                ${polylines}
            </svg>
        `;

        return {
            svgText,
            width,
            height,
            background: colors.background,
            text: colors.text,
        };
    };

    const exportPredictionChartPdf = () => {
        const chart = buildPredictionChartSvg();
        if (!chart) return;

        const printWindow = window.open("", "_blank", "width=1100,height=800");
        if (!printWindow) {
            setError("Allow pop-ups to export the chart as PDF.");
            return;
        }

        printWindow.document.write(`
            <!doctype html>
            <html>
                <head>
                    <title>Forecast prediction chart</title>
                    <style>
                        @page {
                            size: landscape;
                            margin: 14mm;
                        }
                        * {
                            box-sizing: border-box;
                        }
                        body {
                            margin: 0;
                            background: ${chart.background};
                            color: ${chart.text};
                            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                        }
                        main {
                            width: 100%;
                            min-height: 100vh;
                            display: flex;
                            flex-direction: column;
                            gap: 16px;
                            justify-content: center;
                        }
                        h1 {
                            font-size: 18px;
                            margin: 0 0 6px;
                        }
                        .chart {
                            width: 100%;
                        }
                        .chart svg {
                            display: block;
                            width: 100%;
                            height: auto;
                        }
                    </style>
                </head>
                <body>
                    <main>
                        <h1>Forecast prediction chart</h1>
                        <div class="chart">${chart.svgText}</div>
                    </main>
                    <script>
                        window.addEventListener("load", () => {
                            setTimeout(() => {
                                window.focus();
                                window.print();
                            }, 250);
                        });
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        setError("");
    };

    return (
        <Layout title="Sales forecast">
            <ForecastSurface ref={forecastSurfaceRef}>
                {error && <ErrorBox>{error}</ErrorBox>}

            <Grid>
                <Panel>
                    <PanelTitle>Upload CSV</PanelTitle>
                    <Form onSubmit={handleSubmit}>
                        <Field>
                            CSV file
                            <Input
                                ref={fileInputRef}
                                accept=".csv,text/csv"
                                type="file"
                                onChange={(event) => setFile(event.target.files?.[0] || null)}
                            />
                        </Field>

                        <Field>
                            Model
                            <Select value={model} onChange={(event) => setModel(event.target.value)}>
                                {availableModels.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </Select>
                        </Field>

                        <Field>
                            Horizon, days
                            <Input
                                min="1"
                                max="365"
                                type="number"
                                value={horizon}
                                onChange={(event) => setHorizon(event.target.value)}
                            />
                        </Field>

                        <Button type="submit" disabled={loading || !status?.loaded_models?.length}>
                            {loading ? "Generating..." : "Generate forecast"}
                        </Button>
                    </Form>
                </Panel>

                <Panel>
                    <PanelTitle>Model status</PanelTitle>
                    <StatusGrid>
                        <Stat>
                            <StatLabel>Loaded models</StatLabel>
                            <StatValue>{status?.loaded_models?.length || 0}</StatValue>
                        </Stat>
                        <Stat>
                            <StatLabel>Feature columns</StatLabel>
                            <StatValue>{status?.feature_count || 0}</StatValue>
                        </Stat>
                        <Stat>
                            <StatLabel>Artifacts</StatLabel>
                            <StatValue>{status?.has_scaler && status?.has_encoders ? "Ready" : "Missing"}</StatValue>
                        </Stat>
                    </StatusGrid>
                    <Muted style={{ marginTop: 12 }}>
                        The CSV needs a date column and one of sales, revenue, or total. store_id is optional.
                    </Muted>
                </Panel>
            </Grid>

            <Panel>
                <PanelTitle>Manual CSV rows</PanelTitle>
                <ModeTabs>
                    <ModeButton
                        type="button"
                        $active={manualMode === "simple"}
                        onClick={() => setManualMode("simple")}
                    >
                        Basic form
                    </ModeButton>
                    <ModeButton
                        type="button"
                        $active={manualMode === "full"}
                        onClick={() => setManualMode("full")}
                    >
                        Full form
                    </ModeButton>
                </ModeTabs>

                <Form onSubmit={handleManualSubmit}>
                    {manualMode === "simple" ? (
                        <FormGrid>
                            <Field>
                                Date
                                <Input
                                    type="date"
                                    value={simpleForm.date}
                                    onChange={(event) => handleSimpleChange("date", event.target.value)}
                                    required
                                />
                            </Field>
                            <Field>
                                Store ID
                                <Input
                                    type="text"
                                    value={simpleForm.store_id}
                                    onChange={(event) => handleSimpleChange("store_id", event.target.value)}
                                    placeholder="Optional"
                                />
                            </Field>
                            <Field>
                                Sales
                                <Input
                                    min="0"
                                    step="0.01"
                                    type="number"
                                    value={simpleForm.sales}
                                    onChange={(event) => handleSimpleChange("sales", event.target.value)}
                                />
                            </Field>
                            <Field>
                                Revenue
                                <Input
                                    min="0"
                                    step="0.01"
                                    type="number"
                                    value={simpleForm.revenue}
                                    onChange={(event) => handleSimpleChange("revenue", event.target.value)}
                                />
                            </Field>
                            <Field>
                                Total
                                <Input
                                    min="0"
                                    step="0.01"
                                    type="number"
                                    value={simpleForm.total}
                                    onChange={(event) => handleSimpleChange("total", event.target.value)}
                                />
                            </Field>
                        </FormGrid>
                    ) : (
                        <FormGrid>
                            <Field>
                                Date
                                <Input
                                    type="date"
                                    value={fullForm.date}
                                    onChange={(event) => handleFullChange("date", event.target.value)}
                                    required
                                />
                            </Field>
                            <Field>
                                Store ID
                                <Input
                                    type="text"
                                    value={fullForm.store_id}
                                    onChange={(event) => handleFullChange("store_id", event.target.value)}
                                    placeholder="Optional"
                                />
                            </Field>
                            <Field>
                                Sales
                                <Input
                                    min="0"
                                    step="0.01"
                                    type="number"
                                    value={fullForm.sales}
                                    onChange={(event) => handleFullChange("sales", event.target.value)}
                                />
                            </Field>
                            <Field>
                                Revenue
                                <Input
                                    min="0"
                                    step="0.01"
                                    type="number"
                                    value={fullForm.revenue}
                                    onChange={(event) => handleFullChange("revenue", event.target.value)}
                                />
                            </Field>
                            <Field>
                                Total
                                <Input
                                    min="0"
                                    step="0.01"
                                    type="number"
                                    value={fullForm.total}
                                    onChange={(event) => handleFullChange("total", event.target.value)}
                                />
                            </Field>
                            <Field>
                                Promotion
                                <Select
                                    value={fullForm.has_promotion}
                                    onChange={(event) => handleFullChange("has_promotion", event.target.value)}
                                >
                                    <option value="">Optional</option>
                                    <option value="0">No</option>
                                    <option value="1">Yes</option>
                                </Select>
                            </Field>
                            <Field>
                                Quantity sold
                                <Input
                                    min="0"
                                    step="1"
                                    type="number"
                                    value={fullForm.quantity_sold}
                                    onChange={(event) => handleFullChange("quantity_sold", event.target.value)}
                                />
                            </Field>
                            <Field>
                                Profit
                                <Input
                                    step="0.01"
                                    type="number"
                                    value={fullForm.profit}
                                    onChange={(event) => handleFullChange("profit", event.target.value)}
                                />
                            </Field>
                            <Field>
                                Customer traffic
                                <Input
                                    min="0"
                                    step="1"
                                    type="number"
                                    value={fullForm.customer_traffic}
                                    onChange={(event) => handleFullChange("customer_traffic", event.target.value)}
                                />
                            </Field>
                            <Field>
                                Holiday
                                <Select
                                    value={fullForm.is_holiday}
                                    onChange={(event) => handleFullChange("is_holiday", event.target.value)}
                                >
                                    <option value="">Optional</option>
                                    <option value="0">No</option>
                                    <option value="1">Yes</option>
                                </Select>
                            </Field>
                        </FormGrid>
                    )}

                    <ButtonRow>
                        <Button type="submit">Add row</Button>
                        <SecondaryButton type="button" onClick={selectManualRowsAsCsv} disabled={!manualRows.length}>
                            Select manual CSV
                        </SecondaryButton>
                        <SecondaryButton type="button" onClick={downloadManualCsv} disabled={!manualRows.length}>
                            Download CSV file
                        </SecondaryButton>
                        <Button
                            type="button"
                            onClick={forecastManualRows}
                            disabled={loading || !manualRows.length || !status?.loaded_models?.length}
                        >
                            {loading ? "Generating..." : "Forecast manual rows"}
                        </Button>
                        <DangerButton
                            type="button"
                            onClick={() => setManualRows([])}
                            disabled={!manualRows.length}
                        >
                            Clear rows
                        </DangerButton>
                    </ButtonRow>
                </Form>

                {manualRows.length > 0 && (
                    <TableWrap style={{ marginTop: 16 }}>
                        <Table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Store</th>
                                    <th>Sales</th>
                                    <th>Revenue</th>
                                    <th>Total</th>
                                    <th>Promotion</th>
                                    <th>Quantity</th>
                                    <th>Profit</th>
                                    <th>Traffic</th>
                                    <th>Holiday</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {manualRows.map((row, index) => (
                                    <tr key={`${row.date}-${index}`}>
                                        <td>{row.date}</td>
                                        <td>{row.store_id || "-"}</td>
                                        <td>{row.sales || "-"}</td>
                                        <td>{row.revenue || "-"}</td>
                                        <td>{row.total || "-"}</td>
                                        <td>{row.has_promotion || "-"}</td>
                                        <td>{row.quantity_sold || "-"}</td>
                                        <td>{row.profit || "-"}</td>
                                        <td>{row.customer_traffic || "-"}</td>
                                        <td>{row.is_holiday || "-"}</td>
                                        <td>
                                            <DangerButton type="button" onClick={() => removeManualRow(index)}>
                                                Remove
                                            </DangerButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </TableWrap>
                )}
            </Panel>

                {result && (
                    <>
                    <ResultActions>
                        <SecondaryButton type="button" onClick={exportPredictionChartPdf}>
                            Export chart PDF
                        </SecondaryButton>
                        <Button type="button" onClick={resetForecastWorkspace}>
                            New forecast
                        </Button>
                    </ResultActions>

                    <Panel>
                        <PanelTitle>Prediction chart</PanelTitle>
                        <ChartBox ref={predictionChartRef}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 28, right: 28, bottom: 32, left: 24 }}>
                                    <CartesianGrid stroke="var(--forecast-grid)" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="var(--forecast-axis)"
                                        tick={{ fontSize: 12, fill: "var(--forecast-axis)" }}
                                        minTickGap={22}
                                    >
                                        <Label value="Date" offset={-18} position="insideBottom" fill="var(--text-secondary)" />
                                    </XAxis>
                                    <YAxis
                                        stroke="var(--forecast-axis)"
                                        tick={{ fontSize: 12, fill: "var(--forecast-axis)" }}
                                        tickFormatter={compactValue}
                                    >
                                        <Label
                                            value="Sales, ₸"
                                            angle={-90}
                                            position="insideLeft"
                                            fill="var(--text-secondary)"
                                            style={{ textAnchor: "middle" }}
                                        />
                                    </YAxis>
                                    <Tooltip
                                        formatter={(value, name) => [`${formatValue(value)} ₸`, name]}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        contentStyle={{
                                            background: "var(--forecast-tooltip-bg)",
                                            border: "1px solid var(--forecast-tooltip-border)",
                                            borderRadius: 8,
                                            color: "var(--forecast-tooltip-text)",
                                        }}
                                        itemStyle={{ color: "var(--forecast-tooltip-text)" }}
                                        labelStyle={{ color: "var(--forecast-tooltip-text)" }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="actual"
                                        name="Actual sales"
                                        stroke={COLORS.actual}
                                        strokeWidth={3}
                                        dot={false}
                                        connectNulls={false}
                                    />
                                    {summaries.map((item) => (
                                        <Line
                                            key={item.model}
                                            type="monotone"
                                            dataKey={item.model}
                                            name={`${item.model} forecast`}
                                            stroke={COLORS[item.model] || "var(--forecast-fallback)"}
                                            strokeWidth={2}
                                            strokeDasharray="6 4"
                                            dot={{ r: 2 }}
                                            connectNulls={false}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartBox>
                    </Panel>

                    <Panel>
                        <PanelTitle>Model comparison</PanelTitle>
                        <ChartBox>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summaries} margin={{ top: 24, right: 28, bottom: 28, left: 24 }}>
                                    <CartesianGrid stroke="var(--forecast-grid)" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="model"
                                        stroke="var(--forecast-axis)"
                                        tick={{ fill: "var(--forecast-axis)" }}
                                    >
                                        <Label value="Model" offset={-14} position="insideBottom" fill="var(--text-secondary)" />
                                    </XAxis>
                                    <YAxis
                                        stroke="var(--forecast-axis)"
                                        tick={{ fill: "var(--forecast-axis)" }}
                                        tickFormatter={compactValue}
                                    >
                                        <Label
                                            value="Total forecast, ₸"
                                            angle={-90}
                                            position="insideLeft"
                                            fill="var(--text-secondary)"
                                            style={{ textAnchor: "middle" }}
                                        />
                                    </YAxis>
                                    <Tooltip
                                        formatter={(value) => `${formatValue(value)} ₸`}
                                        contentStyle={{
                                            background: "var(--forecast-tooltip-bg)",
                                            border: "1px solid var(--forecast-tooltip-border)",
                                            borderRadius: 8,
                                            color: "var(--forecast-tooltip-text)",
                                        }}
                                        itemStyle={{ color: "var(--forecast-tooltip-text)" }}
                                        labelStyle={{ color: "var(--forecast-tooltip-text)" }}
                                    />
                                    <Bar dataKey="total_prediction" fill="var(--primary-color)" radius={[6, 6, 0, 0]}>
                                        <LabelList
                                            dataKey="total_prediction"
                                            position="top"
                                            formatter={compactValue}
                                            fill="var(--text-primary)"
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartBox>
                    </Panel>

                    <Panel>
                        <PanelTitle>Forecast rows</PanelTitle>
                        <TableToolbar>
                            <PageInfo>
                                Showing {forecastRangeStart}-{forecastRangeEnd} of {chartData.length}
                            </PageInfo>
                            <PaginationControls>
                                <Field style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    Rows
                                    <Select
                                        value={forecastPageSize}
                                        onChange={(event) => setForecastPageSize(Number(event.target.value))}
                                        style={{ minWidth: 84 }}
                                    >
                                        <option value={10}>10</option>
                                        <option value={15}>15</option>
                                        <option value={30}>30</option>
                                    </Select>
                                </Field>
                                <SecondaryButton
                                    type="button"
                                    onClick={() => setForecastPage((page) => Math.max(1, page - 1))}
                                    disabled={safeForecastPage <= 1}
                                >
                                    Previous
                                </SecondaryButton>
                                <PageInfo>
                                    Page {safeForecastPage} of {forecastPageCount}
                                </PageInfo>
                                <SecondaryButton
                                    type="button"
                                    onClick={() =>
                                        setForecastPage((page) => Math.min(forecastPageCount, page + 1))
                                    }
                                    disabled={safeForecastPage >= forecastPageCount}
                                >
                                    Next
                                </SecondaryButton>
                            </PaginationControls>
                        </TableToolbar>
                        <TableWrap>
                            <Table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Store</th>
                                        <th>Actual</th>
                                        {summaries.map((item) => (
                                            <th key={item.model}>{item.model}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedForecastRows.map((row) => (
                                        <tr key={`${row.store_id}-${row.date}`}>
                                            <td>{row.date}</td>
                                            <td>{row.store_id}</td>
                                            <td>{row.actual ? `${formatValue(row.actual)} ₸` : "-"}</td>
                                            {summaries.map((item) => (
                                                <td key={item.model}>
                                                    {row[item.model] ? `${formatValue(row[item.model])} ₸` : "-"}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </TableWrap>
                    </Panel>
                    </>
                )}
            </ForecastSurface>
        </Layout>
    );
}
