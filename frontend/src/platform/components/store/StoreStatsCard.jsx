import React from "react";
import styled from "styled-components";
import Card from "../../ui/Card.jsx";

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 12px;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const Stat = styled.div`
    padding: 10px;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(31, 41, 55, 0.5);
`;

const StatLabel = styled.div`
    font-size: 11px;
    color: #9ca3af;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const StatValue = styled.div`
    font-size: 20px;
    font-weight: 700;
    color: #e5e7eb;
`;

const StatValueError = styled(StatValue)`
    color: #fca5a5;
`;

/**
 * Format timestamp
 */
function formatTimestamp(timestamp) {
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
 * StoreStatsCard Component
 * 
 * Displays store statistics and activity metrics.
 * READ-ONLY observability view.
 */
export default function StoreStatsCard({ stats }) {
    if (!stats) return null;

    return (
        <Card
            title="Store Statistics"
            description="Activity metrics and usage statistics (last 24 hours)"
        >
            <Grid>
                <Stat>
                    <StatLabel>Last Activity</StatLabel>
                    <StatValue style={{ fontSize: 14 }}>
                        {formatTimestamp(stats.lastActivity)}
                    </StatValue>
                </Stat>
                <Stat>
                    <StatLabel>Users</StatLabel>
                    <StatValue>{stats.userCount || 0}</StatValue>
                </Stat>
                <Stat>
                    <StatLabel>Requests (24h)</StatLabel>
                    <StatValue>{stats.requests24h || 0}</StatValue>
                </Stat>
                <Stat>
                    <StatLabel>Errors (24h)</StatLabel>
                    {stats.errorCount24h > 0 ? (
                        <StatValueError>{stats.errorCount24h}</StatValueError>
                    ) : (
                        <StatValue>{stats.errorCount24h || 0}</StatValue>
                    )}
                </Stat>
            </Grid>
        </Card>
    );
}

