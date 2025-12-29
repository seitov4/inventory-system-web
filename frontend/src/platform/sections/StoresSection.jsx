import React from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import StoresTable from "../tables/StoresTable.jsx";
import useStores from "../hooks/useStores.jsx";

const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    gap: 10px;

    @media (max-width: 640px) {
        flex-direction: column;
        align-items: flex-start;
    }
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
    padding: 20px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
`;

export default function StoresSection({ onNavigate, onStoreSelect }) {
    const {
        stores,
        loading,
        error,
        suspendStore,
        resumeStore,
        archiveStore,
    } = useStores();

    const handleSuspend = async (storeId) => {
        try {
            await suspendStore(storeId);
        } catch (e) {
            // Error is handled in the hook and displayed via error state
        }
    };

    const handleResume = async (storeId) => {
        try {
            await resumeStore(storeId);
        } catch (e) {
            // Error is handled in the hook and displayed via error state
        }
    };

    const handleArchive = async (storeId) => {
        try {
            await archiveStore(storeId);
        } catch (e) {
            // Error is handled in the hook and displayed via error state
        }
    };

    return (
        <>
            <HeaderRow>
                <TitleBlock>
                    <Title>Stores</Title>
                    <Subtitle>
                        Multi-tenant inventory workspaces managed by the platform. Control store
                        lifecycle: provision, suspend, resume, or archive.
                    </Subtitle>
                </TitleBlock>
                <div style={{ display: "flex", gap: 8 }}>
                    <Button
                        tone="primary"
                        size="medium"
                        onClick={() => onNavigate("store-create")}
                    >
                        + Add store
                    </Button>
                </div>
            </HeaderRow>

            <div style={{ marginBottom: 14 }}>
                <Card
                    title="Store lifecycle"
                    description="Manage tenant stores through their lifecycle states."
                >
                    <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
                        <strong>Provisioning:</strong> Store is being created and initialized.
                        <br />
                        <strong>Active:</strong> Store is fully operational. Can be suspended or archived.
                        <br />
                        <strong>Suspended:</strong> Store is disabled. Users lose access. Can be resumed or archived.
                        <br />
                        <strong>Archived:</strong> Store is read-only and cannot be reactivated. This action is irreversible.
                    </div>
                </Card>
            </div>

            {error && <ErrorMessage>⚠️ {error}</ErrorMessage>}

            {loading && stores.length === 0 ? (
                <LoadingMessage>Loading stores...</LoadingMessage>
            ) : (
                <StoresTable
                    stores={stores}
                    onSuspend={handleSuspend}
                    onResume={handleResume}
                    onArchive={handleArchive}
                    onStoreClick={(storeId) => {
                        if (onStoreSelect) {
                            onStoreSelect(storeId);
                        }
                        onNavigate("store-overview", storeId);
                    }}
                    loading={loading}
                />
            )}
        </>
    );
}


