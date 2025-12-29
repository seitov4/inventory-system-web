import React from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
`;

const Dialog = styled.div`
    background: rgba(15, 23, 42, 0.98);
    border-radius: 16px;
    padding: 24px;
    max-width: 480px;
    width: 100%;
    border: 1px solid rgba(31, 41, 55, 0.9);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
`;

const Title = styled.h3`
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
    color: #e5e7eb;
`;

const Message = styled.p`
    margin: 0 0 20px;
    font-size: 14px;
    color: #9ca3af;
    line-height: 1.5;
`;

const Warning = styled.div`
    padding: 12px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #fca5a5;
`;

const Actions = styled.div`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
`;

/**
 * ConfirmLifecycleAction Component
 * 
 * Reusable confirmation dialog for lifecycle actions.
 * Shows action type, store name, and consequences.
 */
export default function ConfirmLifecycleAction({
    actionType,
    storeName,
    irreversible = false,
    onConfirm,
    onCancel,
    customMessage,
}) {
    const getActionText = () => {
        switch (actionType) {
            case "suspend":
                return `Suspend store "${storeName}"?`;
            case "resume":
                return `Resume store "${storeName}"?`;
            case "archive":
                return `Archive store "${storeName}"?`;
            default:
                return `Perform action on "${storeName}"?`;
        }
    };

    const getConsequenceText = () => {
        switch (actionType) {
            case "suspend":
                return "Users will lose access to this store. The store can be resumed later.";
            case "resume":
                return "Users will regain access to this store.";
            case "archive":
                return "This action cannot be undone. The store will become read-only and cannot be reactivated.";
            default:
                return customMessage || "This action will affect the store's availability.";
        }
    };

    return (
        <Overlay onClick={onCancel}>
            <Dialog onClick={(e) => e.stopPropagation()}>
                <Title>{getActionText()}</Title>
                <Message>{getConsequenceText()}</Message>
                {irreversible && (
                    <Warning>
                        ⚠️ This action is irreversible. Please confirm you want to proceed.
                    </Warning>
                )}
                <Actions>
                    <Button tone="ghost" size="medium" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        tone={irreversible ? "danger" : "primary"}
                        size="medium"
                        onClick={onConfirm}
                    >
                        Confirm
                    </Button>
                </Actions>
            </Dialog>
        </Overlay>
    );
}

