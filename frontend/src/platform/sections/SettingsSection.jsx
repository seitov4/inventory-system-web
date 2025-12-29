import React, { useMemo } from "react";
import styled from "styled-components";
import Card from "../ui/Card.jsx";
import { usePlatformAuth } from "../context/PlatformAuthContext.jsx";
import { getAuditLogs } from "../utils/auditLogger.js";

const Grid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1.2fr);
    gap: 14px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

const Title = styled.div`
    font-size: 18px;
    font-weight: 600;
    color: #e5e7eb;
    margin-bottom: 6px;
`;

const Subtitle = styled.div`
    font-size: 13px;
    color: #9ca3af;
    margin-bottom: 14px;
`;

const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(55, 65, 81, 0.5);
    font-size: 13px;

    &:last-child {
        border-bottom: none;
    }
`;

const InfoLabel = styled.span`
    color: #9ca3af;
    font-weight: 500;
`;

const InfoValue = styled.span`
    color: #e5e7eb;
    font-family: monospace;
    font-size: 12px;
`;

const AuditList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 300px;
    overflow-y: auto;
`;

const AuditEntry = styled.div`
    padding: 8px 10px;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 6px;
    font-size: 12px;
    border-left: 3px solid
        ${(props) => {
            if (props.$type === "AUTH_LOGIN") return "#22c55e";
            if (props.$type === "AUTH_LOGOUT") return "#3b82f6";
            return "#ef4444"; // AUTH_FAILED
        }};
`;

const AuditTime = styled.div`
    color: #9ca3af;
    font-size: 11px;
    margin-top: 2px;
`;

function formatTimestamp(isoString) {
    try {
        const date = new Date(isoString);
        return date.toLocaleString();
    } catch {
        return isoString;
    }
}

function getEnvironment() {
    // Detect environment from various sources
    if (process.env.NODE_ENV === "development") return "development";
    if (process.env.REACT_APP_ENV === "staging") return "staging";
    if (process.env.REACT_APP_ENV === "production") return "production";
    return "local";
}

function getBackendUrl() {
    return process.env.REACT_APP_PLATFORM_API_URL || "/api/platform";
}

function getPlatformVersion() {
    // TODO: Replace with actual version from package.json or build info
    return process.env.REACT_APP_VERSION || "1.0.0";
}

function getBuildTimestamp() {
    // TODO: Replace with actual build timestamp from build process
    return process.env.REACT_APP_BUILD_TIME || new Date().toISOString();
}

export default function SettingsSection() {
    const { user, lastLogin, isAuthenticated } = usePlatformAuth();
    const auditLogs = useMemo(() => getAuditLogs().slice(0, 20), []); // Show last 20 entries

    return (
        <>
            <Title>Platform settings</Title>
            <Subtitle>
                Platform-level configuration and identity. These settings control the entire platform,
                not individual stores.
            </Subtitle>
            <Grid>
                {/* Platform Identity Card */}
                <Card title="Platform identity" description="System information and owner details">
                    <InfoRow>
                        <InfoLabel>Platform name</InfoLabel>
                        <InfoValue>Inventory Platform</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>Environment</InfoLabel>
                        <InfoValue>{getEnvironment()}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>Backend URL</InfoLabel>
                        <InfoValue>{getBackendUrl()}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>Platform version</InfoLabel>
                        <InfoValue>{getPlatformVersion()}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                        <InfoLabel>Build timestamp</InfoLabel>
                        <InfoValue>{formatTimestamp(getBuildTimestamp())}</InfoValue>
                    </InfoRow>
                </Card>

                {/* Owner Identity Card */}
                {isAuthenticated && (
                    <Card title="Owner identity" description="Current platform owner session">
                        <InfoRow>
                            <InfoLabel>Email</InfoLabel>
                            <InfoValue>{user?.email || "unknown"}</InfoValue>
                        </InfoRow>
                        <InfoRow>
                            <InfoLabel>Role</InfoLabel>
                            <InfoValue>{user?.role || "platform_owner"}</InfoValue>
                        </InfoRow>
                        <InfoRow>
                            <InfoLabel>Last login</InfoLabel>
                            <InfoValue>
                                {lastLogin ? formatTimestamp(lastLogin.toISOString()) : "Never"}
                            </InfoValue>
                        </InfoRow>
                    </Card>
                )}

                {/* Audit Log Card */}
                <Card
                    title="Access audit"
                    description="Recent platform access events (last 20 entries)"
                >
                    {auditLogs.length === 0 ? (
                        <div style={{ fontSize: 12, color: "#9ca3af", padding: "8px 0" }}>
                            No audit events recorded yet
                        </div>
                    ) : (
                        <AuditList>
                            {auditLogs.map((log, idx) => (
                                <AuditEntry key={idx} $type={log.type}>
                                    <div style={{ color: "#e5e7eb" }}>
                                        <strong>{log.type.replace("AUTH_", "")}</strong> — {log.email}
                                    </div>
                                    {log.metadata?.reason && (
                                        <div style={{ color: "#fca5a5", fontSize: 11, marginTop: 2 }}>
                                            {log.metadata.reason}
                                        </div>
                                    )}
                                    <AuditTime>{formatTimestamp(log.timestamp)}</AuditTime>
                                </AuditEntry>
                            ))}
                        </AuditList>
                    )}
                </Card>

                {/* Placeholder for future settings */}
                <Card title="Tenant limits" description="Per-tenant quotas and feature flags.">
                    <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.5 }}>
                        Here you will control how many stores, warehouses and users each tenant can
                        provision. It is also a good place for feature flags: POS versions, analytics
                        packs and premium modules.
                    </p>
                </Card>
            </Grid>
        </>
    );
}
