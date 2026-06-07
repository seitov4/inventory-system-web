import React from "react";
import styled from "styled-components";

const Container = styled.div`
    padding: 60px 20px;
    text-align: center;
    border-radius: 8px;
    border: 1px solid #dbe3ef;
    background: #ffffff;
`;

const Icon = styled.div`
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
`;

const Title = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 8px;
`;

const Description = styled.div`
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
`;

/**
 * EmptyLogsState Component
 * 
 * Displays when no logs are available.
 * Provides helpful context about why logs might be empty.
 */
export default function EmptyLogsState({ filters = {} }) {
    const hasActiveFilters = Object.values(filters).some(
        (value) => value !== null && value !== undefined && value !== "all"
    );

    return (
        <Container>
            <Icon>Logs</Icon>
            <Title>No logs found</Title>
            <Description>
                {hasActiveFilters
                    ? "No events match your current filters. Try adjusting the filters or clearing them to see all logs."
                    : "Platform has no events in this time range. Logs will appear here as platform activity occurs."}
            </Description>
        </Container>
    );
}

