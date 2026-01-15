/**
 * Dashboard Widget Configuration
 * Defines all available widgets with their metadata and zone assignments
 */

export const WIDGET_IDS = {
    // Zone 1: KPI Metrics
    SALES_TODAY: 'sales-today',
    SALES_MONTH: 'sales-month',
    LOW_STOCK: 'low-stock',
    TOTAL_PRODUCTS: 'total-products',
    
    // Zone 2: Wide Content
    MINI_CHART: 'mini-chart',
    
    // Zone 3: Info Blocks
    SALES_TRENDS: 'sales-trends',
    SHORTAGE_STOCK: 'shortage-stock',
    SYSTEM_NOTIFICATIONS: 'system-notifications',
    
    // Zone 4: Info
    ABOUT_SYSTEM: 'about-system',
};

export const ZONES = {
    KPI: 'kpi',
    WIDE: 'wide',
    INFO: 'info',
    ABOUT: 'about',
};

/**
 * Get widget configuration
 * @param {string} widgetId - Widget identifier
 * @param {object} data - Dynamic data (stats, widgets, etc.)
 * @returns {object} Widget config
 */
export function getWidgetConfig(widgetId, data = {}) {
    const { stats = {}, widgets = [], canSeeAnalytics = false, miniChartHeights = [], setActivePage = () => {} } = data;
    
    const configs = {
        [WIDGET_IDS.SALES_TODAY]: {
            id: WIDGET_IDS.SALES_TODAY,
            zone: ZONES.KPI,
            allowedZones: [ZONES.KPI], // KPI widgets locked to KPI zone only
            title: 'Sales today',
            type: 'metric',
            size: 'small',
            value: `${stats.dailySales?.toLocaleString("ru-RU") || 0} ₸`,
            description: canSeeAnalytics ? "Based on /sales/daily" : "Available to owner and admin",
            tint: 'blue',
            animateCountUp: true,
        },
        [WIDGET_IDS.SALES_MONTH]: {
            id: WIDGET_IDS.SALES_MONTH,
            zone: ZONES.KPI,
            allowedZones: [ZONES.KPI], // KPI widgets locked to KPI zone only
            title: 'Sales this month',
            type: 'metric',
            size: 'small',
            value: `${stats.monthlySales?.toLocaleString("ru-RU") || 0} ₸`,
            description: canSeeAnalytics ? "Aggregated via /sales/monthly" : "Available to owner and admin",
            tint: 'blue-strong',
            animateCountUp: true,
        },
        [WIDGET_IDS.LOW_STOCK]: {
            id: WIDGET_IDS.LOW_STOCK,
            zone: ZONES.KPI,
            allowedZones: [ZONES.KPI], // KPI widgets locked to KPI zone only
            title: 'Low stock items',
            type: 'metric',
            size: 'small',
            value: stats.lowStockCount || 0,
            description: "Based on min_stock and movement journal",
            tint: 'amber',
            animateCountUp: true,
        },
        [WIDGET_IDS.TOTAL_PRODUCTS]: {
            id: WIDGET_IDS.TOTAL_PRODUCTS,
            zone: ZONES.KPI,
            allowedZones: [ZONES.KPI], // KPI widgets locked to KPI zone only
            title: 'Total products',
            type: 'metric',
            size: 'small',
            value: stats.productsCount || 0,
            description: "Number of catalog entries",
            tint: 'green',
            animateCountUp: true,
        },
        [WIDGET_IDS.MINI_CHART]: {
            id: WIDGET_IDS.MINI_CHART,
            zone: ZONES.WIDE,
            allowedZones: [ZONES.WIDE], // Chart locked to chart zone only
            title: 'Mini sales chart (last days)',
            type: 'chart',
            size: 'large',
            tint: 'blue-strong',
            chartData: miniChartHeights,
        },
        [WIDGET_IDS.SALES_TRENDS]: {
            id: WIDGET_IDS.SALES_TRENDS,
            zone: ZONES.INFO,
            allowedZones: [ZONES.INFO], // Info widgets can only be in info zone
            title: 'Sales & trends',
            type: 'info',
            size: 'medium',
            badge: { text: 'Analytics', variant: 'default' },
            tint: 'blue',
            onClick: () => setActivePage('sales'),
            text: "Open sales analytics by day, week and month.",
        },
        [WIDGET_IDS.SHORTAGE_STOCK]: {
            id: WIDGET_IDS.SHORTAGE_STOCK,
            zone: ZONES.INFO,
            allowedZones: [ZONES.INFO], // Info widgets can only be in info zone
            title: 'Shortage & stock',
            type: 'info',
            size: 'medium',
            badge: { text: `${stats.lowStockCount || 0} low stock`, variant: 'default' },
            tint: 'green',
            onClick: () => setActivePage('warehouse'),
            text: "See where you lose money because items are out of stock.",
        },
        [WIDGET_IDS.SYSTEM_NOTIFICATIONS]: {
            id: WIDGET_IDS.SYSTEM_NOTIFICATIONS,
            zone: ZONES.INFO,
            allowedZones: [ZONES.INFO], // Info widgets can only be in info zone
            title: 'System notifications',
            type: 'info',
            size: 'medium',
            badge: { text: 'Alerts', variant: 'default' },
            tint: 'amber',
            onClick: () => setActivePage('notifications'),
            text: "See important events: low stock, errors, system reminders.",
        },
        [WIDGET_IDS.ABOUT_SYSTEM]: {
            id: WIDGET_IDS.ABOUT_SYSTEM,
            zone: ZONES.ABOUT,
            allowedZones: [ZONES.ABOUT], // About widget locked to about zone
            title: 'About the system',
            type: 'info',
            size: 'medium',
            description: "The dashboard shows key metrics of store performance: daily and monthly revenue, number of low-stock items and total catalog size. All figures are built from Sales, Warehouse and Movements modules.",
            tint: 'neutral',
        },
    };
    
    return configs[widgetId] || null;
}

