import React from "react";
import styled from "styled-components";

const ChartContainer = styled.div`
    width: 100%;
    height: 40px;
    position: relative;
    margin-top: 8px;
`;

const ChartSvg = styled.svg`
    width: 100%;
    height: 100%;
`;

const ChartLine = styled.polyline`
    fill: none;
    stroke: ${(props) => props.$color || "#3b82f6"};
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
`;

const ChartArea = styled.polygon`
    fill: ${(props) => props.$color || "#3b82f6"};
    fill-opacity: 0.1;
`;

/**
 * MiniChart Component
 * 
 * Simple sparkline-style chart for trends.
 * No heavy chart libraries - pure SVG.
 */
export default function MiniChart({ data, color = "#3b82f6" }) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <ChartContainer>
                <div style={{ fontSize: 11, color: "#6b7280", textAlign: "center", paddingTop: 12 }}>
                    No data
                </div>
            </ChartContainer>
        );
    }

    const values = data.map((d) => (typeof d === "number" ? d : d.value || d.count || 0));
    const max = Math.max(...values, 1); // Avoid division by zero
    const min = Math.min(...values, 0);

    const width = 100;
    const height = 40;
    const padding = 4;

    const points = values.map((value, index) => {
        const x = padding + (index / (values.length - 1 || 1)) * (width - padding * 2);
        const y = height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2);
        return `${x},${y}`;
    });

    const areaPoints = [
        `${padding},${height - padding}`,
        ...points,
        `${width - padding},${height - padding}`,
    ].join(" ");

    return (
        <ChartContainer>
            <ChartSvg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <ChartArea points={areaPoints} $color={color} />
                <ChartLine points={points.join(" ")} $color={color} />
            </ChartSvg>
        </ChartContainer>
    );
}

