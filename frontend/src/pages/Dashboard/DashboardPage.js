import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import salesApi from "../../api/salesApi";
import productsApi from "../../api/productsApi";

function StatCard({ label, value, hint }) {
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
            {hint && (
                <div style={{ fontSize: 11, marginTop: 4, color: "#94a3b8" }}>
                    {hint}
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState({
        dailySales: 0,
        monthlySales: 0,
        lowStockCount: 0,
        productsCount: 0,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                // временная заглушка — потом подключишь реальные методы
                const [products] = await Promise.all([
                    productsApi.getProductsLeft().catch(() => []),
                    salesApi.getDaily?.().catch?.(() => null) ?? null,
                ]);

                setStats((prev) => ({
                    ...prev,
                    productsCount: Array.isArray(products) ? products.length : 0,
                }));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <Layout title="Дашборд">
            {loading && <div>Загрузка...</div>}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 14,
                    marginBottom: 20,
                }}
            >
                <StatCard
                    label="Продажи за день"
                    value={`${stats.dailySales} ₸`}
                    hint="Данные появятся после реализации backend /sales/daily"
                />
                <StatCard
                    label="Продажи за месяц"
                    value={`${stats.monthlySales} ₸`}
                    hint="Используется /sales/monthly"
                />
                <StatCard
                    label="Товаров с низким остатком"
                    value={stats.lowStockCount}
                    hint="min_stock и журнал движений"
                />
                <StatCard
                    label="Всего товаров"
                    value={stats.productsCount}
                    hint="Количество записей в номенклатуре"
                />
            </div>

            <div
                style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    padding: 16,
                    boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
                    border: "1px solid rgba(148,163,184,0.25)",
                    fontSize: 14,
                    color: "#475569",
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
                    О системе
                </h2>
                <p style={{ margin: 0, lineHeight: 1.5 }}>
                    На дашборде отображаются ключевые показатели работы магазина:
                    выручка за день и месяц, количество товаров с низким остатком
                    и общий размер номенклатуры. Все данные формируются на основе
                    модулей <strong>Продажи</strong>, <strong>Склад</strong> и{" "}
                    <strong>Журнал движений</strong>.
                </p>
            </div>
        </Layout>
    );
}
