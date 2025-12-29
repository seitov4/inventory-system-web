import React from "react";
import styled, { css } from "styled-components";

const tones = {
    green: css`
        background: rgba(22, 163, 74, 0.16);
        color: #4ade80;
    `,
    yellow: css`
        background: rgba(234, 179, 8, 0.16);
        color: #facc15;
    `,
    red: css`
        background: rgba(248, 113, 113, 0.16);
        color: #fca5a5;
    `,
    blue: css`
        background: rgba(59, 130, 246, 0.16);
        color: #93c5fd;
    `,
    gray: css`
        background: rgba(148, 163, 184, 0.16);
        color: #e5e7eb;
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


