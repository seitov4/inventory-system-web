import React from "react";
import styled from "styled-components";
import Badge from "../../ui/Badge.jsx";
import StoreStatusBadge from "../StoreStatusBadge.jsx";

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(31, 41, 55, 0.9);
    margin-bottom: 14px;

    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const Left = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
`;

const Title = styled.div`
    font-size: 22px;
    font-weight: 700;
    color: #e5e7eb;
`;

const Meta = styled.div`
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 13px;
    color: #9ca3af;
`;

const Right = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
`;

/**
 * Map health status to badge tone
 */
function getHealthTone(status) {
    const normalized = String(status).toUpperCase();
    if (normalized === "OK" || normalized === "HEALTHY") return "green";
    if (normalized === "WARN" || normalized === "WARNING") return "yellow";
    if (normalized === "DEGRADED") return "yellow";
    return "red"; // DOWN or UNKNOWN
}

/**
 * StoreHeader Component
 * 
 * Displays store name, status, and health badge.
 * READ-ONLY view header.
 */
export default function StoreHeader({ store, health }) {
    if (!store) return null;

    return (
        <Header>
            <Left>
                <Title>{store.name}</Title>
                <Meta>
                    <span>Slug: {store.slug}</span>
                    {store.region && (
                        <>
                            <span>·</span>
                            <span>Region: {store.region}</span>
                        </>
                    )}
                    {store.environment && (
                        <>
                            <span>·</span>
                            <span>Env: {store.environment}</span>
                        </>
                    )}
                </Meta>
            </Left>
            <Right>
                <StoreStatusBadge status={store.status} />
                {health && health.statusLabel && (
                    <Badge tone={getHealthTone(health.status)} size="medium">
                        {health.statusLabel}
                    </Badge>
                )}
            </Right>
        </Header>
    );
}

