/**
 * DashboardPage - Zone-based architecture with drag & drop
 * Uses separate zone components and zone-based layout state
 */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import styled from "styled-components";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import Layout from "../../components/Layout/Layout";
import DashboardCard from "../../components/UI/DashboardCard";
import salesApi from "../../api/salesApi";
import productsApi from "../../api/productsApi";
import { useAuth } from "../../context/AuthContext";
import { usePage } from "../../context/PageContext";
import { getWidgetConfig, WIDGET_IDS } from "./dashboardWidgets";
import { ZONES } from "./dashboardWidgets";
import {
    getDefaultZoneLayout,
    loadZoneLayout,
    saveZoneLayout,
    moveWidgetBetweenZones,
    reorderWidgetInZone,
} from "./dashboardZoneLayouts";
import DashboardZone from "./DashboardZone";

// ===== STYLED COMPONENTS =====
const LoadingText = styled.div`
    padding: 16px;
    color: var(--text-tertiary);
    font-size: 14px;
`;

const DashboardContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const HeaderActions = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    gap: 8px;
    align-items: center;
`;

const ActionButton = styled.button`
    padding: 8px 16px;
    background: ${props => props.$active 
        ? 'var(--primary-color)' 
        : 'var(--bg-card)'};
    border: 1px solid ${props => props.$active 
        ? 'var(--primary-color)' 
        : 'var(--border-color-subtle)'};
    border-radius: 8px;
    color: ${props => props.$active 
        ? 'var(--text-inverse)' 
        : 'var(--text-secondary)'};
    font-size: 12px;
    font-weight: ${props => props.$active ? '600' : '400'};
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        background: ${props => props.$active 
            ? 'var(--primary-hover)' 
            : 'var(--bg-hover)'};
        color: ${props => props.$active 
            ? 'var(--text-inverse)' 
            : 'var(--text-primary)'};
        border-color: ${props => props.$active 
            ? 'var(--primary-hover)' 
            : 'var(--primary-color)'};
    }
