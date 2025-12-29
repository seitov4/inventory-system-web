import React from "react";
import styled from "styled-components";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";

const Timeline = styled.div`
    position: relative;
    padding-left: 14px;
    margin-top: 4px;

    &::before {
        content: "";
        position: absolute;
        left: 5px;
        top: 6px;
        bottom: 6px;
        width: 2px;
        background: rgba(55, 65, 81, 1);
    }
`;

const Item = styled.div`
    position: relative;
    margin-bottom: 10px;
`;

const Dot = styled.div`
    position: absolute;
    left: 0;
    top: 6px;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${(props) => {
        if (props.$severity === "error" || props.$severity === "critical") return "#ef4444";
        if (props.$severity === "warn" || props.$severity === "warning") return "#facc15";
        return "#0ea5e9";
    }};
`;

const ItemBody = styled.div`
    margin-left: 12px;
    font-size: 12px;
    color: #e5e7eb;
`;

const Message = styled.div`
    margin-bottom: 2px;
`;

const Meta = styled.div`
    font-size: 11px;
    color: #9ca3af;
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
`;

const EventType = styled.span`
    font-size: 10px;
    padding: 2px 6px;
    background: rgba(59, 130, 246, 0.2);
    border-radius: 4px;
    color: #93c5fd;
    text-transform: uppercase;
`;

/**
 * Map severity to badge tone
 */
function toneForSeverity(sev) {
    const normalized = String(sev).toLowerCase();
    if (normalized === "error" || normalized === "critical") return "red";
    if (normalized === "warn" || normalized === "warning") return "yellow";
    if (normalized === "info") return "blue";
    return "gray";
}

/**
 * Get event type from source/message
 */
function getEventType(event) {
    const source = String(event.source || "").toLowerCase();
    const message = String(event.message || "").toLowerCase();

    if (source.includes("api") || source.includes("backend") || message.includes("api")) {
        return "API";
    }
    if (source.includes("db") || source.includes("database") || message.includes("database")) {
        return "DB";
    }
    if (source.includes("worker") || source.includes("queue") || message.includes("worker")) {
        return "WORKER";
    }
    if (source.includes("system") || message.includes("system")) {
        return "SYSTEM";
    }
    return "EVENT";
}

export default function ActivityTimeline({ events }) {
    return (
        <Card title="Recent activity" description="Latest platform-level events">
            <Timeline>
                {events.slice(0, 6).map((event) => {
                    const severity = String(event.severity || "info").toLowerCase();
                    const eventType = getEventType(event);

                    return (
                        <Item key={event.id}>
                            <Dot $severity={severity} />
                            <ItemBody>
                                <Message>{event.message}</Message>
                                <Meta>
                                    <span>{event.timeAgo}</span>
                                    <span>·</span>
                                    <span>{event.source}</span>
                                    <EventType>{eventType}</EventType>
                                    <Badge tone={toneForSeverity(severity)} size="small">
                                        {severity.toUpperCase()}
                                    </Badge>
                                </Meta>
                            </ItemBody>
                        </Item>
                    );
                })}
                {events.length === 0 && (
                    <ItemBody>No activity · platform is waiting for traffic.</ItemBody>
                )}
            </Timeline>
        </Card>
    );
}
