import React from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
`;

const Dialog = styled.div`
    background: #ffffff;
    border-radius: 8px;
    padding: 24px;
    max-width: 480px;
    width: 100%;
    border: 1px solid #dbe3ef;
    box-shadow: 0 24px 56px rgba(15, 23, 42, 0.24);
`;

const Title = styled.h3`
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
`;

const Message = styled.p`
    margin: 0 0 20px;
    font-size: 14px;
    color: #64748b;
    line-height: 1.5;
`;

const Warning = styled.div`
    padding: 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 13px;
    color: #b91c1c;
`;

const Actions = styled.div`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
`;

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
            case "deactivate":
                return `Deactivate store "${storeName}"?`;
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
            case "deactivate":
                return "The store will be marked inactive/deleted. Users lose access, but all store data stays in the database.";
            default:
                return customMessage || "This action will affect the store availability.";
        }
    };

    return (
        <Overlay onClick={onCancel}>
            <Dialog onClick={(e) => e.stopPropagation()}>
                <Title>{getActionText()}</Title>
                <Message>{getConsequenceText()}</Message>
                {irreversible && (
                    <Warning>This is a soft delete: related store data will be preserved.</Warning>
                )}
                <Actions>
                    <Button tone="ghost" size="medium" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button tone={irreversible ? "danger" : "primary"} size="medium" onClick={onConfirm}>
                        Confirm
                    </Button>
                </Actions>
            </Dialog>
        </Overlay>
    );
}
