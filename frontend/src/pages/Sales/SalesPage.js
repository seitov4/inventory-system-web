import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import salesApi from "../../api/salesApi";

function StatCard({ label, value }) {
    return (
        <div
            style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: 14,
                boxShadow: "0 6px 16px rgba(15,23,42,0.04)",
                border: "1px solid rgba(148,163,184,0.25)",
            }}
        >
            <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
            <div
                style={{
                    fontSize: 22,
                    fontWeight: 800,
                    marginTop: 4,
                    color: "#0f172a",
                }}
            >
                {value}
            </div>
        </div>
    );
}

export default function SalesPage() {
    const [daily, setDaily] = useState(0);
    const [monthly, setMonthly] = useState(0);
    const [chart, setChart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                setError("");

                const [dailyRes, monthlyRes, chartRes] = await Promise.all([
                    salesApi.getDaily?.().catch?.(() => null) ?? null,
                    salesApi.getMonthly?.().catch?.(() => null) ?? null,
                    salesApi.getChart?.().catch?.(() => []) ?? [],
                ]);

                setDaily(dailyRes?.total ?? 0);
                setMonthly(monthlyRes?.total ?? 0);
                setChart(Array.isArray(chartRes) ? chartRes : []);
            } catch (e) {
                console.error(e);
                setError("Не удалось загрузить данные по продажам.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <Layout title="Продажи и отчёты">
            {loading && <div>Загрузка...</div>}
            {error && (
                <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>
            )}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 16,
                    marginBottom: 20,
                }}
            >
                <StatCard label="Продажи за день" value={`${daily} ₸`} />
                <StatCard label="Продажи за месяц" value={`${monthly} ₸`} />
            </div>

            <div
                style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: "0 6px 16px rgba(15,23,42,0.04)",
                    border: "1px solid rgba(148,163,184,0.25)",
                }}
            >
                <h2
                    style={{
                        margin: "0 0 8px",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#0f172a",
                    }}
                >
                    Динамика продаж
                </h2>

                {chart.length === 0 ? (
                    <div style={{ color: "#64748b", fontSize: 14 }}>
                        График будет сформирован после реализации backend-метода
                        <code> /sales/chart</code>.
                    </div>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {chart.map((p, i) => (
                            <li
                                key={i}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "6px 0",
                                    borderBottom:
                                        i === chart.length - 1
                                            ? "none"
                                            : "1px solid #e2e8f0",
                                    fontSize: 14,
                                }}
                            >
                                <span>{p.label || p.date}</span>
                                <span>{p.total} ₸</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Layout>
    );
}
