import React, { useState } from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";
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

/**
 * StoreActionsMenu Component
 * 
 * Context-aware actions menu based on store lifecycle status.
 * Shows appropriate actions for each status and handles confirmations.
 */
export default function StoreActionsMenu({
    store,
    onSuspend,
    onResume,
    onArchive,
    loading = false,
}) {
    const [confirmAction, setConfirmAction] = useState(null);

    // Determine available actions based on status
    const getAvailableActions = () => {
        const status = String(store.status).toLowerCase();

        switch (status) {
            case "provisioning":
                return []; // No actions during provisioning
            case "active":
                return [
                    { type: "suspend", label: "Suspend", handler: () => setConfirmAction("suspend") },
                    { type: "archive", label: "Archive", handler: () => setConfirmAction("archive") },
                ];
            case "suspended":
                return [
                    { type: "resume", label: "Resume", handler: () => setConfirmAction("resume") },
                    { type: "archive", label: "Archive", handler: () => setConfirmAction("archive") },
                ];
            case "archived":
                return []; // No actions for archived stores (read-only)
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
                case "archive":
                    await onArchive(store.id);
                    break;
            }
        } catch (error) {
            // Error handling is done in the hook
            console.error("[StoreActionsMenu] Action failed", error);
        } finally {
            setConfirmAction(null);
        }
    };

    const handleCancel = () => {
        setConfirmAction(null);
    };

    const availableActions = getAvailableActions();

    // No actions available
    if (availableActions.length === 0) {
        return (
            <span style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
                {store.status === "archived" ? "Read-only" : "No actions"}
            </span>
        );
    }

    return (
        <>
            <Menu>
                {availableActions.map((action) => (
                    <MenuButton
                        key={action.type}
                        onClick={action.handler}
                        disabled={loading}
                    >
                        {action.label}
                    </MenuButton>
                ))}
            </Menu>

            {confirmAction && (
                <ConfirmLifecycleAction
                    actionType={confirmAction}
                    storeName={store.name}
                    irreversible={confirmAction === "archive"}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </>
    );
}

