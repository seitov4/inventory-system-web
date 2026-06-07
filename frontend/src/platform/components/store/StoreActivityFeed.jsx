import React from "react";
import styled from "styled-components";
import Card from "../../ui/Card.jsx";
import SeverityBadge from "../SeverityBadge.jsx";
import { calculateTimeAgo } from "../../utils/logFormatters.js";

const Feed = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
    max-height: 400px;
    overflow-y: auto;
`;

const Event = styled.div`
    padding: 10px 12px;
    border-radius: 8px;
    background: ${(props) => {
        if (props.$severity === "error") return "#fef2f2";
        if (props.$severity === "warn") return "#fffbeb";
        return "#ffffff";
    }};
    border-left: 3px solid
        ${(props) => {
            if (props.$severity === "error") return "#ef4444";
            if (props.$severity === "warn") return "#facc15";
            return "#3b82f6";
        }};
    border: 1px solid #dbe3ef;
`;

const EventHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    gap: 8px;
`;

const EventMessage = styled.div`
    font-size: 13px;
    color: #0f172a;
    flex: 1;
`;

const EventMeta = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 11px;
    color: #64748b;
    flex-wrap: wrap;
`;

const EmptyState = styled.div`
    padding: 20px;
    text-align: center;
    font-size: 13px;
    color: #64748b;
`;

/**
 * StoreActivityFeed Component
 *
 * Displays recent store-specific activity events.
 * READ-ONLY observability view.
 */
export default function StoreActivityFeed({ activity }) {
    if (!activity || activity.length === 0) {
        return (
            <Card title="Recent Activity" description="Store-specific events and operations">
                <EmptyState>No recent activity for this store.</EmptyState>
            </Card>
        );
    }

    return (
        <Card title="Recent Activity" description="Store-specific events and operations (last 20)">
            <Feed>
                {activity.slice(0, 20).map((event) => {
                    const severity = String(event.severity || "info").toLowerCase();
                    return (
                        <Event key={event.id} $severity={severity}>
                            <EventHeader>
                                <EventMessage>{event.message}</EventMessage>
                                <SeverityBadge severity={severity} size="small" />
                            </EventHeader>
                            <EventMeta>
                                <span>{event.type}</span>
                                <span>-</span>
                                <span>{event.source}</span>
                                <span>-</span>
                                <span>{calculateTimeAgo(event.timestamp)}</span>
                            </EventMeta>
                        </Event>
                    );
                })}
            </Feed>
        </Card>
    );
}
