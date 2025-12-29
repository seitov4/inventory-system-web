import React from "react";
import styled from "styled-components";
import Card from "../ui/Card.jsx";
import TrendIndicator from "./TrendIndicator.jsx";
import MiniChart from "./MiniChart.jsx";

const ValueRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
`;

const Value = styled.div`
    font-size: 28px;
    font-weight: 700;
    color: #e5e7eb;
    line-height: 1;
`;

const Subtitle = styled.div`
    font-size: 12px;
    color: #9ca3af;
    margin-top: 8px;
    line-height: 1.4;
`;

const TrendRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
`;

const Comparison = styled.div`
    font-size: 11px;
    color: #9ca3af;
`;

/**
 * Format value based on type
 */
function formatValue(value, type) {
    if (value === null || value === undefined) return "N/A";
    
    if (type === "percentage") {
        return `${value}%`;
    }
    if (type === "count" && typeof value === "number" && value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
    }
    if (type === "latency" && typeof value === "number") {
        return `${value} ms`;
    }
    if (typeof value === "number") {
        return value.toLocaleString();
    }
    return String(value);
}

/**
 * MetricCard Component
 * 
 * Displays a platform metric with trend and context.
 * Shows value, trend indicator, comparison, and optional chart.
 */
export default function MetricCard({
    label,
    value,
    subtitle,
    trend,
    change,
    comparison,
    chartData,
    chartColor,
    statusColor,
    onClick,
}) {
    const formattedValue = formatValue(value, typeof value === "number" ? "number" : "text");

    return (
        <div style={{ cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
            <Card
                title={label}
                description={null}
                actions={
                    statusColor && (
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: statusColor,
                            }}
                        />
                    )
                }
            >
                <ValueRow>
                    <Value>{formattedValue}</Value>
                    {trend && <TrendIndicator trend={trend} change={change} />}
                </ValueRow>

                {comparison && (
                    <Comparison>
                        {comparison}
                    </Comparison>
                )}

                {subtitle && <Subtitle>{subtitle}</Subtitle>}

                {chartData && chartData.length > 0 && (
                    <MiniChart data={chartData} color={chartColor} />
                )}
            </Card>
        </div>
    );
}

