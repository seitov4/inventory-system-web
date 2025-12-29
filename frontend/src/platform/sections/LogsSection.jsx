import React, { useState } from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import usePlatformLogs from "../hooks/usePlatformLogs.jsx";
import LogFilters from "../components/LogFilters.jsx";
import LogEventCard from "../components/LogEventCard.jsx";
import LogEventTable from "../components/LogEventTable.jsx";
import EmptyLogsState from "../components/EmptyLogsState.jsx";

const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    gap: 10px;

    @media (max-width: 640px) {
        flex-direction: column;
        align-items: flex-start;
    }
`;

const TitleBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const Title = styled.div`
    font-size: 18px;
    font-weight: 600;
    color: #e5e7eb;
`;

const Subtitle = styled.div`
    font-size: 13px;
    color: #9ca3af;
`;

const Actions = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

const Stats = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
`;

const Stat = styled.div`
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(31, 41, 55, 0.9);
    font-size: 12px;
`;

const StatLabel = styled.div`
    color: #9ca3af;
    margin-bottom: 2px;
`;

const StatValue = styled.div`
    color: #e5e7eb;
    font-weight: 600;
    font-size: 14px;
`;

const ContentArea = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const CardsView = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const ErrorMessage = styled.div`
    padding: 12px 14px;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    font-size: 12px;
    margin-bottom: 14px;
`;

const LoadingMessage = styled.div`
    padding: 40px 20px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
`;

/**
 * LogsSection Component
 * 
 * Platform-level logs and events viewer.
 * Uses usePlatformLogs hook - no direct API calls.
 */
export default function LogsSection() {
    const {
        logs,
        allLogs,
        loading,
        error,
        filters,
        setFilters,
        clearFilters,
        refreshLogs,
        stats,
    } = usePlatformLogs();

    const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"

    const handleFilterChange = (key, value) => {
        setFilters(key, value);
    };

    return (
        <>
            <HeaderRow>
                <TitleBlock>
                    <Title>Platform Logs & Events</Title>
                    <Subtitle>
                        Operational timeline of platform-level events. Monitor system activity,
                        errors, and incidents.
                    </Subtitle>
                </TitleBlock>
                <Actions>
                    <Button
                        tone={viewMode === "table" ? "primary" : "ghost"}
                        size="small"
                        onClick={() => setViewMode("table")}
                    >
                        Table
                    </Button>
                    <Button
                        tone={viewMode === "cards" ? "primary" : "ghost"}
                        size="small"
                        onClick={() => setViewMode("cards")}
                    >
                        Timeline
                    </Button>
                    <Button tone="ghost" size="small" onClick={refreshLogs} disabled={loading}>
                        {loading ? "Refreshing..." : "Refresh"}
                    </Button>
                </Actions>
            </HeaderRow>

            {/* Stats */}
            {allLogs.length > 0 && (
                <Stats>
                    <Stat>
                        <StatLabel>Total Events</StatLabel>
                        <StatValue>{stats.total}</StatValue>
                    </Stat>
                    <Stat>
                        <StatLabel>Info</StatLabel>
                        <StatValue style={{ color: "#93c5fd" }}>{stats.info}</StatValue>
                    </Stat>
                    <Stat>
                        <StatLabel>Warnings</StatLabel>
                        <StatValue style={{ color: "#facc15" }}>{stats.warn}</StatValue>
                    </Stat>
                    <Stat>
                        <StatLabel>Errors</StatLabel>
                        <StatValue style={{ color: "#fca5a5" }}>{stats.error}</StatValue>
                    </Stat>
                </Stats>
            )}

            {/* Filters */}
            <LogFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
            />

            {/* Error state */}
            {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}

            {/* Loading state */}
            {loading && logs.length === 0 && (
                <LoadingMessage>Loading platform logs...</LoadingMessage>
            )}

            {/* Content */}
            {!loading || logs.length > 0 ? (
                <ContentArea>
                    {logs.length === 0 ? (
                        <EmptyLogsState filters={filters} />
                    ) : viewMode === "cards" ? (
                        <CardsView>
                            {logs.map((log) => (
                                <LogEventCard key={log.id} event={log} />
                            ))}
                        </CardsView>
                    ) : (
                        <LogEventTable logs={logs} />
                    )}
                </ContentArea>
            ) : null}
        </>
    );
}
