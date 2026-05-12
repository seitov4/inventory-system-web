import React, { useEffect, useMemo, useState } from "react";
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
    actual: "#F0F3F6",
    ensemble: "#D29922",
    lightgbm: "#3FB950",
    xgboost: "#58A6FF",
};

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

export default function ForecastPage() {
    const [status, setStatus] = useState(null);
    const [file, setFile] = useState(null);
    const [model, setModel] = useState("ensemble");
    const [horizon, setHorizon] = useState(30);
    const [result, setResult] = useState(null);
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setError("Select a CSV file first.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            const data = await mlForecastApi.forecastCsv(file, {
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

    return (
        <Layout title="Sales forecast">
            {error && <ErrorBox>{error}</ErrorBox>}

            <Grid>
                <Panel>
                    <PanelTitle>Upload CSV</PanelTitle>
                    <Form onSubmit={handleSubmit}>
                        <Field>
                            CSV file
                            <Input
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

            {result && (
                <>
                    <Panel>
                        <PanelTitle>Prediction chart</PanelTitle>
                        <ChartBox>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 28, right: 28, bottom: 32, left: 24 }}>
                                    <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="var(--text-tertiary)"
                                        tick={{ fontSize: 12 }}
                                        minTickGap={22}
                                    >
                                        <Label value="Date" offset={-18} position="insideBottom" fill="var(--text-secondary)" />
                                    </XAxis>
                                    <YAxis
                                        stroke="var(--text-tertiary)"
                                        tick={{ fontSize: 12 }}
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
                                            background: "var(--bg-secondary)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: 8,
                                            color: "var(--text-primary)",
                                        }}
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
                                            stroke={COLORS[item.model] || "#B1BAC4"}
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
                                    <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                                    <XAxis dataKey="model" stroke="var(--text-tertiary)">
                                        <Label value="Model" offset={-14} position="insideBottom" fill="var(--text-secondary)" />
                                    </XAxis>
                                    <YAxis stroke="var(--text-tertiary)" tickFormatter={compactValue}>
                                        <Label
                                            value="Total forecast, ₸"
                                            angle={-90}
                                            position="insideLeft"
                                            fill="var(--text-secondary)"
                                            style={{ textAnchor: "middle" }}
                                        />
                                    </YAxis>
                                    <Tooltip formatter={(value) => `${formatValue(value)} ₸`} />
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
                                    {chartData.slice(0, 100).map((row) => (
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
        </Layout>
    );
}
