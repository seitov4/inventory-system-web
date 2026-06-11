import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";

export const WIDGET_IDS = {
    SALES_TODAY: "sales-today",
    SALES_MONTH: "sales-month",
    LOW_STOCK: "low-stock",
    TOTAL_PRODUCTS: "total-products",
    MINI_CHART: "mini-chart",
    SALES_TRENDS: "sales-trends",
    SHORTAGE_STOCK: "shortage-stock",
    SYSTEM_NOTIFICATIONS: "system-notifications",
    ABOUT_SYSTEM: "about-system",
};

export const ZONES = {
    KPI: "kpi",
    WIDE: "wide",
    INFO: "info",
    ABOUT: "about",
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

function formatMoney(value) {
    return `${moneyFormatter.format(Number(value) || 0)} KZT`;
}

export function getWidgetConfig(widgetId, data = {}) {
    const {
        stats = {},
        canSeeAnalytics = false,
        miniChartData = [],
        setActivePage = () => {},
    } = data;

    const configs = {
        [WIDGET_IDS.SALES_TODAY]: {
            id: WIDGET_IDS.SALES_TODAY,
            zone: ZONES.KPI,
            allowedZones: [ZONES.KPI],
            title: "Sales today",
            type: "metric",
            size: "small",
            value: formatMoney(stats.dailySales),
            description: canSeeAnalytics ? "Completed sales today" : "Available to owner",
            tint: "blue",
            icon: ReceiptLongOutlinedIcon,
            animateCountUp: true,
        },
        [WIDGET_IDS.SALES_MONTH]: {
            id: WIDGET_IDS.SALES_MONTH,
            zone: ZONES.KPI,
            allowedZones: [ZONES.KPI],
            title: "Sales this month",
            type: "metric",
            size: "small",
            value: formatMoney(stats.monthlySales),
            description: canSeeAnalytics ? "Current month revenue" : "Available to owner",
            tint: "purple",
            icon: TrendingUpOutlinedIcon,
            animateCountUp: true,
        },
        [WIDGET_IDS.LOW_STOCK]: {
            id: WIDGET_IDS.LOW_STOCK,
            zone: ZONES.KPI,
            allowedZones: [ZONES.KPI],
            title: "Low stock items",
            type: "metric",
            size: "small",
            value: stats.lowStockCount || 0,
            description: "Based on min stock and movement journal",
            tint: "amber",
            icon: ReportProblemOutlinedIcon,
            animateCountUp: true,
        },
        [WIDGET_IDS.TOTAL_PRODUCTS]: {
            id: WIDGET_IDS.TOTAL_PRODUCTS,
            zone: ZONES.KPI,
            allowedZones: [ZONES.KPI],
            title: "Total products",
            type: "metric",
            size: "small",
            value: stats.productsCount || 0,
            description: "Number of catalog entries",
            tint: "green",
            icon: Inventory2OutlinedIcon,
            animateCountUp: true,
        },
        [WIDGET_IDS.MINI_CHART]: {
            id: WIDGET_IDS.MINI_CHART,
            zone: ZONES.WIDE,
            allowedZones: [ZONES.WIDE],
            title: "Monthly sales by day",
            type: "chart",
            size: "square",
            tint: "blue",
            icon: TrendingUpOutlinedIcon,
            chartData: miniChartData,
        },
        [WIDGET_IDS.SALES_TRENDS]: {
            id: WIDGET_IDS.SALES_TRENDS,
            zone: ZONES.INFO,
            allowedZones: [ZONES.INFO],
            title: "Sales & trends",
            type: "info",
            size: "medium",
            badge: { text: "Reports", variant: "default" },
            tint: "purple",
            icon: TrendingUpOutlinedIcon,
            onClick: () => setActivePage("reports"),
            text: "Open sales reports and forecast CSV exports.",
        },
        [WIDGET_IDS.SHORTAGE_STOCK]: {
            id: WIDGET_IDS.SHORTAGE_STOCK,
            zone: ZONES.INFO,
            allowedZones: [ZONES.INFO],
            title: "Shortage & stock",
            type: "info",
            size: "medium",
            badge: { text: `${stats.lowStockCount || 0} low stock`, variant: "default" },
            tint: "green",
            icon: WarehouseOutlinedIcon,
            onClick: () => setActivePage("warehouse"),
            text: "See where you lose money because items are out of stock.",
        },
        [WIDGET_IDS.SYSTEM_NOTIFICATIONS]: {
            id: WIDGET_IDS.SYSTEM_NOTIFICATIONS,
            zone: ZONES.INFO,
            allowedZones: [ZONES.INFO],
            title: "System notifications",
            type: "info",
            size: "medium",
            badge: { text: "Alerts", variant: "default" },
            tint: "amber",
            icon: NotificationsNoneOutlinedIcon,
            onClick: () => setActivePage("notifications"),
            text: "See important events: low stock, errors, system reminders.",
        },
        [WIDGET_IDS.ABOUT_SYSTEM]: {
            id: WIDGET_IDS.ABOUT_SYSTEM,
            zone: ZONES.ABOUT,
            allowedZones: [ZONES.ABOUT],
            title: "About the system",
            type: "info",
            size: "medium",
            description:
                "The dashboard shows store performance: daily and monthly revenue, low-stock items and catalog size. Figures are built from Sales, Warehouse and Movements modules.",
            tint: "neutral",
            icon: Inventory2OutlinedIcon,
        },
    };

    return configs[widgetId] || null;
}

export function getWidgetsByZone(zone, data = {}) {
    const { role } = data;

    const baseWidgets = [
        WIDGET_IDS.SALES_TODAY,
        WIDGET_IDS.SALES_MONTH,
        WIDGET_IDS.LOW_STOCK,
        WIDGET_IDS.TOTAL_PRODUCTS,
    ];

    if (zone === ZONES.KPI) {
        return baseWidgets.map((id) => getWidgetConfig(id, data)).filter(Boolean);
    }

    if (zone === ZONES.WIDE) {
        const chartWidget = getWidgetConfig(WIDGET_IDS.MINI_CHART, data);
        return chartWidget ? [chartWidget] : [];
    }

    if (zone === ZONES.INFO) {
        const infoWidgets = [];

        if (role === "owner") {
            infoWidgets.push(
                WIDGET_IDS.SALES_TRENDS,
                WIDGET_IDS.SHORTAGE_STOCK,
                WIDGET_IDS.SYSTEM_NOTIFICATIONS
            );
        } else if (role === "manager") {
            infoWidgets.push(
                WIDGET_IDS.SHORTAGE_STOCK,
                {
                    id: "movements",
                    zone: ZONES.INFO,
                    title: "Movements journal",
                    type: "info",
                    size: "medium",
                    badge: { text: "IN / OUT / TRANSFER", variant: "default" },
                    tint: "amber",
                    icon: SwapHorizOutlinedIcon,
                    onClick: () => data.setActivePage?.("movements"),
                    text: "Review recent transfers and write-offs for key items.",
                },
                {
                    id: "products",
                    zone: ZONES.INFO,
                    title: "Catalog",
                    type: "info",
                    size: "medium",
                    badge: { text: `${data.stats?.productsCount || 0} items`, variant: "default" },
                    tint: "green",
                    icon: Inventory2OutlinedIcon,
                    onClick: () => data.setActivePage?.("products"),
                    text: "Manage product cards, barcodes and minimum stock levels.",
                }
            );
        } else if (role === "cashier") {
            infoWidgets.push(
                {
                    id: "pos",
                    zone: ZONES.INFO,
                    title: "Cashier workspace (POS)",
                    type: "info",
                    size: "medium",
                    badge: { text: "Shift / cashier", variant: "default" },
                    tint: "blue",
                    icon: PointOfSaleOutlinedIcon,
                    onClick: () => data.setActivePage?.("pos"),
                    text: "Open the POS screen, scan barcodes and issue receipts without extra forms.",
                },
                {
                    id: "products",
                    zone: ZONES.INFO,
                    title: "Find product by name / barcode",
                    type: "info",
                    size: "medium",
                    badge: { text: `${data.stats?.productsCount || 0} products`, variant: "default" },
                    tint: "green",
                    icon: Inventory2OutlinedIcon,
                    onClick: () => data.setActivePage?.("products"),
                    text: "Quickly find an item, check price and stock before selling.",
                },
                WIDGET_IDS.SYSTEM_NOTIFICATIONS
            );
        } else {
            infoWidgets.push(
                {
                    id: "products",
                    zone: ZONES.INFO,
                    title: "Products & stock",
                    type: "info",
                    size: "medium",
                    badge: { text: `${data.stats?.productsCount || 0} products`, variant: "default" },
                    tint: "green",
                    icon: Inventory2OutlinedIcon,
                    onClick: () => data.setActivePage?.("products"),
                    text: "Browse catalog and basic warehouse stock.",
                },
                {
                    id: "pos",
                    zone: ZONES.INFO,
                    title: "POS screen",
                    type: "info",
                    size: "medium",
                    badge: { text: "Sale", variant: "default" },
                    tint: "blue",
                    icon: PointOfSaleOutlinedIcon,
                    onClick: () => data.setActivePage?.("pos"),
                    text: "Quick checkout by barcode or item name.",
                }
            );
        }

        return infoWidgets
            .map((widget) => (typeof widget === "string" ? getWidgetConfig(widget, data) : widget))
            .filter(Boolean);
    }

    if (zone === ZONES.ABOUT) {
        return [getWidgetConfig(WIDGET_IDS.ABOUT_SYSTEM, data)].filter(Boolean);
    }

    return [];
}

