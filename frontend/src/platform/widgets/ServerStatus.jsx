import React from "react";
import styled from "styled-components";
import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #cbd5f5;
    margin-bottom: 4px;
`;

const Env = styled.span`
    font-weight: 500;
`;

const Meta = styled.span`
    color: #9ca3af;
`;

/**
 * Map status to UI tone
 * Supports: OK, WARN, DOWN (normalized) and legacy: ok, warning, down
 */
function mapStatusToTone(status) {
    const normalized = String(status).toUpperCase();
    if (normalized === "OK") return "green";
    if (normalized === "WARN" || normalized === "WARNING") return "yellow";
    return "red"; // DOWN or any other status
}

export default function ServerStatus({ servers = [] }) {
    return (
        <Card title="Server status" description="Runtime environments & edge nodes">
            {servers.length === 0 ? (
                <div style={{ fontSize: 12, color: "#9ca3af", padding: "8px 0" }}>
                    No server data available
                </div>
            ) : (
                servers.map((srv) => (
                    <Row key={srv.id}>
                        <Env>{srv.env}</Env>
                        <Meta>{srv.region}</Meta>
                        <Badge tone={mapStatusToTone(srv.status)} size="small">
                            {srv.statusLabel}
                        </Badge>
                    </Row>
                ))
            )}
        </Card>
    );
}


