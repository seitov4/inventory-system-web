import React from "react";
import styled from "styled-components";
import SeverityBadge from "./SeverityBadge.jsx";
import { formatTimestamp, calculateTimeAgo, getSeverityIcon, getSourceIcon, formatSource, formatEnvironment } from "../utils/logFormatters.js";

const Card = styled.div`
    padding: 12px 14px;
    border-radius: 8px;
    border-left: 3px solid
        ${(props) => {
            if (props.$severity === "error") return "#ef4444";
            if (props.$severity === "warn") return "#facc15";
            return "#3b82f6";
        }};
    background: ${(props) => {
        if (props.$severity === "error") return "rgba(239, 68, 68, 0.08)";
        if (props.$severity === "warn") return "rgba(234, 179, 8, 0.08)";
        return "rgba(15, 23, 42, 0.98)";
    }};
    border: 1px solid rgba(31, 41, 55, 0.9);
    margin-bottom: 8px;
    transition: all 0.15s ease;

    &:hover {
        background: ${(props) => {
            if (props.$severity === "error") return "rgba(239, 68, 68, 0.12)";
            if (props.$severity === "warn") return "rgba(234, 179, 8, 0.12)";
            return "rgba(30, 64, 175, 0.18)";
        }};
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
`;

const Left = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex: 1;
`;

const Icon = styled.span`
    font-size: 16px;
    margin-top: 2px;
`;

const Message = styled.div`
    flex: 1;
    font-size: 13px;
    color: #e5e7eb;
    line-height: 1.4;
    font-weight: ${(props) => (props.$severity === "error" ? 500 : 400)};
`;

const Right = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
`;

const Meta = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 11px;
    color: #9ca3af;
    margin-top: 6px;
`;

const MetaItem = styled.span`
    display: flex;
    align-items: center;
    gap: 4px;
`;

const StoreBadge = styled.span`
    padding: 2px 6px;
    background: rgba(59, 130, 246, 0.2);
    border-radius: 4px;
    color: #93c5fd;
    font-size: 10px;
`;

/**
 * LogEventCard Component
 * 
 * Displays a single log event in card format.
 * Used in timeline-style views.
 */
export default function LogEventCard({ event }) {
    const severity = String(event.severity || "info").toLowerCase();

    return (
        <Card $severity={severity}>
            <Header>
                <Left>
                    <Icon>{getSeverityIcon(severity)}</Icon>
                    <Message $severity={severity}>{event.message}</Message>
                </Left>
                <Right>
                    <SeverityBadge severity={severity} />
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                        {calculateTimeAgo(event.timestamp)}
                    </div>
                </Right>
            </Header>
            <Meta>
                <MetaItem>
                    {getSourceIcon(event.source)}
                    {formatSource(event.source)}
                </MetaItem>
                {event.environment && (
                    <>
                        <span>·</span>
                        <MetaItem>{formatEnvironment(event.environment)}</MetaItem>
                    </>
                )}
                {event.store && (
                    <>
                        <span>·</span>
                        <StoreBadge>Store: {event.store}</StoreBadge>
                    </>
                )}
                <span>·</span>
                <MetaItem>{formatTimestamp(event.timestamp)}</MetaItem>
            </Meta>
        </Card>
    );
}

