import React, { useCallback, useEffect, useMemo, useState } from "react";
import { closestCenter, DndContext } from "@dnd-kit/core";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import salesApi from "../../api/salesApi";
import productsApi from "../../api/productsApi";
import { useAuth } from "../../context/AuthContext";
import { usePage } from "../../context/PageContext";
import { getWidgetConfig, ZONES } from "./dashboardWidgets";
import { getDefaultZoneLayout } from "./dashboardZoneLayouts";
import DashboardZone from "./DashboardZone";

const LoadingText = styled.div`
    padding: 14px 0;
    color: var(--text-tertiary);
    font-size: 14px;
`;

const DashboardContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const TopZonesGrid = styled.div`
    display: grid;
    grid-template-columns: ${(props) =>
        props.$single ? "1fr" : "minmax(0, 0.9fr) minmax(0, 1.1fr)"};
    gap: 16px;
    align-items: stretch;
    min-height: 430px;

    @media (max-width: 1199px) {
        grid-template-columns: 1fr;
        min-height: auto;
    }
`;

const SalesChartPanel = styled.div`
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr);
    gap: 12px;
    height: 100%;
    min-height: 0;
`;

const ChartYAxis = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 8px 0 22px;
    color: var(--text-tertiary);
    font-size: 10px;
    line-height: 1;
    text-align: right;
`;

const ChartBody = styled.div`
    position: relative;
    display: grid;
    grid-template-columns: repeat(${(props) => props.$count || 1}, minmax(10px, 1fr));
    align-items: end;
    gap: 6px;
    height: 100%;
    padding: 8px 0 22px;
    border-left: 1px solid var(--border-color-subtle);
    border-bottom: 1px solid var(--border-color-subtle);

    &::before,
    &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        border-top: 1px dashed rgba(148, 163, 184, 0.2);
        pointer-events: none;
    }

    &::before {
        top: 8px;
    }

    &::after {
        top: 50%;
    }
`;

const ChartBarGroup = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
    min-width: 0;
`;

const ChartValue = styled.div`
    margin-bottom: 6px;
    color: var(--text-secondary);
    font-size: 9px;
    line-height: 1;
    white-space: nowrap;
    opacity: ${(props) => (props.$show ? 1 : 0)};
    transform: translateY(${(props) => (props.$show ? "0" : "4px")});
    transition: opacity 0.18s ease, transform 0.18s ease;
`;

const ChartBar = styled.div`
    width: min(22px, 82%);
    height: ${(props) => props.$height || 0}%;
    min-height: ${(props) => (props.$value > 0 ? "8px" : "2px")};
    border-radius: 999px 999px 0 0;
    background: ${(props) => (props.$value > 0 ? "var(--accent-gradient)" : "var(--border-color)")};
    opacity: ${(props) => (props.$value > 0 ? 0.96 : 0.35)};
    transition: height 0.2s ease, opacity 0.2s ease;

    ${ChartBarGroup}:hover & {
        opacity: 1;
    }
`;

const ChartLabel = styled.div`
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 22px;
    transform: translateX(-50%);
    color: var(--text-tertiary);
    font-size: 9px;
    line-height: 1;
    text-align: center;
    white-space: nowrap;
`;

const ChartEmpty = styled.div`
    grid-column: 1 / -1;
    align-self: center;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 750;
    text-align: center;
    padding: 22px;
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-lg);
    background: rgba(255, 255, 255, 0.58);
`;

const WidgetText = styled.div`
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    flex: 1;
`;

function getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function buildCurrentMonthSeries(monthlySales = []) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalsByDate = new Map();

    for (const item of Array.isArray(monthlySales) ? monthlySales : []) {
        if (!item?.date) continue;
        const key = getLocalDateKey(new Date(item.date));
        totalsByDate.set(key, Number(item.total) || 0);
    }

    const labels = [];
    const data = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        const key = getLocalDateKey(date);
        labels.push(key);
        data.push(totalsByDate.get(key) || 0);
    }

    return { labels, data };
}

