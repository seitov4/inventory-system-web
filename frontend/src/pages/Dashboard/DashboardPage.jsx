import React, { useEffect, useMemo, useState, useCallback } from "react";
import styled from "styled-components";
import { ResponsiveGridLayout } from "react-grid-layout";
import Layout from "../../components/Layout/Layout";
import DashboardCard from "../../components/UI/DashboardCard";
import salesApi from "../../api/salesApi";
import productsApi from "../../api/productsApi";
import { useAuth } from "../../context/AuthContext";
import { usePage } from "../../context/PageContext";
import { getWidgetsByZone, getWidgetConfig } from "./dashboardWidgets";
import { getDefaultLayout, loadLayout, saveLayout, enforceZoneBoundaries, getWidgetZoneById, ZONE_BOUNDARIES } from "./dashboardLayouts";
import { ZONES } from "./dashboardWidgets";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// ===== STYLED COMPONENTS =====
const LoadingText = styled.div`
    padding: 16px;
    color: var(--text-tertiary);
    font-size: 14px;
`;

const GridContainer = styled.div`
    position: relative;
    
    .react-grid-layout {
        position: relative;
        transition: height 200ms ease;
    }
    
    .react-grid-item {
        transition: all 200ms ease;
        transition-property: left, top, width, height;
    }
    
    .react-grid-item.cssTransforms {
        transition-property: transform, width, height;
    }
    
    .react-grid-item.resizing {
        transition: none;
        z-index: 1;
        will-change: width, height;
    }
    
    .react-grid-item.react-draggable-dragging {
        transition: none;
        z-index: 3;
        will-change: transform;
        transform: scale(1.02);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
    
    .react-grid-item.dropping {
        visibility: hidden;
    }
    
    .react-grid-item > .react-resizable-handle {
        position: absolute;
        width: 20px;
        height: 20px;
        bottom: 0;
        right: 0;
        background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Im0wIDZoNnYtNnoiIGZpbGw9IiM5Y2EzYWYiLz48L3N2Zz4=');
        background-position: bottom right;
        padding: 0 3px 3px 0;
        background-repeat: no-repeat;
        background-origin: content-box;
        box-sizing: border-box;
        cursor: se-resize;
        opacity: 0;
        transition: opacity 0.2s;
    }
    
    .react-grid-item:hover > .react-resizable-handle {
        opacity: 0.5;
    }
    
    .react-grid-item.react-resizable-resizing > .react-resizable-handle {
        opacity: 1;
    }
    
    .react-grid-placeholder {
        background: rgba(88, 166, 255, 0.15);
        border: 2px dashed rgba(88, 166, 255, 0.4);
        border-radius: 12px;
        opacity: 0.6;
        transition: all 200ms ease;
        z-index: 2;
        user-select: none;
    }
    
    .react-grid-item-drag-handle {
        cursor: grab;
        
        &:active {
            cursor: grabbing;
        }
    }
    
    .react-grid-item.static {
        .react-grid-item-drag-handle {
            cursor: not-allowed;
            opacity: 0.6;
        }
    }
`;

// Zone overlay for visual feedback during drag
const ZoneOverlay = styled.div`
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 1;
    background: ${props => props.$active 
        ? 'rgba(80, 140, 255, 0.08)' 
        : 'transparent'};
    border: ${props => props.$active 
        ? '1px dashed rgba(80, 140, 255, 0.25)' 
        : '1px dashed transparent'};
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: ${props => props.$active ? 1 : 0};
    transform: ${props => props.$active ? 'scale(1)' : 'scale(0.98)'};
`;

