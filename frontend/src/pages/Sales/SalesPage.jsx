import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import salesApi from "../../api/salesApi";

// ===== STYLED COMPONENTS =====
const LoadingText = styled.div`
    padding: 16px;
    color: #64748b;
    font-size: 14px;
`;

const ErrorText = styled.div`
    color: #b91c1c;
    margin-bottom: 12px;
    font-size: 14px;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 20px;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const StatCardWrapper = styled.div`
    background: #ffffff;
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
    border: 1px solid rgba(148, 163, 184, 0.25);
`;

const StatLabel = styled.div`
    font-size: 13px;
    color: #64748b;
`;

const StatValue = styled.div`
    font-size: 22px;
    font-weight: 800;
    margin-top: 4px;
    color: #0f172a;
`;

const ChartCard = styled.div`
    background: #ffffff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
    border: 1px solid rgba(148, 163, 184, 0.25);
`;

const ChartTitle = styled.h2`
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
`;

const EmptyChart = styled.div`
    color: #64748b;
    font-size: 14px;

    code {
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
    }
`;

const ChartList = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

const ChartItem = styled.li`
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: ${props => props.$last ? 'none' : '1px solid #e2e8f0'};
    font-size: 14px;
`;

// ===== STAT CARD COMPONENT =====
function StatCard({ label, value }) {
    return (
        <StatCardWrapper>
            <StatLabel>{label}</StatLabel>
            <StatValue>{value}</StatValue>
        </StatCardWrapper>
    );
}

// ===== MAIN COMPONENT =====
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
            {loading && <LoadingText>Загрузка...</LoadingText>}
            {error && <ErrorText>{error}</ErrorText>}

            <StatsGrid>
                <StatCard label="Продажи за день" value={`${daily} ₸`} />
                <StatCard label="Продажи за месяц" value={`${monthly} ₸`} />
            </StatsGrid>

            <ChartCard>
                <ChartTitle>Динамика продаж</ChartTitle>

                {chart.length === 0 ? (
                    <EmptyChart>
                        График будет сформирован после реализации backend-метода
                        <code> /sales/chart</code>.
                    </EmptyChart>
                ) : (
                    <ChartList>
                        {chart.map((p, i) => (
                            <ChartItem key={i} $last={i === chart.length - 1}>
                                <span>{p.label || p.date}</span>
                                <span>{p.total} ₸</span>
                            </ChartItem>
                        ))}
                    </ChartList>
                )}
            </ChartCard>
        </Layout>
    );
}

