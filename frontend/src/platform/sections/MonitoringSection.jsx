import React from "react";
import styled from "styled-components";
import HealthCard from "../widgets/HealthCard.jsx";
import ServerStatus from "../widgets/ServerStatus.jsx";
import usePlatformHealth from "../hooks/usePlatformHealth.jsx";

const Grid = styled.div`
    display: grid;
    grid-template-columns: 2fr 1.3fr;
    gap: 14px;

    @media (max-width: 1000px) {
        grid-template-columns: 1fr;
    }
`;

const Stack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
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

const ErrorCard = styled.div`
    padding: 12px 14px;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    font-size: 13px;
    margin-bottom: 14px;
`;

const LoadingPlaceholder = styled.div`
    color: #9ca3af;
    font-size: 13px;
    padding: 20px;
    text-align: center;
`;

export default function MonitoringSection() {
    const { health, loading, error } = usePlatformHealth();

    return (
        <>
            <Title>Monitoring</Title>
            <Subtitle>
                Platform-level health of backend, database and edge servers. Data updates every 5 seconds.
            </Subtitle>
            {error && (
                <ErrorCard>
                    ⚠️ {error}
                </ErrorCard>
            )}
            {loading && !health.backend.statusLabel && (
                <LoadingPlaceholder>
                    Loading health data...
                </LoadingPlaceholder>
            )}
            {!loading || health.backend.statusLabel ? (
                <Grid>
                    <Stack>
                        <HealthCard title="Backend service" item={health.backend} />
                        <HealthCard title="Database" item={health.db} />
                        {health.system && health.system.statusLabel && (
                            <HealthCard title="System & Workers" item={health.system} />
                        )}
                    </Stack>
                    <Stack>
                        <ServerStatus servers={health.servers} />
                    </Stack>
                </Grid>
            ) : null}
        </>
    );
}


