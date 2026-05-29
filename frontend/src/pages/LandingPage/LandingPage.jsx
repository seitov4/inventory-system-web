import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { usePage } from "../../context/PageContext";
import { useAuth } from "../../context/AuthContext";
import productsApi from "../../api/productsApi";
import salesApi from "../../api/salesApi";
import movementsApi from "../../api/movementsApi";
import notificationsApi from "../../api/notificationsApi";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import MoveToInboxOutlinedIcon from "@mui/icons-material/MoveToInboxOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value) || 0);
const formatMoney = (value) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "KZT",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

const getQty = (item) => Number(item?.quantity ?? item?.qty ?? 0) || 0;
const getMinStock = (item) => Number(item?.min_stock ?? 0) || 0;
const isUnread = (item) =>
    item?.status === "UNREAD" || item?.status === "NEW" || item?.is_read === false;

function getName(user) {
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    return fullName || user?.store_name || user?.email || user?.phone || "there";
}

function getRoleLabel(role) {
    const labels = {
        owner: "Owner",
        staff: "Staff",
        manager: "Manager",
        cashier: "Cashier",
    };
    return labels[role] || role || "User";
}

function formatDateTime(value) {
    if (!value) return "Not updated yet";
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDate(value) {
    if (!value) return "";
    return new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
    });
}

function movementLabel(type) {
    if (type === "IN") return "Stock in";
    if (type === "OUT") return "Stock out";
    if (type === "TRANSFER") return "Transfer";
    if (type === "SALE") return "Receipt";
    if (type === "RETURN") return "Return";
    if (type === "ADJUST") return "Adjustment";
    return type || "Movement";
}

function normalizeChartSeries(chart, monthlySales) {
    if (chart?.labels?.length && chart?.data?.length) {
        return chart.labels.map((label, index) => ({
            label,
            value: Number(chart.data[index]) || 0,
        }));
    }

    if (Array.isArray(monthlySales) && monthlySales.length) {
        return monthlySales.map((item) => ({
            label: item.date,
            value: Number(item.total) || 0,
        }));
    }

    const today = new Date();
    return Array.from({ length: 14 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (13 - index));
        return {
            label: date.toISOString().split("T")[0],
            value: 0,
        };
    });
}

async function fetchHomeData(role) {
    const canSeeAnalytics = role === "owner";
    const canSeeMovements = role === "manager" || role === "owner";

    const [products, dailySales, monthlySales, salesChart, notifications, movements] =
        await Promise.all([
            productsApi.getProductsLeft().catch(() => []),
            canSeeAnalytics ? salesApi.getDaily().catch(() => null) : Promise.resolve(null),
            canSeeAnalytics ? salesApi.getMonthly().catch(() => []) : Promise.resolve([]),
            canSeeAnalytics ? salesApi.getChart().catch(() => null) : Promise.resolve(null),
            notificationsApi.getAll({ limit: 8 }).catch(() => []),
            canSeeMovements
                ? movementsApi.getMovements({ limit: 40 }).catch(() => [])
                : Promise.resolve([]),
        ]);

    return {
        products: Array.isArray(products) ? products : [],
        dailySales: dailySales || null,
        monthlySales: Array.isArray(monthlySales) ? monthlySales : [],
        salesTrend: normalizeChartSeries(salesChart, monthlySales).slice(-14),
        notifications: Array.isArray(notifications) ? notifications : [],
        movements: Array.isArray(movements) ? movements : [],
        loadedAt: new Date().toISOString(),
    };
}

const Root = styled.div`
    min-height: 100%;
    background:
        radial-gradient(circle at top left, rgba(22, 141, 255, 0.08), transparent 28%),
        var(--bg-primary);
    color: var(--text-primary);
`;

const Wrap = styled.div`
    max-width: 1360px;
    margin: 0 auto;
    padding: 22px 24px 30px;

    @media (max-width: 720px) {
        padding: 16px 14px 24px;
    }
`;

const Surface = styled.div`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    padding: ${(props) => (props.$compact ? "14px" : "18px")};
`;

const TopBar = styled(Surface)`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: center;
    margin-bottom: 14px;

    @media (max-width: 800px) {
        grid-template-columns: 1fr;
    }
`;

const Eyebrow = styled.div`
    font-size: 11px;
    color: var(--text-tertiary);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
`;

const Title = styled.h1`
    margin: 4px 0 6px;
    font-size: clamp(26px, 3.2vw, 42px);
    line-height: 1.05;
    letter-spacing: 0;
    color: var(--text-primary);
`;

const MetaLine = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    color: var(--text-secondary);
    font-size: 13px;
`;

const Dot = styled.span`
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--border-color);
    align-self: center;