const ResetButton = styled.button`
    position: absolute;
    top: 0;
    right: 0;
    padding: 8px 16px;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
    
    &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
        border-color: var(--primary-color);
    }
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
    const [layout, setLayout] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [activeWidgetId, setActiveWidgetId] = useState(null);
    const [activeZone, setActiveZone] = useState(null);

    // Load data
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

    // Initialize layout from localStorage when component mounts
    useEffect(() => {
        if (loading) return;
        
        // Only load from localStorage on initial mount
        if (layout.length === 0) {
            const defaultLayout = getDefaultLayout({ role, canSeeAnalytics });
            const savedLayout = loadLayout(role, defaultLayout);
            setLayout(savedLayout);
        }
    }, [role, canSeeAnalytics, loading]);

    const miniChartHeights = useMemo(() => {
        if (!chartData.data.length) return [];
        const max = Math.max(...chartData.data, 1);
        return chartData.data.slice(-7).map((v) => Math.max(5, (v / max) * 100));
    }, [chartData]);

    // Get all widgets with proper IDs
    const allWidgets = useMemo(() => {
        const data = {
            role,
            stats,
            canSeeAnalytics,
            miniChartHeights,
            setActivePage,
        };
        
        const widgets = [];
        
        // Zone 1: KPI
        const kpiWidgets = getWidgetsByZone('kpi', data);
        widgets.push(...kpiWidgets);
        
        // Zone 2: Wide
        if (canSeeAnalytics && miniChartHeights.length > 0) {
            const wideWidgets = getWidgetsByZone('wide', data);
            widgets.push(...wideWidgets);
        }
        
        // Zone 3: Info
        const infoWidgets = getWidgetsByZone('info', data);
        widgets.push(...infoWidgets);
        
        // Zone 4: About
        const aboutWidgets = getWidgetsByZone('about', data);
        widgets.push(...aboutWidgets);
        
        // Ensure all widgets have proper IDs
        return widgets.map((widget, idx) => ({
            ...widget,
            id: widget.id || `widget-${idx}-${widget.title?.toLowerCase().replace(/\s+/g, '-')}`,
        }));
    }, [role, stats, canSeeAnalytics, miniChartHeights, setActivePage]);
    
    // Sync layout with widgets after widgets are loaded
    useEffect(() => {
        if (loading || allWidgets.length === 0) return;
        
        const widgetIds = new Set(allWidgets.map(w => w.id));
        const defaultLayout = getDefaultLayout({ role, canSeeAnalytics });
        
        // Always ensure layout matches widgets exactly
        const newLayout = [];
        
        // For each widget, find or create its layout item
        allWidgets.forEach(widget => {
            // Try to find existing layout item
            const existingItem = layout.find(l => l.i === widget.id);
            
            if (existingItem) {
                // Keep existing position but ensure it has all required properties
                newLayout.push({
                    ...existingItem,
                    x: existingItem.x ?? 0,
                    y: existingItem.y ?? 0,
                    w: existingItem.w ?? 3,
                    h: existingItem.h ?? 2,
                });
            } else {
                // Use default layout item
                const defaultItem = defaultLayout.find(l => l.i === widget.id);
                if (defaultItem) {
                    newLayout.push(defaultItem);
                }
            }
        });
        
        // Sort by y, then x to maintain visual order
        newLayout.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });
        
        // Only update if layout actually changed
        const layoutChanged = 
            newLayout.length !== layout.length ||
            newLayout.some((item, idx) => {
                const oldItem = layout[idx];
                return !oldItem || 
                    oldItem.i !== item.i ||
                    oldItem.x !== item.x ||
                    oldItem.y !== item.y ||
                    oldItem.w !== item.w ||
                    oldItem.h !== item.h;
            });
        
        if (layoutChanged) {
            console.log('Updating layout:', newLayout);
            setLayout(newLayout);
            saveLayout(role, newLayout);
        }
    }, [loading, allWidgets, role, canSeeAnalytics]);

    // Handle layout change with zone enforcement
    const handleLayoutChange = useCallback((currentLayout, allLayouts) => {
        // Enforce zone boundaries
        const constrainedLayout = currentLayout.map(item => {
            const constrained = enforceZoneBoundaries(currentLayout, item.i, {
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
            });
            return {
                ...item,
                x: constrained.x,
                y: constrained.y,
            };
        });
        
        setLayout(constrainedLayout);
        saveLayout(role, constrainedLayout);
    }, [role]);

    // Handle drag start - track which widget is being dragged
    const handleDragStart = useCallback((layout, oldItem, newItem, placeholder, e, element) => {
        setIsDragging(true);
        setActiveWidgetId(oldItem.i);
        const widgetZone = getWidgetZoneById(oldItem.i);
        setActiveZone(widgetZone);
    }, []);

    // Handle drag stop - clear tracking
    const handleDragStop = useCallback(() => {
        setIsDragging(false);
        setActiveWidgetId(null);
        setActiveZone(null);
    }, []);

    // Reset layout
    const handleResetLayout = useCallback(() => {
        const defaultLayout = getDefaultLayout({ role, canSeeAnalytics });
        setLayout(defaultLayout);
        saveLayout(role, defaultLayout);
    }, [role, canSeeAnalytics]);

    // Render widget content
    const renderWidget = (widget) => {
        if (widget.type === 'chart' && widget.chartData) {
            return (
                <MiniChart>
                    {widget.chartData.map((h, i) => (
                        <MiniBar key={i} $height={h} />
                    ))}
                </MiniChart>
            );
        }
        
        if (widget.type === 'info' && widget.text) {
            return <WidgetText>{widget.text}</WidgetText>;
        }
        
        return widget.children || null;
    };

    // Responsive breakpoints
    const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
    const cols = { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 };

    return (
        <Layout title="Dashboard">
            {loading && <LoadingText>Loading...</LoadingText>}
            
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <ResetButton onClick={handleResetLayout} title="Reset to default layout">
                    Reset Layout
                </ResetButton>
            </div>

            {!loading && layout.length > 0 && allWidgets.length > 0 && (
                <GridContainer>
                    {/* Zone overlays for visual feedback */}
                    {isDragging && activeWidgetId && (() => {
                        const rowHeight = 80;
                        const margin = 16;
                        const widgetZone = getWidgetZoneById(activeWidgetId);
                        
                        return Object.entries(ZONE_BOUNDARIES).map(([zoneKey, boundaries]) => {
                            const zone = zoneKey;
                            const isActive = widgetZone === zone;
                            
                            // Calculate position based on grid row system
                            const top = boundaries.minY * (rowHeight + margin);
                            const height = (boundaries.maxY - boundaries.minY) * (rowHeight + margin) - margin;
                            
                            return (
                                <ZoneOverlay
                                    key={zone}
                                    $active={isActive}
                                    style={{
                                        top: `${top}px`,
                                        height: `${height}px`,
                                    }}
                                />
                            );
                        });
                    })()}
                    
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={{ lg: layout, md: layout, sm: layout, xs: layout, xxs: layout }}
                        breakpoints={breakpoints}
                        cols={cols}
                        rowHeight={80}
                        isDraggable={true}
                        isResizable={false}
                        onLayoutChange={handleLayoutChange}
                        onDragStart={handleDragStart}
                        onDragStop={handleDragStop}
                        draggableHandle=".react-grid-item-drag-handle"
                        margin={[16, 16]}
                        containerPadding={[0, 0]}
                        compactType={null}
                        preventCollision={true}
                        useCSSTransforms={true}
                    >
                        {allWidgets.map((widget) => {
                            const layoutItem = layout.find(l => l.i === widget.id);
                            
                            // Skip widgets without layout items (shouldn't happen, but safety check)
                            if (!layoutItem) {
                                console.warn(`Widget ${widget.id} missing layout item. Total widgets: ${allWidgets.length}, Total layout items: ${layout.length}`);
                                return null;
                            }
                            
                            const isStatic = layoutItem.static === true;
                            
                            return (
                                <div key={widget.id}>
                                    <DashboardCard
                                        title={widget.title}
                                        badge={widget.badge}
                                        type={widget.type}
                                        value={widget.value}
                                        description={widget.description}
                                        size={widget.size}
                                        tint={widget.tint}
                                        onClick={widget.onClick}
                                        animateCountUp={widget.animateCountUp}
                                        draggable={!isStatic}
                                        isStatic={isStatic}
                                    >
                                        {renderWidget(widget)}
                                    </DashboardCard>
                                </div>
                            );
                        })}
                    </ResponsiveGridLayout>
                </GridContainer>
            )}
        </Layout>
    );
}
