import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import salesApi from "../../api/salesApi";
import productsApi from "../../api/productsApi";

// ===== STYLED COMPONENTS =====
const LoadingText = styled.div`
    padding: 16px;
    color: var(--text-tertiary);
    font-size: 14px;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 20px;

    @media (max-width: 1024px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const StatCardWrapper = styled.div`
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 14px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
`;

const StatLabel = styled.div`
    font-size: 13px;
    color: var(--text-tertiary);
`;

const StatValue = styled.div`
    font-size: 22px;
    font-weight: 800;
    margin-top: 4px;
    color: var(--text-primary);
`;

const StatHint = styled.div`
    font-size: 11px;
    margin-top: 4px;
    color: var(--text-secondary);
`;

const InfoCard = styled.div`
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 16px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    font-size: 14px;
    color: var(--text-secondary);
`;

const InfoTitle = styled.h2`
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
`;

const InfoText = styled.p`
    margin: 0;
    line-height: 1.5;
`;

// ===== STAT CARD COMPONENT =====
function StatCard({ label, value, hint }) {
    return (
        <StatCardWrapper>
            <StatLabel>{label}</StatLabel>
            <StatValue>{value}</StatValue>
            {hint && <StatHint>{hint}</StatHint>}
        </StatCardWrapper>
    );
}

// ===== MAIN COMPONENT =====
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
                const [products, dailySales, monthlySales] = await Promise.all([
                    productsApi.getProductsLeft().catch(() => []),
                    salesApi.getDaily?.().catch?.(() => null) ?? null,
                    salesApi.getMonthly?.().catch?.(() => null) ?? null,
                ]);

                const productsArray = Array.isArray(products) ? products : [];
                const minStock = productsArray.filter(p => {
                    const qty = p.quantity ?? p.qty ?? 0;
                    const min = p.min_stock ?? 0;
                    return qty <= min && min > 0;
                });

                setStats({
                    dailySales: dailySales?.totalRevenue || 0,
                    monthlySales: Array.isArray(monthlySales) 
                        ? monthlySales.reduce((sum, item) => sum + (item.total || 0), 0)
                        : 0,
                    lowStockCount: minStock.length,
                    productsCount: productsArray.length,
                });
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
            {loading && <LoadingText>Загрузка...</LoadingText>}

            <StatsGrid>
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
            </StatsGrid>

            <InfoCard>
                <InfoTitle>О системе</InfoTitle>
                <InfoText>
                    На дашборде отображаются ключевые показатели работы магазина:
                    выручка за день и месяц, количество товаров с низким остатком
                    и общий размер номенклатуры. Все данные формируются на основе
                    модулей <strong>Продажи</strong>, <strong>Склад</strong> и{" "}
                    <strong>Журнал движений</strong>.
                </InfoText>
            </InfoCard>
        </Layout>
    );
}