`;

const Pill = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid
        ${(props) =>
            props.$tone === "danger"
                ? "var(--error-border)"
                : props.$tone === "warning"
                  ? "var(--warning-border)"
                  : props.$tone === "success"
                    ? "var(--success-border)"
                    : "var(--border-color)"};
    background:
        ${(props) =>
            props.$tone === "danger"
                ? "var(--error-bg)"
                : props.$tone === "warning"
                  ? "var(--warning-bg)"
                  : props.$tone === "success"
                    ? "var(--success-bg)"
                    : "var(--bg-tertiary)"};
    color:
        ${(props) =>
            props.$tone === "danger"
                ? "var(--error-color)"
                : props.$tone === "warning"
                  ? "var(--warning-color)"
                  : props.$tone === "success"
                    ? "var(--success-color)"
                    : "var(--text-secondary)"};
    border-radius: var(--radius-pill);
    padding: 5px 9px;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
`;

const StatusChipRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;

    @media (max-width: 800px) {
        justify-content: flex-start;
    }
`;

const CommandGrid = styled.section`
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.7fr);
    gap: 14px;
    margin-bottom: 14px;

    @media (max-width: 1000px) {
        grid-template-columns: 1fr;
    }
`;

const GradientCard = styled.div`
    position: relative;
    overflow: hidden;
    min-height: 236px;
    border-radius: var(--radius-xl);
    padding: 22px;
    color: #ffffff;
    background: var(--accent-gradient);
    box-shadow: 0 22px 52px rgba(70, 104, 255, 0.26);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(220px, 0.55fr);
    gap: 18px;
    align-items: stretch;

    &::before {
        content: "";
        position: absolute;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        top: -95px;
        right: -55px;
        background: rgba(255, 255, 255, 0.15);
    }

    @media (max-width: 760px) {
        grid-template-columns: 1fr;
        padding: 18px;
    }
`;

const GradientContent = styled.div`
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 18px;
`;

const GradientBadge = styled.span`
    width: max-content;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    border-radius: var(--radius-pill);
    background: rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 0.92);
    font-size: 12px;
    font-weight: 850;

    svg {
        width: 17px;
        height: 17px;
    }
`;

const GradientTitle = styled.h2`
    margin: 12px 0 8px;
    font-size: clamp(26px, 3.8vw, 42px);
    line-height: 1.04;
    letter-spacing: 0;
`;

const GradientText = styled.p`
    max-width: 600px;
    margin: 0;
    color: rgba(255, 255, 255, 0.86);
    font-size: 15px;
    line-height: 1.55;
`;

const GradientActions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
`;

const GradientButton = styled.button`
    border: 1px solid rgba(255, 255, 255, 0.24);
    background: ${(props) => (props.$primary ? "#ffffff" : "rgba(255, 255, 255, 0.14)")};
    color: ${(props) => (props.$primary ? "var(--primary-hover)" : "#ffffff")};
    border-radius: 15px;
    padding: 10px 13px;
    font-size: 13px;
    font-weight: 850;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    transition: transform 0.18s ease, background 0.18s ease;

    svg {
        width: 16px;
        height: 16px;
    }

    &:hover {
        transform: translateY(-1px);
        background: ${(props) => (props.$primary ? "#ffffff" : "rgba(255, 255, 255, 0.2)")};
    }
`;

const GradientStats = styled.div`
    position: relative;
    z-index: 1;
    display: grid;
    gap: 10px;
    align-content: stretch;
`;

const GlassStat = styled.div`
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.13);
    border-radius: 18px;
    padding: 12px;
    backdrop-filter: blur(10px);
`;

const GlassLabel = styled.div`
    color: rgba(255, 255, 255, 0.72);
    font-size: 11px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.06em;
`;

const GlassValue = styled.div`
    margin-top: 6px;
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
`;

const StatusPanel = styled(Surface)`
    display: grid;
    gap: 10px;
    align-content: start;
`;

const StatusRow = styled.div`
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color-subtle);

    &:last-child {
        border-bottom: none;
    }
`;

const IconTile = styled.span`
    width: ${(props) => (props.$small ? "34px" : "42px")};
    height: ${(props) => (props.$small ? "34px" : "42px")};
    border-radius: ${(props) => (props.$small ? "12px" : "15px")};
    background:
        ${(props) =>
            props.$tone === "gradient"
                ? "var(--accent-gradient)"
                : props.$tone === "warning"
                  ? "var(--warning-bg)"
                  : props.$tone === "danger"
                    ? "var(--error-bg)"
                    : props.$tone === "success"
                      ? "var(--success-bg)"
                      : "var(--primary-light)"};
    color:
        ${(props) =>
            props.$tone === "gradient"
                ? "#ffffff"
                : props.$tone === "warning"
                  ? "var(--warning-color)"
                  : props.$tone === "danger"
                    ? "var(--error-color)"
                    : props.$tone === "success"
                      ? "var(--success-color)"
                      : "var(--primary-color)"};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
        width: ${(props) => (props.$small ? "19px" : "22px")};
        height: ${(props) => (props.$small ? "19px" : "22px")};
    }
`;

const StatusLabel = styled.div`
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.06em;
`;

