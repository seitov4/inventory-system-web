import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import salesApi from "../../api/salesApi";
import productsApi from "../../api/productsApi";
import { useAuth } from "../../context/AuthContext";
import { usePage } from "../../context/PageContext";

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

const WidgetsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    margin-top: 20px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

const WidgetCard = styled.button`
    width: 100%;
    text-align: left;
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 14px;
    background: var(--bg-secondary);
    box-shadow: var(--shadow-md);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;

    &:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary-color);
    }
`;

const WidgetTitleRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
`;

const WidgetTitle = styled.div`
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
`;

const WidgetPill = styled.span`
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
`;

const WidgetText = styled.div`
    font-size: 13px;
    color: var(--text-secondary);
`;

const MiniChart = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 40px;
`;

const MiniBar = styled.div`
    flex: 1;
    border-radius: 4px 4px 0 0;
    background: var(--primary-color);
    height: ${props => props.$height || 0}%;
    min-height: 4px;
    opacity: 0.85;
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
    const { role } = useAuth();
    const { setActivePage } = usePage();
    const canSeeAnalytics = role === "owner" || role === "admin";

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
                let dailySalesPromise = Promise.resolve(null);
                let monthlySalesPromise = Promise.resolve(null);
                let chartPromise = Promise.resolve({ labels: [], data: [] });

                if (canSeeAnalytics) {
                    dailySalesPromise = salesApi.getDaily().catch(() => null);
                    monthlySalesPromise = salesApi.getMonthly().catch(() => null);
                    chartPromise = salesApi.getChart().catch(() => ({ labels: [], data: [] }));
                }

                const [products, dailySales, monthlySales, chart] = await Promise.all([
                    productsPromise,
                    dailySalesPromise,
                    monthlySalesPromise,
                    chartPromise,
                ]);

                const productsArray = Array.isArray(products) ? products : [];
                const minStock = productsArray.filter((p) => {
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

                if (canSeeAnalytics && chart && chart.labels && chart.data) {
                    setChartData(chart);
                } else {
                    setChartData({ labels: [], data: [] });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [canSeeAnalytics]);

    const miniChartHeights = useMemo(() => {
        if (!chartData.data.length) return [];
        const max = Math.max(...chartData.data, 1);
        return chartData.data.slice(-7).map((v) => Math.max(5, (v / max) * 100));
    }, [chartData]);

    const widgets = useMemo(() => {
        const base = [];

        if (role === "cashier") {
            base.push(
                {
                    key: "pos",
                    title: "Cashier workspace (POS)",
                    pill: "Shift · cashier",
                    text: "Open the POS screen, scan barcodes and issue receipts without extra forms.",
                },
                {
                    key: "products",
                    title: "Find product by name / barcode",
                    pill: `${stats.productsCount || 0} products`,
                    text: "Quickly find an item, check price and stock before selling.",
                },
                {
                    key: "notifications",
                    title: "Messages from manager / owner",
                    pill: "Notifications",
                    text: "Check tasks, price corrections and low-stock warnings.",
                }
            );
        } else if (role === "manager") {
            base.push(
                {
                    key: "warehouse",
                    title: "Warehouse & stock",
                    pill: `${stats.lowStockCount || 0} low stock`,
                    text: "See items with low stock and plan replenishment.",
                },
                {
                    key: "movements",
                    title: "Movements journal",
                    pill: "IN · OUT · TRANSFER",
                    text: "Review recent transfers and write‑offs for key items.",
                },
                {
                    key: "products",
                    title: "Catalog",
                    pill: `${stats.productsCount || 0} items`,
                    text: "Manage product cards, barcodes and minimum stock levels.",
                }
            );
        } else if (role === "owner" || role === "admin") {
            base.push(
                {
                    key: "sales",
                    title: "Sales & trends",
                    pill: "Analytics",
                    text: "Open sales analytics by day, week and month.",
                },
                {
                    key: "warehouse",
                    title: "Shortage & stock",
                    pill: `${stats.lowStockCount || 0} low stock`,
                    text: "See where you lose money because items are out of stock.",
                },
                {
                    key: role === "owner" ? "notifications" : "addEmployee",
                    title:
                        role === "owner"
                            ? "System notifications"
                            : "Users & roles",
                    pill: role === "owner" ? "Alerts" : "Management",
                    text:
                        role === "owner"
                            ? "See important events: low stock, errors, system reminders."
                            : "Add cashiers and managers, configure role-based access.",
                }
            );
        } else {
            base.push(
                {
                    key: "products",
                    title: "Products & stock",
                    pill: `${stats.productsCount || 0} products`,
                    text: "Browse catalog and basic warehouse stock.",
                },
                {
                    key: "pos",
                    title: "POS screen",
                    pill: "Sale",
                    text: "Quick checkout by barcode or item name.",
                }
            );
        }

        return base;
    }, [role, stats.productsCount, stats.lowStockCount]);

    return (
        <Layout title="Dashboard">
            {loading && <LoadingText>Loading...</LoadingText>}

            <StatsGrid>
                <StatCard
                    label="Sales today"
                    value={`${stats.dailySales.toLocaleString("ru-RU")} ₸`}
                    hint={
                        canSeeAnalytics
                            ? "Based on /sales/daily"
                            : "Available to owner and admin"
                    }
                />
                <StatCard
                    label="Sales this month"
                    value={`${stats.monthlySales.toLocaleString("ru-RU")} ₸`}
                    hint={
                        canSeeAnalytics
                            ? "Aggregated via /sales/monthly"
                            : "Available to owner and admin"
                    }
                />
                <StatCard
                    label="Low stock items"
                    value={stats.lowStockCount}
                    hint="Based on min_stock and movement journal"
                />
                <StatCard
                    label="Total products"
                    value={stats.productsCount}
                    hint="Number of catalog entries"
                />
            </StatsGrid>

            {canSeeAnalytics && miniChartHeights.length > 0 && (
                <InfoCard style={{ marginBottom: 18 }}>
                    <InfoTitle>Mini sales chart (last days)</InfoTitle>
                    <MiniChart>
                        {miniChartHeights.map((h, i) => (
                            <MiniBar key={i} $height={h} />
                        ))}
                    </MiniChart>
                </InfoCard>
            )}

            <WidgetsGrid>
                {widgets.map((w) => (
                    <WidgetCard key={w.key} onClick={() => setActivePage(w.key)}>
                        <WidgetTitleRow>
                            <WidgetTitle>{w.title}</WidgetTitle>
                            {w.pill && <WidgetPill>{w.pill}</WidgetPill>}
                        </WidgetTitleRow>
                        <WidgetText>{w.text}</WidgetText>
                    </WidgetCard>
                ))}
            </WidgetsGrid>

            <InfoCard>
                <InfoTitle>About the system</InfoTitle>
                <InfoText>
                    The dashboard shows key metrics of store performance:
                    daily and monthly revenue, number of low-stock items
                    and total catalog size. All figures are built from
                    <strong>Sales</strong>, <strong>Warehouse</strong> and{" "}
                    <strong>Movements</strong> modules.
                </InfoText>
            </InfoCard>
        </Layout>
    );
}

