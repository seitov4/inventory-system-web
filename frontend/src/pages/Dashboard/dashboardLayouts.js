import { WIDGET_IDS, ZONES } from './dashboardWidgets';

/**
 * Default layout configuration for dashboard zones
 * Uses 12-column grid system
 */

// Zone boundaries (y positions) - STRICT ZONES
// Updated to match strict zone requirements
export const ZONE_BOUNDARIES = {
    [ZONES.KPI]: { minY: 0, maxY: 1 },           // Row 0-1 (KPI locked to top)
    [ZONES.WIDE]: { minY: 2, maxY: 5 },          // Row 2-5 (Chart zone)
    [ZONES.INFO]: { minY: 6, maxY: 9 },          // Row 6-9 (Info cards zone)
    [ZONES.ABOUT]: { minY: 9, maxY: 12 },        // Row 9+ (About zone)
};

/**
 * Get widget zone by widget ID
 * @param {string} widgetId - Widget identifier
 * @returns {string} Zone identifier
 */
export function getWidgetZoneById(widgetId) {
    const kpiWidgets = [
        WIDGET_IDS.SALES_TODAY,
        WIDGET_IDS.SALES_MONTH,
        WIDGET_IDS.LOW_STOCK,
        WIDGET_IDS.TOTAL_PRODUCTS,
    ];
    
    if (kpiWidgets.includes(widgetId)) {
        return ZONES.KPI;
    }
    
    if (widgetId === WIDGET_IDS.MINI_CHART) {
        return ZONES.WIDE;
    }
    
    if (widgetId === WIDGET_IDS.ABOUT_SYSTEM) {
        return ZONES.ABOUT;
    }
    
    // Default to INFO zone for other widgets
    return ZONES.INFO;
}

/**
 * Get default layout for all widgets
 * Uses explicit coordinates to prevent overlapping
 * @param {object} data - Dynamic data (role, canSeeAnalytics, etc.)
 * @returns {array} Layout array for react-grid-layout
 */
export function getDefaultLayout(data = {}) {
    const { role, canSeeAnalytics = false } = data;
    const layout = [];
    
    // ============================================
    // ZONE 1 – KPI ROW (y: 0)
    // 4 cards in one row, each w=3, h=2
    // STATIC: Cannot be dragged (locked to top zone)
    // ============================================
    layout.push({
        i: WIDGET_IDS.SALES_TODAY,
        x: 0,
        y: 0,
        w: 3,
        h: 2,
        minW: 2,
        maxW: 4,
        minH: 1,
        maxH: 3,
        static: true, // LOCKED - Cannot be dragged
    });
    
    layout.push({
        i: WIDGET_IDS.SALES_MONTH,
        x: 3,
        y: 0,
        w: 3,
        h: 2,
        minW: 2,
        maxW: 4,
        minH: 1,
        maxH: 3,
        static: true, // LOCKED - Cannot be dragged
    });
    
    layout.push({
        i: WIDGET_IDS.LOW_STOCK,
        x: 6,
        y: 0,
        w: 3,
        h: 2,
        minW: 2,
        maxW: 4,
        minH: 1,
        maxH: 3,
        static: true, // LOCKED - Cannot be dragged
    });
    
    layout.push({
        i: WIDGET_IDS.TOTAL_PRODUCTS,
        x: 9,
        y: 0,
        w: 3,
        h: 2,
        minW: 2,
        maxW: 4,
        minH: 1,
        maxH: 3,
        static: true, // LOCKED - Cannot be dragged
    });
    
    // ============================================
    // ZONE 2 – CHART ROW (y: 2)
    // Full width chart, w=12, h=4
    // ============================================
    if (canSeeAnalytics) {
        layout.push({
            i: WIDGET_IDS.MINI_CHART,
            x: 0,
            y: 2,
            w: 12,
            h: 4,
            minW: 12,
            maxW: 12,
            minH: 3,
            maxH: 5,
            static: false,
        });
    }
    
    // ============================================
    // ZONE 3 – INFO CARDS (y: 6)
    // Three cards below chart, each w=4, h=3
    // ============================================
    const infoY = canSeeAnalytics ? 6 : 2; // If no chart, start at y=2
    
    if (role === 'owner' || role === 'admin') {
        layout.push({
            i: WIDGET_IDS.SALES_TRENDS,
            x: 0,
            y: infoY,
            w: 4,
            h: 3,
            minW: 3,
            maxW: 6,
            minH: 2,
            maxH: 4,
            static: false,
        });
        
        layout.push({
            i: WIDGET_IDS.SHORTAGE_STOCK,
            x: 4,
            y: infoY,
            w: 4,
            h: 3,
            minW: 3,
            maxW: 6,
            minH: 2,
            maxH: 4,
            static: false,
        });
        
        layout.push({
            i: WIDGET_IDS.SYSTEM_NOTIFICATIONS,
            x: 8,
            y: infoY,
            w: 4,
            h: 3,
            minW: 3,
            maxW: 6,
            minH: 2,
            maxH: 4,
            static: false,
        });
    } else if (role === 'manager') {
        layout.push({
            i: WIDGET_IDS.SHORTAGE_STOCK,
            x: 0,
            y: infoY,
            w: 4,
            h: 3,
            minW: 3,
            maxW: 6,
            minH: 2,
            maxH: 4,
            static: false,
        });
        
        layout.push({
            i: 'movements',
            x: 4,
            y: infoY,
            w: 4,
            h: 3,
            minW: 3,
            maxW: 6,
            minH: 2,
            maxH: 4,
            static: false,
        });
        
        layout.push({
            i: 'products',
            x: 8,
            y: infoY,
            w: 4,
            h: 3,
            minW: 3,
            maxW: 6,
            minH: 2,
            maxH: 4,
            static: false,
        });
    } else if (role === 'cashier') {
        layout.push({
            i: 'pos',
            x: 0,
            y: infoY,
            w: 4,
            h: 3,
            minW: 3,
            maxW: 6,
            minH: 2,
            maxH: 4,
            static: false,
        });
        
        layout.push({
            i: 'products',
            x: 4,
            y: infoY,
            w: 4,
            h: 3,
            minW: 3,
            maxW: 6,
            minH: 2,
            maxH: 4,
            static: false,
        });
        
        layout.push({
            i: WIDGET_IDS.SYSTEM_NOTIFICATIONS,
            x: 8,
            y: infoY,
            w: 4,
            h: 3,
            minW: 3,
            maxW: 6,
            minH: 2,
            maxH: 4,
            static: false,
        });
    } else {
        // Guest/Unknown role
        layout.push({
            i: 'products',
            x: 0,
            y: infoY,
            w: 6,
            h: 3,
            minW: 3,
            maxW: 8,
            minH: 2,
            maxH: 4,
            static: false,
        });
        
        layout.push({
            i: 'pos',
            x: 6,
            y: infoY,
            w: 6,
            h: 3,
            minW: 3,
            maxW: 8,
            minH: 2,
            maxH: 4,
            static: false,
        });
    }
    
    // ============================================
    // ZONE 4 – ABOUT SYSTEM
    // Full width, below info cards
    // ============================================
    const aboutY = infoY + 3; // Start after info cards (which have h=3)
    layout.push({
        i: WIDGET_IDS.ABOUT_SYSTEM,
        x: 0,
        y: aboutY,
        w: 12,
        h: 3,
        minW: 12,
        maxW: 12,
        minH: 2,
        maxH: 4,
        static: false,
    });
    
    return layout;
}

