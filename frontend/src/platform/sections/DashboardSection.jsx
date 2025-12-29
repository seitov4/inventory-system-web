import React, { useMemo } from "react";
import styled from "styled-components";
import StatCard from "../widgets/StatCard.jsx";
import HealthCard from "../widgets/HealthCard.jsx";
import ServerStatus from "../widgets/ServerStatus.jsx";
import ActivityTimeline from "../widgets/ActivityTimeline.jsx";
import MetricCard from "../widgets/MetricCard.jsx";
import MetricGroup from "../widgets/MetricGroup.jsx";
import useStores from "../hooks/useStores.jsx";
import usePlatformHealth from "../hooks/usePlatformHealth.jsx";
import useLogs from "../hooks/useLogs.jsx";
import usePlatformMetrics from "../hooks/usePlatformMetrics.jsx";

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 16px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 800px) {
        grid-template-columns: 1fr;
    }
`;

const Columns = styled.div`
    display: grid;
    grid-template-columns: 2fr 1.3fr;
    gap: 14px;

    @media (max-width: 1000px) {
        grid-template-columns: 1fr;
    }
`;

const RightStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const ErrorCard = styled.div`
    padding: 12px 14px;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    font-size: 13px;
    margin-bottom: 14px;
`;

const LoadingPlaceholder = styled.div`
    color: #9ca3af;
    font-size: 13px;
    padding: 20px;
    text-align: center;
`;

const MetricsWarning = styled.div`
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(234, 179, 8, 0.1);
    border: 1px solid rgba(234, 179, 8, 0.3);
    color: #facc15;
    font-size: 12px;
    margin-bottom: 14px;
`;

export default function DashboardSection({ onNavigate }) {
    const { stores, loading: storesLoading } = useStores();
    const { health, loading: healthLoading, error: healthError } = usePlatformHealth();
    const { activity, loading: logsLoading } = useLogs();
    const { metrics, growth, trends, changes, loading: metricsLoading, error: metricsError } = usePlatformMetrics();

    const loading = storesLoading || healthLoading || logsLoading;

    const totalStores = stores.length;
    const activeStores = stores.filter((s) => s.status === "active").length;

    // Prepare growth chart data
    const growthChartData = useMemo(() => {
        if (!growth || !growth.dailyGrowth || growth.dailyGrowth.length === 0) return null;
        return growth.dailyGrowth.map((day) => day.count || day.value || 0);
    }, [growth]);

    const latestEvents = useMemo(
        () =>
            activity.slice(0, 8).map((log) => ({
                id: log.id,
                message: log.message,
                severity: log.severity,
                source: log.source,
                timeAgo: log.timeAgo,
            })),
        [activity]
    );

    // Show loading state
    if (loading && !health.backend.statusLabel) {
        return (
            <LoadingPlaceholder>
                Loading platform overview...
            </LoadingPlaceholder>
        );
    }

    return (
        <>
            {healthError && (
                <ErrorCard>
                    ⚠️ Health monitoring: {healthError}
                </ErrorCard>
            )}
            <Grid>
                <StatCard
                    label="Total stores"
                    value={totalStores}
                    hint="All tenants provisioned on the platform"
                    onClick={() => onNavigate("stores")}
                />
                <StatCard
                    label="Active stores"
                    value={activeStores}
                    hint="Stores with active status"
                    onClick={() => onNavigate("stores")}
                />
                <StatCard
                    label="Backend status"
                    value={health.backend.statusLabel}
                    hint={health.backend.description}
                    onClick={() => onNavigate("monitoring")}
                />
                <StatCard
                    label="Database status"
                    value={health.db.statusLabel}
                    hint={health.db.description}
                    onClick={() => onNavigate("monitoring")}
                />
            </Grid>

            <Columns>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <HealthCard title="Backend health" item={health.backend} />
                    <HealthCard title="Database health" item={health.db} />
                </div>
                <RightStack>
                    <ServerStatus servers={health.servers} />
                    <ActivityTimeline events={latestEvents} />
                </RightStack>
            </Columns>

            {/* Platform Metrics Section */}
            {metricsError && (
                <MetricsWarning>
                    ⚠️ {metricsError}
                </MetricsWarning>
            )}

            <MetricGroup
                title="Platform Metrics"
                description="Platform-wide performance and growth indicators. Metrics update every 30 seconds."
            >
                <MetricCard
                    label="Total Stores"
                    value={metrics.totalStores}
                    subtitle="All tenants on the platform"
                    trend={trends.totalStores}
                    change={changes.totalStores}
                    comparison={changes.totalStores !== null ? `vs previous period` : null}
                    onClick={() => onNavigate("stores")}
                />
                <MetricCard
                    label="Active Stores Ratio"
                    value={`${metrics.activeRatio}%`}
                    subtitle={`${metrics.activeStores} of ${metrics.totalStores} stores active`}
                    trend={trends.activeRatio}
                    change={changes.activeRatio}
                    statusColor={
                        metrics.activeRatio >= 90
                            ? "#22c55e"
                            : metrics.activeRatio >= 70
                            ? "#facc15"
                            : "#ef4444"
                    }
                    comparison={changes.activeRatio !== null ? `vs previous period` : null}
                    onClick={() => onNavigate("stores")}
                />
                <MetricCard
                    label="Request Volume (24h)"
                    value={metrics.requestVolume24h}
                    subtitle="Total API requests across all stores"
                    trend={trends.requestVolume}
                    change={changes.requestVolume}
                    comparison={changes.requestVolume !== null ? `vs previous 24h` : null}
                />
                <MetricCard
                    label="Average Latency"
                    value={`${metrics.averageLatency} ms`}
                    subtitle="Platform-wide average response time"
                    trend={trends.averageLatency}
                    change={changes.averageLatency}
                    statusColor={
                        metrics.averageLatency < 200
                            ? "#22c55e"
                            : metrics.averageLatency < 400
                            ? "#facc15"
                            : "#ef4444"
                    }
                    comparison={changes.averageLatency !== null ? `vs previous period` : null}
                />
                <MetricCard
                    label="Error Rate (24h)"
                    value={`${metrics.errorRate}%`}
                    subtitle="Percentage of failed requests"
                    trend={trends.errorRate}
                    change={changes.errorRate}
                    statusColor={
                        metrics.errorRate < 1
                            ? "#22c55e"
                            : metrics.errorRate < 5
                            ? "#facc15"
                            : "#ef4444"
                    }
                    comparison={changes.errorRate !== null ? `vs previous 24h` : null}
                />
                <MetricCard
                    label="Store Growth (7d)"
                    value={growthChartData ? growthChartData.reduce((a, b) => a + b, 0) : 0}
                    subtitle="New stores added in last 7 days"
                    chartData={growthChartData}
                    chartColor="#3b82f6"
                    comparison="Daily new store registrations"
                />
            </MetricGroup>
        </>
    );
}