export default function DashboardPage() {
    const { role } = useAuth();
    const { setActivePage } = usePage();
    const canSeeAnalytics = role === "owner";
    const [stats, setStats] = useState({
        dailySales: 0,
        monthlySales: 0,
        lowStockCount: 0,
        productsCount: 0,
    });
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState({ labels: [], data: [] });

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);

                const productsPromise = productsApi.getProductsLeft().catch(() => []);
                const dailySalesPromise = canSeeAnalytics
                    ? salesApi.getDaily().catch(() => null)
                    : Promise.resolve(null);
                const monthlySalesPromise = canSeeAnalytics
                    ? salesApi.getMonthly().catch(() => null)
                    : Promise.resolve(null);

                const [products, dailySales, monthlySales] = await Promise.all([
                    productsPromise,
                    dailySalesPromise,
                    monthlySalesPromise,
                ]);

                const productsArray = Array.isArray(products) ? products : [];
                const minStock = productsArray.filter((product) => {
                    const qty = product.quantity ?? product.qty ?? 0;
                    const min = product.min_stock ?? 0;
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

                setChartData(canSeeAnalytics ? buildCurrentMonthSeries(monthlySales) : { labels: [], data: [] });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [canSeeAnalytics]);

    const miniChartData = useMemo(() => {
        if (!chartData.data.length) return [];
        const labels = chartData.labels || [];
        return chartData.data.map((value, index) => ({
            label: labels[index] || "",
            day: index + 1,
            value: Number(value) || 0,
        }));
    }, [chartData]);

    const zoneLayout = useMemo(
        () => getDefaultZoneLayout({ role, canSeeAnalytics }),
        [role, canSeeAnalytics]
    );

    const allWidgetConfigs = useMemo(() => {
        const data = {
            role,
            stats,
            canSeeAnalytics,
            miniChartData,
            setActivePage,
        };

        const widgetMap = new Map();
        Object.values(zoneLayout)
            .flat()
            .forEach((widgetId) => {
                if (!widgetMap.has(widgetId)) {
                    const config = getWidgetConfig(widgetId, data);
                    if (config) widgetMap.set(widgetId, config);
                }
            });

        return widgetMap;
    }, [zoneLayout, role, stats, canSeeAnalytics, miniChartData, setActivePage]);

    const getZoneWidgets = useCallback(
        (zone) => zoneLayout[zone].map((widgetId) => allWidgetConfigs.get(widgetId)).filter(Boolean),
        [zoneLayout, allWidgetConfigs]
    );

    const formatCurrencyCompact = useCallback((value) => {
        const amount = Number(value) || 0;
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
        return amount.toLocaleString("en-US");
    }, []);

    const formatMoney = useCallback((value) => {
        return `${new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(value) || 0)} KZT`;
    }, []);

    const formatChartDate = useCallback((value) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }, []);

    const renderWidget = useCallback(
        (widget) => {
            if (widget.type === "chart" && widget.chartData) {
                const points = widget.chartData;
                const maxValue = Math.max(...points.map((point) => point.value), 1);
                const hasPositiveValue = points.some((point) => Number(point.value) > 0);
                const todayDay = new Date().getDate();

                return (
                    <SalesChartPanel>
                        <ChartYAxis>
                            <span>{hasPositiveValue ? `${formatCurrencyCompact(maxValue)} KZT` : ""}</span>
                            <span>{hasPositiveValue ? `${formatCurrencyCompact(maxValue / 2)} KZT` : ""}</span>
                            <span>0 KZT</span>
                        </ChartYAxis>
                        <ChartBody $count={Math.max(points.length, 1)}>
                            {points.length && hasPositiveValue ? (
                                points.map((point, index) => {
                                    const height = Math.max(4, (point.value / maxValue) * 100);
                                    const showValue =
                                        point.value > 0 && (point.value === maxValue || point.day === todayDay);
                                    return (
                                        <ChartBarGroup
                                            key={`${point.label}-${index}`}
                                            title={`${formatChartDate(point.label)}: ${formatMoney(point.value)}`}
                                        >
                                            <ChartValue $show={showValue}>
                                                {formatCurrencyCompact(point.value)} KZT
                                            </ChartValue>
                                            <ChartBar $height={height} $value={point.value} />
                                            <ChartLabel title={formatChartDate(point.label)}>{point.day}</ChartLabel>
                                        </ChartBarGroup>
                                    );
                                })
                            ) : (
                                <ChartEmpty>No completed sales for this month yet</ChartEmpty>
                            )}
                        </ChartBody>
                    </SalesChartPanel>
                );
            }

            if (widget.type === "info" && widget.text) {
                return <WidgetText>{widget.text}</WidgetText>;
            }

            return widget.children || null;
        },
        [formatChartDate, formatCurrencyCompact, formatMoney]
    );

    return (
        <Layout title="Dashboard">
            {loading && <LoadingText>Loading...</LoadingText>}

            {!loading && (
                <DndContext sensors={[]} collisionDetection={closestCenter}>
                    <DashboardContainer>
                        <TopZonesGrid $single={!canSeeAnalytics}>
                            <DashboardZone
                                zone={ZONES.KPI}
                                widgets={getZoneWidgets(ZONES.KPI)}
                                renderWidget={renderWidget}
                                editMode={false}
                                isDraggingOver={false}
                                isValidDrop={false}
                                minHeight="430px"
                                layout="paired"
                            />

                            {canSeeAnalytics && (
                                <DashboardZone
                                    zone={ZONES.WIDE}
                                    widgets={getZoneWidgets(ZONES.WIDE)}
                                    renderWidget={renderWidget}
                                    editMode={false}
                                    isDraggingOver={false}
                                    isValidDrop={false}
                                    minHeight="430px"
                                    layout="paired"
                                />
                            )}
                        </TopZonesGrid>

                        <DashboardZone
                            zone={ZONES.INFO}
                            widgets={getZoneWidgets(ZONES.INFO)}
                            renderWidget={renderWidget}
                            editMode={false}
                            isDraggingOver={false}
                            isValidDrop={false}
                            minHeight="140px"
                        />

                        <DashboardZone
                            zone={ZONES.ABOUT}
                            widgets={getZoneWidgets(ZONES.ABOUT)}
                            renderWidget={renderWidget}
                            editMode={false}
                            isDraggingOver={false}
                            isValidDrop={false}
                            minHeight="110px"
                        />
                    </DashboardContainer>
                </DndContext>
            )}
        </Layout>
    );
}

