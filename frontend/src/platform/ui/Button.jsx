import React from "react";
import styled, { css } from "styled-components";

const baseStyles = css`
    border-radius: 8px;
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
        background: #2563EB;
        color: #FFFFFF;
        border-color: #2563EB;
        box-shadow: none;

        &:hover:not(:disabled) {
            background: #1D4ED8;
            border-color: #1D4ED8;
        }
    `,
    ghost: css`
        background: #FFFFFF;
        color: #4B5563;
        border-color: #E5E7EB;

        &:hover:not(:disabled) {
            background: #F1F5F9;
            border-color: #CBD5E1;
        }
    `,
    danger: css`
        background: #FEF2F2;
        color: #DC2626;
        border-color: #FECACA;

        &:hover:not(:disabled) {
            background: #FEE2E2;
            border-color: #FCA5A5;
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


