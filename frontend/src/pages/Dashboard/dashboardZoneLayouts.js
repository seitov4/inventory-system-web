/**
 * Zone-based layout utilities
 * Manages layout as zone-based structure: { kpi: [...], wide: [...], info: [...], about: [...] }
 */

import { WIDGET_IDS, ZONES } from './dashboardWidgets';

const LAYOUT_STORAGE_KEY_PREFIX = 'dashboard_zone_layout_';

/**
 * Get default zone-based layout
 * @param {object} data - Dynamic data (role, canSeeAnalytics, etc.)
 * @returns {object} Zone-based layout object
 */
export function getDefaultZoneLayout(data = {}) {
    const { role, canSeeAnalytics = false } = data;
    
    const layout = {
        [ZONES.KPI]: [
            WIDGET_IDS.SALES_TODAY,
            WIDGET_IDS.SALES_MONTH,
            WIDGET_IDS.LOW_STOCK,
            WIDGET_IDS.TOTAL_PRODUCTS,
        ],
        [ZONES.WIDE]: canSeeAnalytics ? [WIDGET_IDS.MINI_CHART] : [],
        [ZONES.INFO]: [],
        [ZONES.ABOUT]: [WIDGET_IDS.ABOUT_SYSTEM],
    };
    
    // Add info widgets based on role
    if (role === 'owner' || role === 'admin') {
        layout[ZONES.INFO] = [
            WIDGET_IDS.SALES_TRENDS,
            WIDGET_IDS.SHORTAGE_STOCK,
            WIDGET_IDS.SYSTEM_NOTIFICATIONS,
        ];
    } else if (role === 'manager') {
        layout[ZONES.INFO] = [
            WIDGET_IDS.SHORTAGE_STOCK,
            'movements',
            'products',
        ];
    } else if (role === 'cashier') {
        layout[ZONES.INFO] = [
            'pos',
            'products',
            WIDGET_IDS.SYSTEM_NOTIFICATIONS,
        ];
    } else {
        layout[ZONES.INFO] = [
            'products',
            'pos',
        ];
    }
    
    return layout;
}

/**
 * Load zone layout from localStorage
 * @param {string} role - User role
 * @param {object} defaultLayout - Default layout fallback
 * @returns {object} Zone-based layout object
 */
export function loadZoneLayout(role, defaultLayout) {
    try {
        const key = `${LAYOUT_STORAGE_KEY_PREFIX}${role}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Validate structure
            if (parsed && typeof parsed === 'object') {
                return {
                    [ZONES.KPI]: Array.isArray(parsed[ZONES.KPI]) ? parsed[ZONES.KPI] : defaultLayout[ZONES.KPI],
                    [ZONES.WIDE]: Array.isArray(parsed[ZONES.WIDE]) ? parsed[ZONES.WIDE] : defaultLayout[ZONES.WIDE],
                    [ZONES.INFO]: Array.isArray(parsed[ZONES.INFO]) ? parsed[ZONES.INFO] : defaultLayout[ZONES.INFO],
                    [ZONES.ABOUT]: Array.isArray(parsed[ZONES.ABOUT]) ? parsed[ZONES.ABOUT] : defaultLayout[ZONES.ABOUT],
                };
            }
        }
    } catch (e) {
        console.warn('Failed to load zone layout from localStorage:', e);
    }
    return defaultLayout;
}

/**
 * Save zone layout to localStorage
 * @param {string} role - User role
 * @param {object} layout - Zone-based layout object
 */
export function saveZoneLayout(role, layout) {
    try {
        const key = `${LAYOUT_STORAGE_KEY_PREFIX}${role}`;
        localStorage.setItem(key, JSON.stringify(layout));
    } catch (e) {
        console.warn('Failed to save zone layout to localStorage:', e);
    }
}

/**
 * Move widget from one zone to another
 * @param {object} layout - Current zone layout
 * @param {string} widgetId - Widget ID to move
 * @param {string} sourceZone - Source zone
 * @param {string} targetZone - Target zone
 * @param {number} targetIndex - Target index (optional)
 * @returns {object} New layout object
 */
export function moveWidgetBetweenZones(layout, widgetId, sourceZone, targetZone, targetIndex = null) {
    const newLayout = {
        [ZONES.KPI]: [...layout[ZONES.KPI]],
        [ZONES.WIDE]: [...layout[ZONES.WIDE]],
        [ZONES.INFO]: [...layout[ZONES.INFO]],
        [ZONES.ABOUT]: [...layout[ZONES.ABOUT]],
    };
    
    // Remove from source zone
    const sourceIndex = newLayout[sourceZone].indexOf(widgetId);
    if (sourceIndex !== -1) {
        newLayout[sourceZone].splice(sourceIndex, 1);
    }
    
    // Add to target zone
    if (targetIndex !== null && targetIndex >= 0 && targetIndex <= newLayout[targetZone].length) {
        newLayout[targetZone].splice(targetIndex, 0, widgetId);
    } else {
        newLayout[targetZone].push(widgetId);
    }
    
    return newLayout;
}

/**
 * Reorder widget within same zone
 * @param {object} layout - Current zone layout
 * @param {string} zone - Zone name
 * @param {number} oldIndex - Old index
 * @param {number} newIndex - New index
 * @returns {object} New layout object
 */
export function reorderWidgetInZone(layout, zone, oldIndex, newIndex) {
    const newLayout = {
        [ZONES.KPI]: [...layout[ZONES.KPI]],
        [ZONES.WIDE]: [...layout[ZONES.WIDE]],
        [ZONES.INFO]: [...layout[ZONES.INFO]],
        [ZONES.ABOUT]: [...layout[ZONES.ABOUT]],
    };
    
    const zoneArray = [...newLayout[zone]];
    const [removed] = zoneArray.splice(oldIndex, 1);
    zoneArray.splice(newIndex, 0, removed);
    newLayout[zone] = zoneArray;
    
    return newLayout;
}

