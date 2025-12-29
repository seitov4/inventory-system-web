import React from "react";
import styled from "styled-components";
import Card from "../../ui/Card.jsx";
import Badge from "../../ui/Badge.jsx";
import ProgressBar from "../../ui/ProgressBar.jsx";

const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const Label = styled.div`
    font-size: 13px;
    color: #e5e7eb;
`;

const Value = styled.div`
    font-size: 12px;
    color: #9ca3af;
`;

const StatusRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
`;

/**
 * Map status to tone
 */
function getStatusTone(status) {
    const normalized = String(status).toUpperCase();
    if (normalized === "OK" || normalized === "HEALTHY") return "green";
    if (normalized === "WARN" || normalized === "WARNING") return "yellow";
    if (normalized === "DEGRADED") return "yellow";
    return "red";
}

/**
 * Format last sync time
 */
function formatLastSync(timestamp) {
    if (!timestamp) return "Never";
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} h ago`;
        return date.toLocaleString();
    } catch {
        return timestamp;
    }
}

/**
 * StoreHealthCard Component
 * 
 * Displays store-scoped health metrics.
 * READ-ONLY observability view.
 */
export default function StoreHealthCard({ health }) {
    if (!health) return null;

    return (
        <Card
            title="Store Health"
            description="Store-scoped backend, database, and sync status"
        >
            <Grid>
                {/* Backend/API Health */}
                <div>
                    <StatusRow>
                        <Label>Backend/API</Label>
                        <Badge tone={getStatusTone(health.backend?.status)} size="small">
                            {health.backend?.status || "UNKNOWN"}
                        </Badge>
                    </StatusRow>
                    <Row>
                        <Label>Latency</Label>
                        <Value>{health.backend?.latency || 0} ms</Value>
                    </Row>
                    <ProgressBar
                        value={Math.min(100, ((health.backend?.latency || 0) / 300) * 100)}
                        tone={getStatusTone(health.backend?.status)}
                    />
                </div>

                {/* Database Health */}
                <div>
                    <StatusRow>
                        <Label>Database</Label>
                        <Badge tone={getStatusTone(health.database?.status)} size="small">
                            {health.database?.status || "UNKNOWN"}
                        </Badge>
                    </StatusRow>
                    <Row>
                        <Label>Latency</Label>
                        <Value>{health.database?.latency || 0} ms</Value>
                    </Row>
                    <ProgressBar
                        value={Math.min(100, ((health.database?.latency || 0) / 250) * 100)}
                        tone={getStatusTone(health.database?.status)}
                    />
                </div>
            </Grid>

            {/* Last Sync */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(55, 65, 81, 0.5)" }}>
                <Row>
                    <Label>Last Sync</Label>
                    <Value>{formatLastSync(health.lastSync)}</Value>
                </Row>
            </div>
        </Card>
    );
}

