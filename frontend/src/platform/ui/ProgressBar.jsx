import React from "react";
import styled from "styled-components";

const Track = styled.div`
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(31, 41, 55, 1);
    overflow: hidden;
`;

const Fill = styled.div`
    height: 100%;
    width: ${(props) => Math.min(100, Math.max(0, props.$value || 0))}%;
    border-radius: 999px;
    background: ${(props) =>
        props.$tone === "green"
            ? "#22c55e"
            : props.$tone === "yellow"
            ? "#eab308"
            : "#ef4444"};
    transition: width 0.25s ease;
`;

export default function ProgressBar({ value, tone = "green" }) {
    return (
        <Track>
            <Fill $value={value} $tone={tone} />
        </Track>
    );
}


