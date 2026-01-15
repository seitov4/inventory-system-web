import React, { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import salesApi from "../../api/salesApi";
import SalesByDayChart from "../../components/Charts/SalesByDayChart";

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
    const [dailySalesData, setDailySalesData] = useState([]); // For SalesByDayChart
    const [selectedDay, setSelectedDay] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadData() {
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

                // Load daily sales data for SalesByDayChart
                // Daily sales aggregation - group by date and sum totals
                let dailyData = [];
                if (period === "daily") {
                    // For daily mode, show last 7 days or just today
                    const weeklyRes = await salesApi.getWeekly().catch(() => []);
                    if (Array.isArray(weeklyRes) && weeklyRes.length > 0) {
                        dailyData = weeklyRes;
                    } else if (result && result.date) {
                        // Convert single daily result to array format
                        dailyData = [{
                            date: result.date,
                            total: result.totalRevenue || 0,
                        }];
                    } else {
                        // Generate empty data for last 7 days
                        const today = new Date();
                        dailyData = Array.from({ length: 7 }, (_, i) => {
                            const date = new Date(today);
                            date.setDate(date.getDate() - (6 - i));
                            return {
                                date: date.toISOString().split('T')[0],
                                total: 0,
                            };
                        });
                    }
                } else if (period === "weekly") {
                    // Weekly data is already grouped by day
                    dailyData = Array.isArray(result) ? result : [];
                } else if (period === "monthly") {
                    // Monthly data is already grouped by day
                    dailyData = Array.isArray(result) ? result : [];
                }
                setDailySalesData(dailyData);
            } catch (e) {
                console.error(e);
                setError("Failed to load sales data.");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [period]);

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
        if (period === "daily") return "for the day";
        if (period === "weekly") return "for the week";
        if (period === "monthly") return "for the month";
        return "";
    };

    return (
        <Layout title="Sales analytics">
            {loading && <LoadingText>Loading...</LoadingText>}
            {error && <ErrorText>{error}</ErrorText>}

            <PeriodToggle>
                <PeriodButton
                    $active={period === "daily"}
                    onClick={() => setPeriod("daily")}
                >
                    Day
                </PeriodButton>
                <PeriodButton
                    $active={period === "weekly"}
                    onClick={() => setPeriod("weekly")}
                >
                    Week
                </PeriodButton>
                <PeriodButton
                    $active={period === "monthly"}
                    onClick={() => setPeriod("monthly")}
                >
                    Month
                </PeriodButton>
            </PeriodToggle>

            <StatsGrid>
                <StatCard
                    label={`Sales ${formatPeriodLabel()}`}
                    value={`${getTotalRevenue().toLocaleString('en-US')} ₸`}
                />
                {period === "daily" && data && (
                    <StatCard
                        label="Number of sales"
                        value={data.salesCount || 0}
                    />
                )}
            </StatsGrid>

            <ChartCard>
                <ChartTitle>Sales dynamics (last 30 days)</ChartTitle>

                <ChartWrapper>
                    {chartData.labels.length === 0 ? (
                        <EmptyChart>
                            No data to display
                        </EmptyChart>
                    ) : (
                        <SimpleBarChart>
                            {chartData.labels.map((label, index) => {
                                const value = chartData.data[index] || 0;
                                const height = (value / getMaxValue()) * 100;
                                const shortLabel = label.split('-').slice(-1)[0]; // Show only day
                                return (
                                    <Bar
                                        key={index}
                                        $height={height}
                                        title={`${label}: ${value} ₸`}
                                        onClick={() =>
                                            setSelectedDay({
                                                date: label,
                                                total: value,
                                            })
                                        }
                                    >
                                        <BarLabel>{shortLabel}</BarLabel>
                                        {value > 0 && <BarValue>{value > 1000 ? `${(value / 1000).toFixed(0)}k` : value}</BarValue>}
                                    </Bar>
                                );
                            })}
                        </SimpleBarChart>
                    )}
                </ChartWrapper>

                {selectedDay && (
                    <EmptyChart style={{ marginTop: 12 }}>
                        Drill‑down for day <code>{selectedDay.date}</code>: total sales{" "}
                        <code>{selectedDay.total.toLocaleString("en-US")} ₸</code>. To show the
                        list of products for this day you'll need a dedicated <code>/sales/by-day</code>{" "}
                        endpoint on the backend.
                    </EmptyChart>
                )}
            </ChartCard>

            {/* Daily Sales Volume Chart */}
            <ChartCard>
                <ChartTitle>Daily Sales Volume {formatPeriodLabel()}</ChartTitle>
                <SalesByDayChart 
                    data={dailySalesData} 
                    period={period}
                />
            </ChartCard>
        </Layout>
    );
}

