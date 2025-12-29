import React from "react";
import styled from "styled-components";

const Indicator = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: ${(props) => {
        if (props.$trend === "up") return "#22c55e";
        if (props.$trend === "down") return "#ef4444";
        return "#9ca3af";
    }};
`;

const Arrow = styled.span`
    font-size: 14px;
    line-height: 1;
`;

/**
 * TrendIndicator Component
 * 
 * Displays trend direction with color coding.
 * Shows: ↑ up (green), ↓ down (red), → stable (gray)
 */
export default function TrendIndicator({ trend, change, showChange = true }) {
    const normalized = String(trend || "stable").toLowerCase();

    let arrow = "→";
    if (normalized === "up") {
        arrow = "↑";
    } else if (normalized === "down") {
        arrow = "↓";
    }

    return (
        <Indicator $trend={normalized}>
            <Arrow>{arrow}</Arrow>
            {showChange && change !== null && change !== undefined && (
                <span>
                    {change > 0 ? "+" : ""}
                    {change}%
                </span>
            )}
        </Indicator>
    );
}

