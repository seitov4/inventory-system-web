import React, { useState } from "react";
import styled from "styled-components";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import ProgressBar from "../ui/ProgressBar.jsx";

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
`;

const Label = styled.div`
    font-size: 13px;
    color: #e5e7eb;
`;

const Meta = styled.div`
    font-size: 11px;
    color: #9ca3af;
`;

const ErrorSection = styled.div`
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(55, 65, 81, 0.5);
`;

const ErrorHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    cursor: pointer;
    user-select: none;
`;

const ErrorCounts = styled.div`
    display: flex;
    gap: 8px;
    font-size: 11px;
    color: #9ca3af;
`;

const ErrorCount = styled.span`
    color: ${(props) => (props.$hasErrors ? "#fca5a5" : "#9ca3af")};
`;

const LastError = styled.div`
    margin-top: 8px;
    padding: 8px;
    background: rgba(239, 68, 68, 0.1);
    border-left: 3px solid rgba(239, 68, 68, 0.5);
    border-radius: 4px;
    font-size: 11px;
`;

const ErrorMessage = styled.div`
    color: #fca5a5;
    margin-bottom: 4px;
`;

const ErrorMeta = styled.div`
    color: #9ca3af;
    font-size: 10px;
    display: flex;
    gap: 8px;
    margin-top: 4px;
`;

const ReasonText = styled.div`
    font-size: 12px;
    color: #9ca3af;
    margin-top: 8px;
    font-style: italic;
`;

/**
 * Map status to UI tone
 * Status is DERIVED from thresholds, not hardcoded
 */
function mapStatusToTone(status) {
    const normalized = String(status).toUpperCase();
    if (normalized === "OK") return "green";
    if (normalized === "WARN" || normalized === "WARNING") return "yellow";
    return "red"; // DOWN or any other status
}

/**
 * Map error severity to badge tone
 */
function mapSeverityToTone(severity) {
    const normalized = String(severity).toUpperCase();
    if (normalized === "CRITICAL" || normalized === "ERROR") return "red";
    if (normalized === "WARN" || normalized === "WARNING") return "yellow";
    if (normalized === "INFO") return "blue";
    return "gray";
}

export default function HealthCard({ title, item }) {
    const [showLastError, setShowLastError] = useState(false);
    const tone = mapStatusToTone(item.status);
    const latency = item.latencyMs ?? 0;
    const uptime = item.uptime ?? 0;
    const errors = item.errors || {};
    const hasErrors = errors.errorCountLast24h > 0 || errors.lastError;

    return (
        <Card
            title={title}
            description={item.reason || item.description}
            actions={<Badge tone={tone}>{item.statusLabel}</Badge>}
        >
            <Row>
                <Label>Latency</Label>
                <Meta>{latency} ms</Meta>
            </Row>
            <ProgressBar
                value={Math.min(100, (latency / (item.latencyBudgetMs || 500)) * 100)}
                tone={tone}
            />
            <Row style={{ marginTop: 10 }}>
                <Label>Uptime (rolling)</Label>
                <Meta>{uptime}%</Meta>
            </Row>
            <ProgressBar value={uptime} tone={tone} />

            {/* Error visibility section */}
            {hasErrors && (
                <ErrorSection>
                    <ErrorHeader onClick={() => setShowLastError(!showLastError)}>
                        <Label style={{ fontSize: 12 }}>Errors</Label>
                        <ErrorCounts>
                            {errors.errorCountLast1h > 0 && (
                                <ErrorCount $hasErrors={errors.errorCountLast1h > 0}>
                                    1h: {errors.errorCountLast1h}
                                </ErrorCount>
                            )}
                            {errors.errorCountLast24h > 0 && (
                                <ErrorCount $hasErrors={errors.errorCountLast24h > 0}>
                                    24h: {errors.errorCountLast24h}
                                </ErrorCount>
                            )}
                        </ErrorCounts>
                    </ErrorHeader>

                    {showLastError && errors.lastError && (
                        <LastError>
                            <ErrorMessage>{errors.lastError.message}</ErrorMessage>
                            <ErrorMeta>
                                <span>{errors.lastError.source}</span>
                                {errors.lastError.timestamp && (
                                    <>
                                        <span>·</span>
                                        <span>
                                            {new Date(errors.lastError.timestamp).toLocaleString()}
                                        </span>
                                    </>
                                )}
                                <Badge
                                    tone={mapSeverityToTone(errors.lastError.severity)}
                                    size="small"
                                >
                                    {errors.lastError.severity}
                                </Badge>
                            </ErrorMeta>
                        </LastError>
                    )}
                </ErrorSection>
            )}

            {/* Show reason text if status is not OK */}
            {item.status !== "OK" && item.reason && (
                <ReasonText>⚠️ {item.reason}</ReasonText>
            )}
        </Card>
    );
}
