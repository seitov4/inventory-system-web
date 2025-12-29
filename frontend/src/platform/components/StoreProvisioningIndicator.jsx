import React from "react";
import styled from "styled-components";

const Indicator = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #60a5fa;
`;

const Spinner = styled.div`
    width: 12px;
    height: 12px;
    border: 2px solid rgba(96, 165, 250, 0.3);
    border-top-color: #60a5fa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;

/**
 * StoreProvisioningIndicator Component
 * 
 * Shows visual feedback when a store is in provisioning state.
 * Displays spinner and status text.
 */
export default function StoreProvisioningIndicator() {
    return (
        <Indicator>
            <Spinner />
            <span>Provisioning in progress</span>
        </Indicator>
    );
}