/**
 * Get all widgets for a specific zone
 * @param {string} zone - Zone identifier
 * @param {object} data - Dynamic data
 * @returns {array} Array of widget configs
 */
export function getWidgetsByZone(zone, data = {}) {
    const { role, widgets = [] } = data;
    
    // Base widgets that are always shown
    const baseWidgets = [
        WIDGET_IDS.SALES_TODAY,
        WIDGET_IDS.SALES_MONTH,
        WIDGET_IDS.LOW_STOCK,
        WIDGET_IDS.TOTAL_PRODUCTS,
    ];
    
    // Zone-specific widget lists
    if (zone === ZONES.KPI) {
        return baseWidgets.map(id => getWidgetConfig(id, data)).filter(Boolean);
    }
    
    if (zone === ZONES.WIDE) {
        const chartWidget = getWidgetConfig(WIDGET_IDS.MINI_CHART, data);
        return chartWidget ? [chartWidget] : [];
    }
    
    if (zone === ZONES.INFO) {
        // Role-based info widgets
        const infoWidgets = [];
        if (role === 'owner' || role === 'admin') {
            infoWidgets.push(
                WIDGET_IDS.SALES_TRENDS,
                WIDGET_IDS.SHORTAGE_STOCK,
                WIDGET_IDS.SYSTEM_NOTIFICATIONS
            );
        } else if (role === 'manager') {
            infoWidgets.push(
                WIDGET_IDS.SHORTAGE_STOCK,
                { id: 'movements', zone: ZONES.INFO, title: 'Movements journal', type: 'info', size: 'medium', badge: { text: 'IN · OUT · TRANSFER', variant: 'default' }, tint: 'amber', onClick: () => data.setActivePage?.('movements'), text: "Review recent transfers and write‑offs for key items." },
                { id: 'products', zone: ZONES.INFO, title: 'Catalog', type: 'info', size: 'medium', badge: { text: `${data.stats?.productsCount || 0} items`, variant: 'default' }, tint: 'green', onClick: () => data.setActivePage?.('products'), text: "Manage product cards, barcodes and minimum stock levels." }
            );
        } else if (role === 'cashier') {
            infoWidgets.push(
                { id: 'pos', zone: ZONES.INFO, title: 'Cashier workspace (POS)', type: 'info', size: 'medium', badge: { text: 'Shift · cashier', variant: 'default' }, tint: 'blue', onClick: () => data.setActivePage?.('pos'), text: "Open the POS screen, scan barcodes and issue receipts without extra forms." },
                { id: 'products', zone: ZONES.INFO, title: 'Find product by name / barcode', type: 'info', size: 'medium', badge: { text: `${data.stats?.productsCount || 0} products`, variant: 'default' }, tint: 'green', onClick: () => data.setActivePage?.('products'), text: "Quickly find an item, check price and stock before selling." },
                WIDGET_IDS.SYSTEM_NOTIFICATIONS
            );
        } else {
            infoWidgets.push(
                { id: 'products', zone: ZONES.INFO, title: 'Products & stock', type: 'info', size: 'medium', badge: { text: `${data.stats?.productsCount || 0} products`, variant: 'default' }, tint: 'green', onClick: () => data.setActivePage?.('products'), text: "Browse catalog and basic warehouse stock." },
                { id: 'pos', zone: ZONES.INFO, title: 'POS screen', type: 'info', size: 'medium', badge: { text: 'Sale', variant: 'default' }, tint: 'blue', onClick: () => data.setActivePage?.('pos'), text: "Quick checkout by barcode or item name." }
            );
        }
        
        return infoWidgets.map(w => typeof w === 'string' ? getWidgetConfig(w, data) : w).filter(Boolean);
    }
    
    if (zone === ZONES.ABOUT) {
        return [getWidgetConfig(WIDGET_IDS.ABOUT_SYSTEM, data)].filter(Boolean);
    }
    
    return [];
}

