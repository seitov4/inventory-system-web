import React from "react";
import styled, { css } from "styled-components";

const baseStyles = css`
    border-radius: 999px;
    border: 1px solid transparent;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease,
        box-shadow 0.15s ease, transform 0.05s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;

    &:active {
        transform: translateY(1px);
        box-shadow: none;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
    }
`;

const sizes = {
    small: css`
        padding: 6px 12px;
        font-size: 12px;
    `,
    medium: css`
        padding: 8px 16px;
        font-size: 13px;
    `,
    large: css`
        padding: 10px 20px;
        font-size: 14px;
    `,
};

const tones = {
    primary: css`
        background: linear-gradient(135deg, #22c55e, #0ea5e9);
        color: #020617;
        border-color: transparent;
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35);

        &:hover:not(:disabled) {
            background: linear-gradient(135deg, #16a34a, #0284c7);
            box-shadow: 0 12px 28px rgba(16, 185, 129, 0.45);
        }
    `,
    ghost: css`
        background: transparent;
        color: #e5e7eb;
        border-color: rgba(148, 163, 184, 0.4);

        &:hover:not(:disabled) {
            background: rgba(15, 23, 42, 0.7);
            border-color: rgba(148, 163, 184, 0.8);
        }
    `,
    danger: css`
        background: rgba(248, 113, 113, 0.1);
        color: #fca5a5;
        border-color: rgba(248, 113, 113, 0.3);

        &:hover:not(:disabled) {
            background: rgba(248, 113, 113, 0.2);
            border-color: rgba(248, 113, 113, 0.6);
        }
    `,
};

const StyledButton = styled.button`
    ${baseStyles};
    ${(props) => sizes[props.$size || "medium"]};
    ${(props) => tones[props.$tone || "primary"]};
`;

export default function Button({ children, size = "medium", tone = "primary", ...rest }) {
    return (
        <StyledButton $size={size} $tone={tone} {...rest}>
            {children}
        </StyledButton>
    );
}