/**
 * Enforce zone boundaries - prevent widgets from moving outside their zone
 * @param {array} layout - Current layout
 * @param {string} widgetId - Widget being moved
 * @param {object} newPosition - New position {x, y, w, h}
 * @returns {object} Constrained position
 */
export function enforceZoneBoundaries(layout, widgetId, newPosition) {
    // Get widget's zone by ID
    const zone = getWidgetZoneById(widgetId);
    
    // KPI widgets are static and shouldn't be moved
    if (zone === ZONES.KPI) {
        const originalWidget = layout.find(item => item.i === widgetId);
        if (originalWidget) {
            return {
                ...newPosition,
                x: originalWidget.x,
                y: originalWidget.y,
            };
        }
    }
    
    const boundaries = ZONE_BOUNDARIES[zone];
    
    // Constrain Y position to zone (allow movement within zone)
    let constrainedY = newPosition.y;
    if (constrainedY < boundaries.minY) {
        constrainedY = boundaries.minY;
    } else if (constrainedY + newPosition.h > boundaries.maxY) {
        constrainedY = Math.max(boundaries.minY, boundaries.maxY - newPosition.h);
    }
    
    // Constrain X position (0-12)
    let constrainedX = newPosition.x;
    if (constrainedX < 0) constrainedX = 0;
    if (constrainedX + newPosition.w > 12) constrainedX = Math.max(0, 12 - newPosition.w);
    
    return {
        ...newPosition,
        x: constrainedX,
        y: constrainedY,
    };
}

/**
 * Get zone for a widget
 * @param {object} layoutItem - Layout item
 * @returns {string} Zone identifier
 */
export function getWidgetZone(layoutItem) {
    const y = layoutItem.y;
    if (y >= ZONE_BOUNDARIES[ZONES.ABOUT].minY) return ZONES.ABOUT;
    if (y >= ZONE_BOUNDARIES[ZONES.INFO].minY) return ZONES.INFO;
    if (y >= ZONE_BOUNDARIES[ZONES.WIDE].minY) return ZONES.WIDE;
    return ZONES.KPI;
}

/**
 * Load layout from localStorage
 * @param {string} role - User role
 * @param {object} defaultLayout - Default layout fallback
 * @returns {array} Layout array
 */
export function loadLayout(role, defaultLayout) {
    try {
        const key = `dashboard_layout_${role}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Validate layout structure
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('Failed to load dashboard layout:', e);
    }
    return defaultLayout;
}

/**
 * Save layout to localStorage
 * @param {string} role - User role
 * @param {array} layout - Layout array
 */
export function saveLayout(role, layout) {
    try {
        const key = `dashboard_layout_${role}`;
        localStorage.setItem(key, JSON.stringify(layout));
    } catch (e) {
        console.warn('Failed to save dashboard layout:', e);
    }
}