`;

const DebugPanel = styled.div`
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: var(--bg-card);
    border: 1px solid var(--border-color-subtle);
    border-radius: 8px;
    padding: 12px;
    font-size: 11px;
    font-family: monospace;
    color: var(--text-secondary);
    max-width: 300px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: var(--shadow-lg);
    
    h4 {
        margin: 0 0 8px 0;
        color: var(--text-primary);
        font-size: 12px;
    }
    
    pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
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
    const [editMode, setEditMode] = useState(false);
    const [showDebug, setShowDebug] = useState(false); // Only show in edit mode

    const [stats, setStats] = useState({
        dailySales: 0,
        monthlySales: 0,
        lowStockCount: 0,
        productsCount: 0,
    });
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState({ labels: [], data: [] });
    
    // Zone-based layout state
    const [zoneLayout, setZoneLayout] = useState({
        [ZONES.KPI]: [],
        [ZONES.WIDE]: [],
        [ZONES.INFO]: [],
        [ZONES.ABOUT]: [],
    });
    
    const [activeId, setActiveId] = useState(null);
    const [overZone, setOverZone] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    const miniChartHeights = useMemo(() => {
        if (!chartData.data.length) return [];
        const max = Math.max(...chartData.data, 1);
        return chartData.data.slice(-7).map((v) => Math.max(5, (v / max) * 100));
    }, [chartData]);

    // Initialize zone layout
    useEffect(() => {
        if (loading) return;
        
        const defaultLayout = getDefaultZoneLayout({ role, canSeeAnalytics });
        const savedLayout = loadZoneLayout(role, defaultLayout);
        setZoneLayout(savedLayout);
    }, [role, canSeeAnalytics, loading]);

    // Get widget configs for all widgets in layout
    const allWidgetConfigs = useMemo(() => {
        const data = {
            role,
            stats,
            canSeeAnalytics,
            miniChartHeights,
            setActivePage,
        };
        
        const widgetMap = new Map();
        
        // Get all widget IDs from all zones
        Object.values(zoneLayout).flat().forEach(widgetId => {
            if (!widgetMap.has(widgetId)) {
                const config = getWidgetConfig(widgetId, data);
                if (config) {
                    widgetMap.set(widgetId, config);
                }
            }
        });
        
        return widgetMap;
    }, [zoneLayout, role, stats, canSeeAnalytics, miniChartHeights, setActivePage]);

    // Get widgets for a specific zone
    const getZoneWidgets = useCallback((zone) => {
        return zoneLayout[zone]
            .map(widgetId => allWidgetConfigs.get(widgetId))
            .filter(Boolean);
    }, [zoneLayout, allWidgetConfigs]);

    // Handle drag start
    const handleDragStart = useCallback((event) => {
        if (!editMode) return;
        setActiveId(event.active.id);
    }, [editMode]);

    // Handle drag over
    const handleDragOver = useCallback((event) => {
        if (!editMode) return;
        const { over } = event;
        if (over && typeof over.id === 'string' && Object.values(ZONES).includes(over.id)) {
            setOverZone(over.id);
        } else {
            setOverZone(null);
        }
    }, [editMode]);

    // Handle drag end
    const handleDragEnd = useCallback((event) => {
        if (!editMode) {
            setActiveId(null);
            setOverZone(null);
            return;
        }
        
        const { active, over } = event;
        
        setActiveId(null);
        setOverZone(null);
        
        if (!over) return;
        
        const widgetId = active.id;
        const widgetConfig = allWidgetConfigs.get(widgetId);
        
        if (!widgetConfig) return;
        
        // Find source zone
        let sourceZone = null;
        let sourceIndex = -1;
        for (const [zone, widgets] of Object.entries(zoneLayout)) {
            const index = widgets.indexOf(widgetId);
            if (index !== -1) {
                sourceZone = zone;
                sourceIndex = index;
                break;
            }
        }
        
        if (sourceZone === null) return;
        
        // Check if dropping on a zone (droppable zone)
        if (typeof over.id === 'string' && Object.values(ZONES).includes(over.id)) {
            const targetZone = over.id;
            
            // Check if widget is allowed in target zone
            const allowedZones = widgetConfig.allowedZones || [widgetConfig.zone];
            if (!allowedZones.includes(targetZone)) {
                console.warn(`Widget ${widgetId} not allowed in zone ${targetZone}. Allowed zones:`, allowedZones);
                // Trigger re-render to show snap-back animation
                setTimeout(() => {
                    setZoneLayout({ ...zoneLayout });
                }, 100);
                return; // Cancel drop - widget snaps back
            }
            
            // Move between zones
            if (sourceZone !== targetZone) {
                const newLayout = moveWidgetBetweenZones(zoneLayout, widgetId, sourceZone, targetZone);
                setZoneLayout(newLayout);
                saveZoneLayout(role, newLayout);
            }
            // If same zone, no change needed
        } else {
            // Dropping on another widget - reorder within zone
            const targetWidgetId = over.id;
            let targetZone = null;
            let targetIndex = -1;
            
            for (const [zone, widgets] of Object.entries(zoneLayout)) {
                const index = widgets.indexOf(targetWidgetId);
                if (index !== -1) {
                    targetZone = zone;
                    targetIndex = index;
                    break;
                }
            }
            
            if (targetZone && targetZone === sourceZone && targetIndex !== sourceIndex) {
                // Reorder within same zone
                const newLayout = reorderWidgetInZone(zoneLayout, sourceZone, sourceIndex, targetIndex);
                setZoneLayout(newLayout);
                saveZoneLayout(role, newLayout);
            } else if (targetZone && targetZone !== sourceZone) {
                // Moving to different zone via widget
                const allowedZones = widgetConfig.allowedZones || [widgetConfig.zone];
                if (allowedZones.includes(targetZone)) {
                    const newLayout = moveWidgetBetweenZones(zoneLayout, widgetId, sourceZone, targetZone, targetIndex);
                    setZoneLayout(newLayout);
                    saveZoneLayout(role, newLayout);
                }
            }
        }
    }, [zoneLayout, allWidgetConfigs, role]);

    // Handle drag cancel
    const handleDragCancel = useCallback(() => {
        setActiveId(null);
        setOverZone(null);
    }, []);

    // Reset layout
    const handleResetLayout = useCallback(() => {
        const defaultLayout = getDefaultZoneLayout({ role, canSeeAnalytics });
        setZoneLayout(defaultLayout);
        saveZoneLayout(role, defaultLayout);
    }, [role, canSeeAnalytics]);

    // Render widget content
    const renderWidget = useCallback((widget) => {
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
    }, []);

    // Get active widget for drag overlay
    const activeWidget = activeId ? allWidgetConfigs.get(activeId) : null;

    return (
        <Layout title="Dashboard">
            {loading && <LoadingText>Loading...</LoadingText>}
            
            <div style={{ position: 'relative', marginBottom: '20px' }}>
                <HeaderActions>
                    <ActionButton
                        $active={editMode}
                        onClick={() => {
                            setEditMode(!editMode);
                            setShowDebug(!editMode && process.env.NODE_ENV === 'development');
                            setActiveId(null);
                            setOverZone(null);
                        }}
                        title={editMode ? "Exit edit mode" : "Enter edit mode"}
                    >
                        {editMode ? "✓ Done Editing" : "✎ Edit Layout"}
                    </ActionButton>
                    <ActionButton
                        onClick={handleResetLayout}
                        title="Reset to default layout"
                    >
                        Reset Layout
                    </ActionButton>
                    {editMode && showDebug && (
                        <ActionButton
                            onClick={() => setShowDebug(false)}
                            title="Hide debug panel"
                        >
                            Hide Debug
                        </ActionButton>
                    )}
                </HeaderActions>
            </div>

            {!loading && (
                <DndContext
                    sensors={editMode ? sensors : []}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <DashboardContainer>
                        <DashboardZone
                            zone={ZONES.KPI}
                            widgets={getZoneWidgets(ZONES.KPI)}
                            renderWidget={renderWidget}
                            editMode={editMode}
                            isDraggingOver={editMode && overZone === ZONES.KPI}
                            isValidDrop={editMode && activeWidget && activeWidget.allowedZones?.includes(ZONES.KPI)}
                            minHeight="120px"
                        />
                        
                        {canSeeAnalytics && (
                            <DashboardZone
                                zone={ZONES.WIDE}
                                widgets={getZoneWidgets(ZONES.WIDE)}
                                renderWidget={renderWidget}
                                editMode={editMode}
                                isDraggingOver={editMode && overZone === ZONES.WIDE}
                                isValidDrop={editMode && activeWidget && activeWidget.allowedZones?.includes(ZONES.WIDE)}
                                minHeight="200px"
                            />
                        )}
                        
                        <DashboardZone
                            zone={ZONES.INFO}
                            widgets={getZoneWidgets(ZONES.INFO)}
                            renderWidget={renderWidget}
                            editMode={editMode}
                            isDraggingOver={editMode && overZone === ZONES.INFO}
                            isValidDrop={editMode && activeWidget && activeWidget.allowedZones?.includes(ZONES.INFO)}
                            minHeight="160px"
                        />
                        
                        <DashboardZone
                            zone={ZONES.ABOUT}
                            widgets={getZoneWidgets(ZONES.ABOUT)}
                            renderWidget={renderWidget}
                            editMode={editMode}
                            isDraggingOver={false} // ABOUT zone never accepts drops
                            isValidDrop={false} // ABOUT zone is always locked
                            minHeight="120px"
                        />
                    </DashboardContainer>
                    
                    {editMode && (
                        <DragOverlay>
                            {activeWidget ? (
                                <div style={{ opacity: 0.8, transform: 'rotate(5deg)' }}>
                                    <DashboardCard
                                        title={activeWidget.title}
                                        badge={activeWidget.badge}
                                        type={activeWidget.type}
                                        value={activeWidget.value}
                                        description={activeWidget.description}
                                        size={activeWidget.size}
                                        tint={activeWidget.tint}
                                    >
                                        {renderWidget(activeWidget)}
                                    </DashboardCard>
                                </div>
                            ) : null}
                        </DragOverlay>
                    )}
                </DndContext>
            )}
            
            {editMode && showDebug && (
                <DebugPanel>
                    <h4>Current Layout State</h4>
                    <pre>{JSON.stringify(zoneLayout, null, 2)}</pre>
                    {activeWidget && (
                        <>
                            <h4>Dragging: {activeWidget.id}</h4>
                            <pre>Allowed Zones: {JSON.stringify(activeWidget.allowedZones)}</pre>
                        </>
                    )}
                </DebugPanel>
            )}
        </Layout>
    );
}

