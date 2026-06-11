import React, { useState } from "react";
import styled from "styled-components";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { useAuth } from "../../context/AuthContext";
import AIChatModal from "./AIChatModal";

const VISIBLE_ROLES = new Set(["owner", "manager", "admin"]);
const HIDDEN_ROLES = new Set(["cashier", "staff"]);

const FloatingButton = styled.button`
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 1100;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 18px;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--primary-color);
    color: #ffffff;
    font-size: 14px;
    font-weight: 850;
    cursor: pointer;
    box-shadow: 0 16px 34px rgba(22, 141, 255, 0.28);
    transition: all 0.18s ease;

    svg {
        width: 20px;
        height: 20px;
    }

    &:hover {
        background: var(--primary-hover);
        transform: translateY(-1px);
        box-shadow: 0 18px 38px rgba(22, 141, 255, 0.34);
    }

    @media (max-width: 720px) {
        right: 16px;
        bottom: 16px;
        min-height: 46px;
        padding: 0 15px;
    }
`;

function canShowAssistant(role) {
    if (!role) return true;
    if (HIDDEN_ROLES.has(role)) return false;
    return VISIBLE_ROLES.has(role);
}

export default function AIChatButton() {
    const { role } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (!canShowAssistant(role)) return null;

    return (
        <>
            <FloatingButton
                type="button"
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(true)}
            >
                <SmartToyOutlinedIcon />
                AI Assistant
            </FloatingButton>
            <AIChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
