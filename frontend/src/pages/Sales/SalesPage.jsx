import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import salesApi from "../../api/salesApi";

// ===== STYLED COMPONENTS =====
const LoadingText = styled.div`
    padding: 16px;
    color: var(--text-tertiary);
    font-size: 14px;
`;

const ErrorText = styled.div`
    color: var(--error-color);
    margin-bottom: 12px;
    padding: 12px;
    background: var(--error-bg);
    border-radius: 8px;
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

const ChartCard = styled.div`
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 16px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
`;

const ChartTitle = styled.h2`
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
`;

const EmptyChart = styled.div`
    color: var(--text-tertiary);
    font-size: 14px;

    code {
        background: var(--bg-tertiary);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: monospace;
        color: var(--text-secondary);
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
    border-bottom: ${props => props.$last ? 'none' : `1px solid var(--border-color)`};
    font-size: 14px;
    color: var(--text-primary);
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

const PeriodToggle = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    background: var(--bg-tertiary);
    padding: 4px;
    border-radius: 8px;
    width: fit-content;
`;

const PeriodButton = styled.button`
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    background: ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
    color: ${props => props.$active ? 'white' : 'var(--text-secondary)'};

    &:hover:not(:disabled) {
        background: ${props => props.$active ? 'var(--primary-hover)' : 'var(--bg-secondary)'};
    }
`;

const ChartWrapper = styled.div`
    margin-top: 20px;
    min-height: 200px;
`;

const SimpleBarChart = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 200px;
    padding: 16px;
    background: var(--bg-tertiary);
    border-radius: 8px;
`;

const Bar = styled.div`
    flex: 1;
    background: var(--primary-color);
    border-radius: 4px 4px 0 0;
    min-height: 4px;
    height: ${props => props.$height || 0}%;
    position: relative;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.8;
    }
`;

const BarLabel = styled.div`
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: var(--text-secondary);
    white-space: nowrap;
`;

const BarValue = styled.div`
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: var(--text-tertiary);
    white-space: nowrap;
`;

// ===== MAIN COMPONENT =====
export default function SalesPage() {
    const [period, setPeriod] = useState("daily"); // daily, weekly, monthly
    const [data, setData] = useState(null);
    const [chartData, setChartData] = useState({ labels: [], data: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            let result = null;
            if (period === "daily") {
                result = await salesApi.getDaily();
                setData(result);
            } else if (period === "weekly") {
                result = await salesApi.getWeekly();
                setData(result);
            } else if (period === "monthly") {
                result = await salesApi.getMonthly();
                setData(result);
            }

            // Load chart data
            const chartRes = await salesApi.getChart();
            if (chartRes && chartRes.labels && chartRes.data) {
                setChartData(chartRes);
            } else if (Array.isArray(chartRes)) {
                // Fallback: if chart returns array format
                setChartData({
                    labels: chartRes.map(item => item.date || item.label),
                    data: chartRes.map(item => item.total || 0),
                });
            }
        } catch (e) {
            console.error(e);
            setError("Не удалось загрузить данные по продажам.");
        } finally {
            setLoading(false);
        }
    };

    const getTotalRevenue = () => {
        if (!data) return 0;
        if (period === "daily") {
            return data.totalRevenue || 0;
        }
        if (Array.isArray(data)) {
            return data.reduce((sum, item) => sum + (item.total || 0), 0);
        }
        return 0;
    };

    const getMaxValue = () => {
        if (chartData.data.length === 0) return 1;
        return Math.max(...chartData.data, 1);
    };

    const formatPeriodLabel = () => {
        if (period === "daily") return "за день";
        if (period === "weekly") return "за неделю";
        if (period === "monthly") return "за месяц";
        return "";
    };

    return (
        <Layout title="Аналитика продаж">
            {loading && <LoadingText>Загрузка...</LoadingText>}
            {error && <ErrorText>{error}</ErrorText>}

            <PeriodToggle>
                <PeriodButton
                    $active={period === "daily"}
                    onClick={() => setPeriod("daily")}
                >
                    День
                </PeriodButton>
                <PeriodButton
                    $active={period === "weekly"}
                    onClick={() => setPeriod("weekly")}
                >
                    Неделя
                </PeriodButton>
                <PeriodButton
                    $active={period === "monthly"}
                    onClick={() => setPeriod("monthly")}
                >
                    Месяц
                </PeriodButton>
            </PeriodToggle>

            <StatsGrid>
                <StatCard
                    label={`Продажи ${formatPeriodLabel()}`}
                    value={`${getTotalRevenue().toLocaleString('ru-RU')} ₸`}
                />
                {period === "daily" && data && (
                    <StatCard
                        label="Количество продаж"
                        value={data.salesCount || 0}
                    />
                )}
            </StatsGrid>

            <ChartCard>
                <ChartTitle>Динамика продаж (последние 30 дней)</ChartTitle>

                <ChartWrapper>
                    {chartData.labels.length === 0 ? (
                        <EmptyChart>
                            Нет данных для отображения
                        </EmptyChart>
                    ) : (
                        <SimpleBarChart>
                            {chartData.labels.map((label, index) => {
                                const value = chartData.data[index] || 0;
                                const height = (value / getMaxValue()) * 100;
                                const shortLabel = label.split('-').slice(-1)[0]; // Show only day
                                return (
                                    <Bar key={index} $height={height} title={`${label}: ${value} ₸`}>
                                        <BarLabel>{shortLabel}</BarLabel>
                                        {value > 0 && <BarValue>{value > 1000 ? `${(value / 1000).toFixed(0)}k` : value}</BarValue>}
                                    </Bar>
                                );
                            })}
                        </SimpleBarChart>
                    )}
                </ChartWrapper>
            </ChartCard>
        </Layout>
    );
}

