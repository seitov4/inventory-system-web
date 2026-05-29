import React, { useState } from "react";
import styled from "styled-components";
import ConfirmLifecycleAction from "./ConfirmLifecycleAction.jsx";

const Menu = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
`;

const MenuButton = styled.button`
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(55, 65, 81, 0.9);
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    color: #e5e7eb;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover:not(:disabled) {
        background: rgba(30, 64, 175, 0.7);
        border-color: rgba(59, 130, 246, 0.8);
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }
`;

export default function StoreActionsMenu({
    store,
    onSuspend,
    onResume,
    onArchive,
    loading = false,
}) {
    const [confirmAction, setConfirmAction] = useState(null);

    const getAvailableActions = () => {
        const status = String(store.status).toLowerCase();

        switch (status) {
            case "active":
                return [
                    {
                        type: "suspend",
                        label: "Suspend",
                        handler: () => setConfirmAction("suspend"),
                    },
                    {
                        type: "deactivate",
                        label: "Deactivate",
                        handler: () => setConfirmAction("deactivate"),
                    },
                ];
            case "suspended":
                return [
                    { type: "resume", label: "Resume", handler: () => setConfirmAction("resume") },
                    {
                        type: "deactivate",
                        label: "Deactivate",
                        handler: () => setConfirmAction("deactivate"),
                    },
                ];
            case "inactive":
                return [];
            default:
                return [];
        }
    };

    const handleConfirm = async () => {
        try {
            switch (confirmAction) {
                case "suspend":
                    await onSuspend(store.id);
                    break;
                case "resume":
                    await onResume(store.id);
                    break;
                case "deactivate":
                    await onArchive(store.id);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error("[StoreActionsMenu] Action failed", error);
        } finally {
            setConfirmAction(null);
        }
    };

    const availableActions = getAvailableActions();

    if (availableActions.length === 0) {
        return (
            <span style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                {store.status === "inactive" ? "Read-only" : "No actions"}
            </span>
        );
    }

    return (
        <>
            <Menu>
                {availableActions.map((action) => (
                    <MenuButton key={action.type} onClick={action.handler} disabled={loading}>
                        {action.label}
                    </MenuButton>
                ))}
            </Menu>

            {confirmAction && (
                <ConfirmLifecycleAction
                    actionType={confirmAction}
                    storeName={store.name}
                    irreversible={confirmAction === "deactivate"}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </>
    );
}