const StatusMeta = styled.div`
    margin-top: 3px;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.35;
`;

const StatusValue = styled.div`
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 900;
`;

const Section = styled.section`
    margin-top: 14px;
`;

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
    margin-bottom: 10px;

    @media (max-width: 720px) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const SectionTitle = styled.h2`
    margin: 0;
    font-size: 19px;
    color: var(--text-primary);
`;

const SectionSubtitle = styled.p`
    margin: 3px 0 0;
    color: var(--text-secondary);
    font-size: 13px;
`;

const LinkButton = styled.button`
    border: 1px solid var(--border-color);
    background: #ffffff;
    color: var(--primary-color);
    border-radius: 14px;
    padding: 8px 11px;
    font-size: 13px;
    font-weight: 850;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.035);

    svg {
        width: 16px;
        height: 16px;
    }

    &:hover {
        background: var(--primary-light);
        border-color: var(--primary-soft);
    }
`;

const QuickActionGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;

    @media (max-width: 1240px) {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    @media (max-width: 820px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 460px) {
        grid-template-columns: 1fr;
    }
`;

const ActionCard = styled.button`
    text-align: left;
    border: 1px solid ${(props) => (props.$primary ? "transparent" : "var(--border-color)")};
    background: ${(props) => (props.$primary ? "var(--accent-gradient)" : "#ffffff")};
    color: ${(props) => (props.$primary ? "#ffffff" : "var(--text-primary)")};
    border-radius: var(--radius-lg);
    padding: 13px;
    cursor: pointer;
    min-height: 102px;
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 9px;
    box-shadow: ${(props) =>
        props.$primary
            ? "0 18px 34px rgba(70, 104, 255, 0.22)"
            : "0 8px 22px rgba(15, 23, 42, 0.045)"};
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

    &:hover {
        transform: translateY(-2px);
        border-color: ${(props) => (props.$primary ? "transparent" : "var(--primary-soft)")};
        box-shadow: ${(props) =>
            props.$primary
                ? "0 22px 40px rgba(70, 104, 255, 0.26)"
                : "0 14px 30px rgba(15, 23, 42, 0.08)"};
    }
`;

const ActionTop = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
`;

const ActionTitle = styled.span`
    display: block;
    font-size: 14px;
    font-weight: 900;
`;

const ActionText = styled.span`
    display: block;
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.35;
    color: ${(props) => (props.$primary ? "rgba(255,255,255,0.82)" : "var(--text-secondary)")};
`;

const MetricsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;

    @media (max-width: 1120px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 560px) {
        grid-template-columns: 1fr;
    }
`;

const MetricCard = styled(Surface)`
    min-height: 126px;
    padding: 14px;
`;

const MetricTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
`;

const MetricLabel = styled.div`
    color: var(--text-tertiary);
    font-size: 11px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.06em;
`;

const MetricValue = styled.div`
    margin-top: 12px;
    font-size: clamp(24px, 3vw, 34px);
    line-height: 1;
    font-weight: 950;
    color: var(--text-primary);
`;

const MetricNote = styled.div`
    margin-top: 8px;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.4;
`;

const MonitoringGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(260px, 0.85fr) minmax(260px, 0.85fr);
    gap: 12px;
    align-items: start;

    @media (max-width: 1180px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 760px) {
        grid-template-columns: 1fr;
    }
`;

const Panel = styled(Surface)`
    min-height: ${(props) => (props.$tall ? "306px" : "auto")};
`;

const PanelTitleRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
`;

const PanelTitle = styled.h3`
    margin: 0;
    font-size: 16px;
    color: var(--text-primary);
`;

const TrendBars = styled.div`
    position: relative;
    display: grid;
    grid-template-columns: repeat(${(props) => props.$count || 1}, minmax(6px, 1fr));
    align-items: end;
    gap: 7px;
    min-height: 145px;
    padding: 12px 0 4px;
    border-bottom: 1px solid var(--border-color);
`;

const TrendBar = styled.div`
    min-height: ${(props) => (props.$value > 0 ? "8px" : "4px")};
    height: ${(props) => props.$height || 0}%;
    background: ${(props) => (props.$value > 0 ? "var(--accent-gradient)" : "var(--border-color)")};
    border-radius: 999px 999px 0 0;
`;

const TrendOverlay = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    color: var(--text-tertiary);
    font-size: 12px;
    font-weight: 750;
`;

const TrendLabels = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
    color: var(--text-tertiary);
    font-size: 12px;
`;

const ProgressTrack = styled.div`
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: var(--bg-tertiary);
    overflow: hidden;
    margin: 12px 0;
`;

const ProgressFill = styled.div`
    height: 100%;
    width: ${(props) => props.$width || 0}%;
    background:
        ${(props) =>
            props.$tone === "danger"
                ? "var(--error-color)"
                : props.$tone === "warning"
                  ? "var(--warning-color)"
                  : "var(--success-color)"};
`;

const List = styled.div`
    display: grid;
    gap: 8px;
`;

const ListItem = styled.div`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 10px;
    border: 1px solid var(--border-color-subtle);
    border-radius: 16px;
    background: var(--bg-tertiary);
`;

const ItemTitle = styled.div`
    font-size: 13px;
    color: var(--text-primary);
    font-weight: 850;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const ItemMeta = styled.div`
    margin-top: 3px;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const EmptyState = styled.div`
    padding: 18px;
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-lg);
    color: var(--text-tertiary);
    background: var(--bg-tertiary);
    font-size: 13px;
    text-align: center;
`;

const ReportGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;

    @media (max-width: 1040px) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const ReportShortcut = styled.button`
    padding: 13px;
    text-align: left;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    background: #ffffff;
    color: var(--text-primary);
    cursor: pointer;
    display: grid;
    gap: 8px;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);

    &:hover {
        background: var(--primary-light);
        border-color: var(--primary-soft);
    }
`;

const LoadingCard = styled(Surface)`
    color: var(--text-secondary);
`;

function AuthLanding({ user, role, setActivePage }) {
    const canSeeAnalytics = role === "owner";
    const canManageUsers = role === "owner";
    const canManageStock = role === "manager" || role === "owner";
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const next = await fetchHomeData(role);
                if (!cancelled) setData(next);
            } catch (e) {
                if (!cancelled) setError(e?.message || "Could not load overview data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [role]);

    const derived = useMemo(() => {
        const products = data?.products || [];
        const lowStock = products
            .filter((item) => {
                const min = getMinStock(item);
                return min > 0 && getQty(item) <= min;
            })
            .sort((a, b) => getQty(a) - getQty(b));
        const outOfStock = products.filter((item) => getQty(item) <= 0);
        const unreadAlerts = (data?.notifications || []).filter(isUnread);
        const saleMovements = (data?.movements || []).filter((item) => item.type === "SALE");
        const topBySales = Array.from(
            saleMovements.reduce((map, item) => {
                const key = item.product_id || item.product_name || "unknown";
                const current = map.get(key) || {
                    name: item.product_name || "Unknown product",
                    qty: 0,
                    receipts: 0,
                };
                current.qty += Number(item.quantity) || 0;
                current.receipts += 1;
                map.set(key, current);
                return map;
            }, new Map()).values()
        )
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        const monthRevenue = (data?.monthlySales || []).reduce(
            (sum, item) => sum + (Number(item.total) || 0),
            0
        );
        const dailyRevenue = Number(data?.dailySales?.totalRevenue || 0);
        const dailyCount = Number(data?.dailySales?.salesCount || 0);
        const stockPressure = products.length
            ? Math.round((lowStock.length / products.length) * 100)
            : 0;
        const riskTone = outOfStock.length > 0 ? "danger" : lowStock.length > 0 ? "warning" : "success";
        const riskLabel = outOfStock.length > 0 ? "Critical" : lowStock.length > 0 ? "Watch" : "Stable";

        return {
            products,
            lowStock,
            outOfStock,
            unreadAlerts,
            saleMovements,
            topBySales,
            monthRevenue,
            dailyRevenue,
            dailyCount,
            stockPressure,
            riskTone,
            riskLabel,
        };
    }, [data]);

    const quickActions = useMemo(() => {
        const actions = [
            { label: "Dashboard", text: "KPIs and widgets", page: "dashboard", icon: DashboardOutlinedIcon, primary: true },
            { label: "Products", text: "Catalog and inventory", page: "products", icon: Inventory2OutlinedIcon },
            { label: "POS", text: "Create a receipt", page: "pos", icon: PointOfSaleOutlinedIcon },
            { label: "Notifications", text: `${derived.unreadAlerts.length} unread alerts`, page: "notifications", icon: NotificationsNoneOutlinedIcon },
        ];

        if (canSeeAnalytics) {
            actions.splice(1, 0, { label: "Reports", text: "Exports and summaries", page: "reports", icon: AssessmentOutlinedIcon });
            actions.push({ label: "Sales history", text: "Revenue and receipts", page: "sales", icon: ReceiptLongOutlinedIcon });
        }

        if (canManageStock) {
            actions.push(
                { label: "Warehouse", text: "Stock by location", page: "warehouse", icon: WarehouseOutlinedIcon },
                { label: "Stock intake", text: "Receive products", page: "stockIn", icon: MoveToInboxOutlinedIcon },
                { label: "Movements", text: "Inventory journal", page: "movements", icon: SwapHorizOutlinedIcon }
            );
        }

        if (canManageUsers) {
            actions.push(
                { label: "Staff", text: "Users and roles", page: "addEmployee", icon: GroupsOutlinedIcon },
                { label: "Settings", text: "Store configuration", page: "settings", icon: SettingsOutlinedIcon }
            );
        }

        return actions;
    }, [canManageStock, canManageUsers, canSeeAnalytics, derived.unreadAlerts.length]);

    const metricCards = [
        {
            label: "Products in catalog",
            value: formatNumber(derived.products.length),
            note: "Active product records",
            icon: Inventory2OutlinedIcon,
        },
        {
            label: "Low stock items",
            value: formatNumber(derived.lowStock.length),
            note: "At or below minimum stock",
            tone: derived.lowStock.length ? "warning" : "success",
            icon: WarningAmberOutlinedIcon,
        },
        {
            label: "Out of stock",
            value: formatNumber(derived.outOfStock.length),
            note: "Quantity is zero",
            tone: derived.outOfStock.length ? "danger" : "success",
            icon: ErrorOutlineOutlinedIcon,
        },
        {
            label: "Sales today",
            value: canSeeAnalytics ? formatNumber(derived.dailyCount) : "Limited",
            note: canSeeAnalytics ? `${formatMoney(derived.dailyRevenue)} revenue` : "Analytics access is restricted",
            icon: ShoppingCartOutlinedIcon,
        },
        {
            label: "Revenue month",
            value: canSeeAnalytics ? formatMoney(derived.monthRevenue) : "Limited",
            note: "Month-to-date total",
            icon: TrendingUpOutlinedIcon,
        },
        {
            label: "Unread alerts",
            value: formatNumber(derived.unreadAlerts.length),
            note: "Open notifications for details",
            tone: derived.unreadAlerts.length ? "warning" : "success",
            icon: NotificationsNoneOutlinedIcon,
        },
        {
            label: "Recent receipts",
            value: canSeeAnalytics ? formatNumber(derived.dailyCount || derived.saleMovements.length) : "Limited",
            note: "Daily count with movement fallback",
            icon: ReceiptLongOutlinedIcon,
        },
        {
            label: "Stock pressure",
            value: `${derived.stockPressure}%`,
            note: `${formatNumber(derived.lowStock.length)} items at risk`,
            tone: derived.riskTone,
            icon: BoltOutlinedIcon,
        },
    ];

    const trend = data?.salesTrend || [];
    const maxTrendValue = Math.max(...trend.map((point) => Number(point.value) || 0), 1);
    const firstTrendLabel = trend[0]?.label;
    const lastTrendLabel = trend[trend.length - 1]?.label;
    const hasTrendData = trend.some((point) => Number(point.value) > 0);

    return (
        <Root>
            <Wrap>
                <TopBar>
                    <div>
                        <Eyebrow>Operational home</Eyebrow>
                        <Title>Welcome back, {getName(user)}</Title>
                        <MetaLine>
                            <span>{getRoleLabel(role)}</span>
                            <Dot />
                            <span>{user?.store_name || "Store not set"}</span>
                            <Dot />
                            <span>{formatDateTime(data?.loadedAt)}</span>
                        </MetaLine>
                    </div>
                    <StatusChipRow>
                        <Pill $tone={derived.riskTone}>Inventory risk: {derived.riskLabel}</Pill>
                        <Pill $tone={loading ? undefined : "success"}>{loading ? "Syncing" : "Live"}</Pill>
                    </StatusChipRow>
                </TopBar>

                <CommandGrid>
                    <GradientCard>
                        <GradientContent>
                            <div>
                                <GradientBadge>
                                    <AutoAwesomeOutlinedIcon />
                                    InventiX control layer
                                </GradientBadge>
                                <GradientTitle>Inventory control center</GradientTitle>
                                <GradientText>
                                    Monitor sales, stock pressure and alerts in one place with fast access to the workflows that move inventory.
                                </GradientText>
                            </div>
                            <GradientActions>
                                <GradientButton $primary type="button" onClick={() => setActivePage("pos")}>
                                    <PointOfSaleOutlinedIcon />
                                    Open POS
                                </GradientButton>
                                <GradientButton type="button" onClick={() => setActivePage("reports")}>
                                    <AssessmentOutlinedIcon />
                                    View reports
                                </GradientButton>
                                <GradientButton type="button" onClick={() => setActivePage("products")}>
                                    <WarningAmberOutlinedIcon />
                                    Check low stock
                                </GradientButton>
                            </GradientActions>
                        </GradientContent>
                        <GradientStats>
                            <GlassStat>
                                <GlassLabel>Risk</GlassLabel>
                                <GlassValue>{derived.riskLabel}</GlassValue>
                            </GlassStat>
                            <GlassStat>
                                <GlassLabel>Revenue today</GlassLabel>
                                <GlassValue>{canSeeAnalytics ? formatMoney(derived.dailyRevenue) : "-"}</GlassValue>
                            </GlassStat>
                            <GlassStat>
                                <GlassLabel>Unread alerts</GlassLabel>
                                <GlassValue>{formatNumber(derived.unreadAlerts.length)}</GlassValue>
                            </GlassStat>
                        </GradientStats>
                    </GradientCard>

                    <StatusPanel>
                        <StatusRow>
                            <IconTile $small $tone="gradient">
                                <CheckCircleOutlineOutlinedIcon />
                            </IconTile>
                            <div>
                                <StatusLabel>Last updated</StatusLabel>
                                <StatusMeta>{formatDateTime(data?.loadedAt)}</StatusMeta>
                            </div>
                            <StatusValue>{loading ? "Loading" : "Live"}</StatusValue>
                        </StatusRow>
                        <StatusRow>
                            <IconTile $small $tone={derived.riskTone}>
                                <BoltOutlinedIcon />
                            </IconTile>
                            <div>
                                <StatusLabel>Stock pressure</StatusLabel>
                                <StatusMeta>{formatNumber(derived.lowStock.length)} low stock items</StatusMeta>
                            </div>
                            <StatusValue>{derived.stockPressure}%</StatusValue>
                        </StatusRow>
                        <StatusRow>
                            <IconTile $small>
                                <TrendingUpOutlinedIcon />
                            </IconTile>
                            <div>
                                <StatusLabel>Revenue today</StatusLabel>
                                <StatusMeta>{canSeeAnalytics ? "Completed sales" : "Restricted"}</StatusMeta>
                            </div>
                            <StatusValue>{canSeeAnalytics ? formatMoney(derived.dailyRevenue) : "-"}</StatusValue>
                        </StatusRow>
                        <StatusRow>
                            <IconTile $small $tone={derived.unreadAlerts.length ? "warning" : "success"}>
                                <NotificationsNoneOutlinedIcon />
                            </IconTile>
                            <div>
                                <StatusLabel>Unread alerts</StatusLabel>
                                <StatusMeta>Notifications waiting</StatusMeta>
                            </div>
                            <StatusValue>{formatNumber(derived.unreadAlerts.length)}</StatusValue>
                        </StatusRow>
                    </StatusPanel>
                </CommandGrid>

                {loading ? (
                    <LoadingCard $compact>Loading store overview...</LoadingCard>
                ) : error ? (
                    <Pill $tone="danger">{error}</Pill>
                ) : (
                    <>
                        <Section>
                            <SectionHeader>
                                <div>
                                    <SectionTitle>Quick actions</SectionTitle>
                                    <SectionSubtitle>Direct access to sales, stock and management workflows.</SectionSubtitle>
                                </div>
                            </SectionHeader>
                            <QuickActionGrid>
                                {quickActions.map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <ActionCard
                                            key={`${action.page}-${action.label}`}
                                            type="button"
                                            $primary={action.primary}
                                            onClick={() => setActivePage(action.page)}
                                        >
                                            <ActionTop>
                                                <IconTile $small $tone={action.primary ? "gradient" : undefined}>
                                                    <Icon />
                                                </IconTile>
                                                <ArrowForwardOutlinedIcon />
                                            </ActionTop>
                                            <div>
                                                <ActionTitle>{action.label}</ActionTitle>
                                                <ActionText $primary={action.primary}>{action.text}</ActionText>
                                            </div>
                                        </ActionCard>
                                    );
                                })}
                            </QuickActionGrid>
                        </Section>

                        <Section>
                            <SectionHeader>
                                <div>
                                    <SectionTitle>Store overview</SectionTitle>
                                    <SectionSubtitle>Compact catalog, sales and alert signals.</SectionSubtitle>
                                </div>
                            </SectionHeader>
                            <MetricsGrid>
                                {metricCards.map((metric) => {
                                    const Icon = metric.icon;
                                    return (
                                        <MetricCard key={metric.label}>
                                            <MetricTop>
                                                <div>
                                                    <MetricLabel>{metric.label}</MetricLabel>
                                                    <MetricValue>{metric.value}</MetricValue>
                                                </div>
                                                <IconTile $small $tone={metric.tone}>
                                                    <Icon />
                                                </IconTile>
                                            </MetricTop>
                                            <MetricNote>{metric.note}</MetricNote>
                                            {metric.tone && <Pill $tone={metric.tone}>{metric.tone}</Pill>}
                                        </MetricCard>
                                    );
                                })}
                            </MetricsGrid>
                        </Section>

                        <Section>
                            <SectionHeader>
                                <div>
                                    <SectionTitle>Monitoring</SectionTitle>
                                    <SectionSubtitle>Sales trend, restocking risk and the latest store activity.</SectionSubtitle>
                                </div>
                                <LinkButton type="button" onClick={() => setActivePage("dashboard")}>
                                    Open dashboard
                                    <ArrowForwardOutlinedIcon />
                                </LinkButton>
                            </SectionHeader>

                            <MonitoringGrid>
                                <Panel $tall>
                                    <PanelTitleRow>
                                        <div>
                                            <PanelTitle>Sales trend, last 14 days</PanelTitle>
                                            <MetricNote>
                                                {canSeeAnalytics ? "Completed sales by day" : "owner analytics"}
                                            </MetricNote>
                                        </div>
                                        <IconTile $small $tone="gradient">
                                            <TrendingUpOutlinedIcon />
                                        </IconTile>
                                    </PanelTitleRow>
                                    {canSeeAnalytics ? (
                                        <>
                                            <TrendBars $count={Math.max(trend.length, 1)}>
                                                {trend.map((point, index) => {
                                                    const value = Number(point.value) || 0;
                                                    const height = Math.max(4, (value / maxTrendValue) * 100);
                                                    return (
                                                        <TrendBar
                                                            key={`${point.label}-${index}`}
                                                            $height={height}
                                                            $value={value}
                                                            title={`${formatDate(point.label)}: ${formatMoney(value)}`}
                                                        />
                                                    );
                                                })}
                                                {!hasTrendData && <TrendOverlay>No sales yet</TrendOverlay>}
                                            </TrendBars>
                                            <TrendLabels>
                                                <span>{formatDate(firstTrendLabel)}</span>
                                                <span>{formatDate(lastTrendLabel)}</span>
                                            </TrendLabels>
                                        </>
                                    ) : (
                                        <EmptyState>Sales trend is available for owneristrator roles.</EmptyState>
                                    )}
                                    <ProgressTrack>
                                        <ProgressFill $width={derived.stockPressure} $tone={derived.riskTone} />
                                    </ProgressTrack>
                                    <MetricNote>
                                        Stock pressure: {formatNumber(derived.lowStock.length)} of {formatNumber(derived.products.length)} products are at risk.
                                    </MetricNote>
                                </Panel>

                                <Panel>
                                    <PanelTitleRow>
                                        <PanelTitle>Critical stock</PanelTitle>
                                        <LinkButton type="button" onClick={() => setActivePage("products")}>
                                            Products
                                        </LinkButton>
                                    </PanelTitleRow>
                                    {derived.lowStock.length ? (
                                        <List>
                                            {derived.lowStock.slice(0, 5).map((item) => {
                                                const qty = getQty(item);
                                                const min = getMinStock(item);
                                                return (
                                                    <ListItem key={item.id || item.sku || item.name}>
                                                        <IconTile $small $tone={qty <= 0 ? "danger" : "warning"}>
                                                            <WarningAmberOutlinedIcon />
                                                        </IconTile>
                                                        <div>
                                                            <ItemTitle>{item.name || "Unnamed product"}</ItemTitle>
                                                            <ItemMeta>SKU {item.sku || "-"} | Minimum {formatNumber(min)}</ItemMeta>
                                                        </div>
                                                        <Pill $tone={qty <= 0 ? "danger" : "warning"}>
                                                            {formatNumber(qty)}
                                                        </Pill>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    ) : (
                                        <EmptyState>No products are below minimum stock.</EmptyState>
                                    )}
                                </Panel>

                                <Panel>
                                    <PanelTitleRow>
                                        <PanelTitle>Latest alerts</PanelTitle>
                                        <LinkButton type="button" onClick={() => setActivePage("notifications")}>
                                            View all
                                        </LinkButton>
                                    </PanelTitleRow>
                                    {derived.unreadAlerts.length ? (
                                        <List>
                                            {derived.unreadAlerts.slice(0, 5).map((alert) => {
                                                const payload = alert.payload || {};
                                                const title =
                                                    alert.type === "LOW_STOCK"
                                                        ? `Low stock: ${payload.product_name || "Product"}`
                                                        : alert.message || alert.type || "Notification";
                                                return (
                                                    <ListItem key={alert.id}>
                                                        <IconTile $small $tone={alert.type === "LOW_STOCK" ? "warning" : undefined}>
                                                            <NotificationsNoneOutlinedIcon />
                                                        </IconTile>
                                                        <div>
                                                            <ItemTitle>{title}</ItemTitle>
                                                            <ItemMeta>
                                                                {formatDateTime(alert.created_at)}
                                                                {payload.quantity !== undefined
                                                                    ? ` | ${formatNumber(payload.quantity)} left`
                                                                    : ""}
                                                            </ItemMeta>
                                                        </div>
                                                        <Pill $tone={alert.type === "LOW_STOCK" ? "warning" : undefined}>New</Pill>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    ) : (
                                        <EmptyState>No unread alerts.</EmptyState>
                                    )}
                                </Panel>

                                <Panel>
                                    <PanelTitleRow>
                                        <PanelTitle>Top products</PanelTitle>
                                        <LinkButton type="button" onClick={() => setActivePage("sales")}>
                                            Sales
                                        </LinkButton>
                                    </PanelTitleRow>
                                    {derived.topBySales.length ? (
                                        <List>
                                            {derived.topBySales.map((item) => (
                                                <ListItem key={item.name}>
                                                    <IconTile $small>
                                                        <ShoppingCartOutlinedIcon />
                                                    </IconTile>
                                                    <div>
                                                        <ItemTitle>{item.name}</ItemTitle>
                                                        <ItemMeta>{formatNumber(item.receipts)} receipt movements</ItemMeta>
                                                    </div>
                                                    <Pill>{formatNumber(item.qty)} sold</Pill>
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <EmptyState>No recent SALE movements to rank products yet.</EmptyState>
                                    )}
                                </Panel>

                                <Panel>
                                    <PanelTitleRow>
                                        <PanelTitle>Recent receipts</PanelTitle>
                                        <LinkButton type="button" onClick={() => setActivePage("movements")}>
                                            Movements
                                        </LinkButton>
                                    </PanelTitleRow>
                                    {data?.movements?.length ? (
                                        <List>
                                            {data.movements.slice(0, 5).map((item) => (
                                                <ListItem key={item.id}>
                                                    <IconTile $small $tone={item.type === "SALE" ? "gradient" : undefined}>
                                                        <ReceiptLongOutlinedIcon />
                                                    </IconTile>
                                                    <div>
                                                        <ItemTitle>{item.product_name || "Unknown product"}</ItemTitle>
                                                        <ItemMeta>{movementLabel(item.type)} | {formatDateTime(item.created_at)}</ItemMeta>
                                                    </div>
                                                    <Pill>{formatNumber(item.quantity)} pcs</Pill>
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <EmptyState>No recent movement data.</EmptyState>
                                    )}
                                </Panel>
                            </MonitoringGrid>
                        </Section>

                        <Section>
                            <SectionHeader>
                                <div>
                                    <SectionTitle>Reports and analytics</SectionTitle>
                                    <SectionSubtitle>Shortcuts to daily, monthly, inventory and stock reports.</SectionSubtitle>
                                </div>
                                <LinkButton type="button" onClick={() => setActivePage("reports")}>
                                    Reports
                                    <ArrowForwardOutlinedIcon />
                                </LinkButton>
                            </SectionHeader>
                            <ReportGrid>
                                {[
                                    ["Daily report", "Today sales and receipts", AssessmentOutlinedIcon],
                                    ["Monthly report", "Month-to-date performance", TrendingUpOutlinedIcon],
                                    ["Inventory report", "Stock levels and valuation", Inventory2OutlinedIcon],
                                    ["Sales report", "Export completed sales", ReceiptLongOutlinedIcon],
                                    ["Low stock report", "Items below minimum stock", WarningAmberOutlinedIcon],
                                ].map(([title, text, Icon]) => (
                                    <ReportShortcut
                                        key={title}
                                        type="button"
                                        onClick={() => setActivePage("reports")}
                                    >
                                        <IconTile $small>
                                            <Icon />
                                        </IconTile>
                                        <div>
                                            <ActionTitle>{title}</ActionTitle>
                                            <MetricNote>{text}</MetricNote>
                                        </div>
                                    </ReportShortcut>
                                ))}
                            </ReportGrid>
                        </Section>
                    </>
                )}
            </Wrap>
        </Root>
    );
}

function GuestLanding({ setActivePage }) {
    return (
        <Root>
            <Wrap>
                <CommandGrid>
                    <GradientCard>
                        <GradientContent>
                            <div>
                                <GradientBadge>
                                    <AutoAwesomeOutlinedIcon />
                                    InventiX workspace
                                </GradientBadge>
                                <GradientTitle>Run catalog, stock and sales from one store system</GradientTitle>
                                <GradientText>Sign in to open your operational home screen.</GradientText>
                            </div>
                            <GradientActions>
                                <GradientButton $primary type="button" onClick={() => setActivePage("login")}>
                                    Sign in
                                </GradientButton>
                                <GradientButton type="button" onClick={() => setActivePage("register")}>
                                    Register store
                                </GradientButton>
                            </GradientActions>
                        </GradientContent>
                    </GradientCard>
                    <StatusPanel>
                        {[
                            ["Products", Inventory2OutlinedIcon],
                            ["Warehouse", WarehouseOutlinedIcon],
                            ["POS", PointOfSaleOutlinedIcon],
                            ["Reports", AssessmentOutlinedIcon],
                        ].map(([item, Icon]) => (
                            <StatusRow key={item}>
                                <IconTile $small>
                                    <Icon />
                                </IconTile>
                                <StatusLabel>{item}</StatusLabel>
                                <StatusValue>Ready</StatusValue>
                            </StatusRow>
                        ))}
                    </StatusPanel>
                </CommandGrid>
            </Wrap>
        </Root>
    );
}

export default function LandingPage() {
    const { setActivePage } = usePage();
    const { user, role, isAuthenticated, status } = useAuth();

    if (status === "loading" || status === "idle") {
        return (
            <Root>
                <Wrap>
                    <LoadingCard>Loading workspace...</LoadingCard>
                </Wrap>
            </Root>
        );
    }

    return isAuthenticated ? (
        <AuthLanding user={user} role={role} setActivePage={setActivePage} />
    ) : (
        <GuestLanding setActivePage={setActivePage} />
    );
}

