import React from "react";
import styled, { css } from "styled-components";

const tones = {
    green: css`
        background: #ECFDF3;
        color: #15803D;
    `,
    yellow: css`
        background: #FFFBEB;
        color: #B45309;
    `,
    red: css`
        background: #FEF2F2;
        color: #DC2626;
    `,
    blue: css`
        background: #EFF6FF;
        color: #2563EB;
    `,
    gray: css`
        background: #F1F5F9;
        color: #4B5563;
    `,
};

const sizes = {
    small: css`
        padding: 2px 8px;
        font-size: 10px;
    `,
    medium: css`
        padding: 3px 10px;
        font-size: 11px;
    `,
};

const StyledBadge = styled.span`
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    ${(props) => sizes[props.$size || "medium"]};
    ${(props) => tones[props.$tone || "gray"]};
`;

export default function Badge({ children, tone = "gray", size = "medium" }) {
    return (
        <StyledBadge $tone={tone} $size={size}>
            {children}
        </StyledBadge>
    );
}


