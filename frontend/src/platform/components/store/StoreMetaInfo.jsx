import React from "react";
import styled from "styled-components";
import Card from "../../ui/Card.jsx";

const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-top: 12px;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

const InfoRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(55, 65, 81, 0.5);

    &:last-child {
        border-bottom: none;
    }
`;

const InfoLabel = styled.div`
    font-size: 12px;
    color: #9ca3af;
    font-weight: 500;
`;

const InfoValue = styled.div`
    font-size: 12px;
    color: #e5e7eb;
    font-family: monospace;
`;

/**
 * Format timestamp
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return "Unknown";
    try {
        return new Date(timestamp).toLocaleString();
    } catch {
        return timestamp;
    }
}

/**
 * StoreMetaInfo Component
 * 
 * Displays store metadata and system information.
 * READ-ONLY observability view.
 */
export default function StoreMetaInfo({ store }) {
    if (!store) return null;

    return (
        <Card
            title="Store Information"
            description="Metadata and system details (read-only)"
        >
            <InfoGrid>
                <InfoRow>
                    <InfoLabel>Store ID</InfoLabel>
                    <InfoValue>{store.id}</InfoValue>
                </InfoRow>
                <InfoRow>
                    <InfoLabel>Slug</InfoLabel>
                    <InfoValue>{store.slug}</InfoValue>
                </InfoRow>
                <InfoRow>
                    <InfoLabel>Owner Email</InfoLabel>
                    <InfoValue>{store.ownerEmail || "N/A"}</InfoValue>
                </InfoRow>
                <InfoRow>
                    <InfoLabel>Plan</InfoLabel>
                    <InfoValue>{store.plan || "N/A"}</InfoValue>
                </InfoRow>
                <InfoRow>
                    <InfoLabel>Region</InfoLabel>
                    <InfoValue>{store.region || "N/A"}</InfoValue>
                </InfoRow>
                <InfoRow>
                    <InfoLabel>Environment</InfoLabel>
                    <InfoValue>{store.environment || "N/A"}</InfoValue>
                </InfoRow>
                <InfoRow>
                    <InfoLabel>Created At</InfoLabel>
                    <InfoValue>{formatTimestamp(store.createdAt)}</InfoValue>
                </InfoRow>
                <InfoRow>
                    <InfoLabel>Last Active</InfoLabel>
                    <InfoValue>{formatTimestamp(store.lastActiveAt)}</InfoValue>
                </InfoRow>
            </InfoGrid>
        </Card>
    );
}

