import React from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";
import useStoreOverview from "../hooks/useStoreOverview.jsx";
import StoreHeader from "../components/store/StoreHeader.jsx";
import StoreHealthCard from "../components/store/StoreHealthCard.jsx";
import StoreStatsCard from "../components/store/StoreStatsCard.jsx";
import StoreActivityFeed from "../components/store/StoreActivityFeed.jsx";
import StoreMetaInfo from "../components/store/StoreMetaInfo.jsx";

const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    gap: 10px;
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

const Grid = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 14px;
    margin-top: 14px;

    @media (max-width: 1000px) {
        grid-template-columns: 1fr;
    }
`;

const LeftColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const RightColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
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

const ReadOnlyBadge = styled.div`
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 6px;
    background: rgba(148, 163, 184, 0.2);
    color: #9ca3af;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

/**
 * StoreOverviewSection Component
 * 
 * READ-ONLY observability view for individual stores.
 * Platform Owner can inspect store state without entering Store App.
 */
export default function StoreOverviewSection({ storeId, onNavigate }) {
    const { store, health, stats, activity, loading, error, refresh } = useStoreOverview(storeId);

    if (!storeId) {
        return (
            <ErrorMessage>
                No store selected. Please select a store from the stores list.
            </ErrorMessage>
        );
    }

    return (
        <>
            <HeaderRow>
                <TitleBlock>
                    <Title>Store Overview</Title>
                    <Subtitle>
                        Observability view for store inspection. This is a read-only view.
                    </Subtitle>
                </TitleBlock>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <ReadOnlyBadge>Read-Only</ReadOnlyBadge>
                    <Button tone="ghost" size="small" onClick={refresh} disabled={loading}>
                        {loading ? "Refreshing..." : "Refresh"}
                    </Button>
                    <Button tone="ghost" size="medium" onClick={() => onNavigate("stores")}>
                        ← Back to stores
                    </Button>
                </div>
            </HeaderRow>

            {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}

            {loading && !store ? (
                <LoadingMessage>Loading store overview...</LoadingMessage>
            ) : (
                <>
                    <StoreHeader store={store} health={health} />

                    <Grid>
                        <LeftColumn>
                            <StoreHealthCard health={health} />
                            <StoreStatsCard stats={stats} />
                            <StoreActivityFeed activity={activity} />
                        </LeftColumn>
                        <RightColumn>
                            <StoreMetaInfo store={store} />
                        </RightColumn>
                    </Grid>
                </>
            )}
        </>
    );
}

