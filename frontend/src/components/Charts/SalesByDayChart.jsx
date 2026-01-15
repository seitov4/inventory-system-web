import React, { useMemo } from "react";
import styled from "styled-components";

// ===== STYLED COMPONENTS =====
const ChartContainer = styled.div`
    margin-top: 20px;
    min-height: 250px;
    position: relative;
`;

const LineChartWrapper = styled.div`
    position: relative;
    height: 250px;
    padding: 20px 16px 40px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px;
`;

const ChartLine = styled.svg`
    position: absolute;
    top: 20px;
    left: 16px;
    right: 16px;
    bottom: 40px;
    pointer-events: none;
`;

const ChartPoint = styled.div`
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color);
    border: 2px solid var(--bg-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    transform: translate(-50%, 50%);
    z-index: 2;

    &:hover {
        width: 12px;
        height: 12px;
        z-index: 3;
    }
`;

const ChartBar = styled.div`
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
`;

const BarColumn = styled.div`
    width: 100%;
    max-width: 40px;
    background: ${props => props.$isActive ? 'var(--primary-color)' : 'rgba(88, 166, 255, 0.3)'};
    border-radius: 4px 4px 0 0;
    min-height: 4px;
    height: ${props => props.$height || 0}%;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;

    &:hover {
        background: var(--primary-color);
        opacity: 0.9;
    }
`;

const BarLabel = styled.div`
    margin-top: 8px;
    font-size: 10px;
    color: var(--text-secondary);
    white-space: nowrap;
    text-align: center;
    transform: rotate(-45deg);
    transform-origin: center;
    width: 60px;
    margin-left: -10px;
`;

const YAxisLabel = styled.div`
    position: absolute;
    left: 8px;
    font-size: 10px;
    color: var(--text-tertiary);
    transform: translateY(-50%);
`;

const Tooltip = styled.div`
    position: absolute;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    z-index: 10;
    white-space: nowrap;
    opacity: ${props => props.$visible ? 1 : 0};
    transition: opacity 0.2s ease;
    transform: translate(-50%, -100%);
    margin-top: -8px;

    strong {
        display: block;
        margin-bottom: 4px;
        color: var(--text-primary);
    }
`;

const EmptyState = styled.div`
    padding: 40px 20px;
    text-align: center;
    color: var(--text-tertiary);
    font-size: 14px;
`;

const GridLine = styled.line`
    stroke: var(--border-color);
    stroke-width: 1;
    stroke-dasharray: 2, 2;
    opacity: 0.3;
`;

// ===== MAIN COMPONENT =====
/**
 * SalesByDayChart - Displays daily sales volume over time
 * 
 * @param {Array} data - Array of { date: string, total: number } objects
 * @param {string} period - 'daily' | 'weekly' | 'monthly'
 */
export default function SalesByDayChart({ data = [], period = "daily" }) {
    const [hoveredIndex, setHoveredIndex] = React.useState(null);
    const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

    // Daily sales aggregation - group by date and sum totals
    const aggregatedData = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) {
            // Return empty array with placeholder dates based on period
            const days = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
            const today = new Date();
            return Array.from({ length: days }, (_, i) => {
                const date = new Date(today);
                date.setDate(date.getDate() - (days - 1 - i));
                return {
                    date: date.toISOString().split('T')[0],
                    total: 0,
                };
            });
        }

        // If data is already aggregated by date, use it directly
        if (data[0]?.date && typeof data[0]?.total === 'number') {
            return data;
        }

        // Otherwise, aggregate by date
        const grouped = {};
        data.forEach(item => {
            const date = item.date || item.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
            const total = item.total || item.sale_amount || item.amount || 0;
            grouped[date] = (grouped[date] || 0) + total;
        });

        return Object.entries(grouped)
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [data, period]);

    const maxValue = useMemo(() => {
        if (aggregatedData.length === 0) return 1;
        const max = Math.max(...aggregatedData.map(d => d.total));
        return max > 0 ? max : 1;
    }, [aggregatedData]);

    // Format date label based on period
    const formatDateLabel = (dateString) => {
        const date = new Date(dateString);
        if (period === "daily") {
            // Show day number for daily mode
            return date.toLocaleDateString('en-US', { day: '2-digit' });
        }
        // Show day and month for weekly/monthly
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    };

    // Format date for tooltip
    const formatDateTooltip = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleBarHover = (index, event) => {
        setHoveredIndex(index);
        const rect = event.currentTarget.getBoundingClientRect();
        const container = event.currentTarget.closest('[data-chart-container]');
        if (container) {
            const containerRect = container.getBoundingClientRect();
            setTooltipPosition({
                x: rect.left + rect.width / 2 - containerRect.left,
                y: rect.top - containerRect.top,
            });
        }
    };

    const handleBarLeave = () => {
        setHoveredIndex(null);
    };

    // Generate grid lines
    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
        const y = 20 + (i * (230 / 4));
        gridLines.push(
            <GridLine
                key={i}
                x1="16"
                y1={y}
                x2="calc(100% - 16px)"
                y2={y}
            />
        );
    }

    // Generate line path for line chart overlay
    const generateLinePath = () => {
        if (aggregatedData.length < 2) return '';
        
        const containerWidth = 100; // Percentage
        const padding = 16;
        const availableWidth = containerWidth - (padding * 2);
        const step = aggregatedData.length > 1 ? availableWidth / (aggregatedData.length - 1) : 0;
        
        return aggregatedData.map((item, index) => {
            const x = padding + (index * step);
            const y = 20 + (1 - item.total / maxValue) * 210;
            return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
        }).join(' ');
    };
    
    const linePath = generateLinePath();

    const hasData = aggregatedData.some(d => d.total > 0);

    return (
        <ChartContainer data-chart-container>
            {aggregatedData.length === 0 ? (
                <EmptyState>
                    No sales data for selected period
                </EmptyState>
            ) : (
                <>
                    <LineChartWrapper>
                        {/* Grid lines */}
                        <ChartLine>
                            {gridLines}
                        </ChartLine>

                        {/* Y-axis labels */}
                        {[0, 1, 2, 3, 4].map(i => {
                            const value = maxValue * (1 - i / 4);
                            return (
                                <YAxisLabel
                                    key={i}
                                    style={{ top: `${20 + (i * 210 / 4)}px` }}
                                >
                                    {value > 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value)} ₸
                                </YAxisLabel>
                            );
                        })}

                        {/* Bars */}
                        {aggregatedData.map((item, index) => {
                            const height = (item.total / maxValue) * 100;
                            const isActive = hoveredIndex === index;
                            const dateLabel = formatDateLabel(item.date);

                            return (
                                <ChartBar
                                    key={item.date || index}
                                    onMouseEnter={(e) => handleBarHover(index, e)}
                                    onMouseLeave={handleBarLeave}
                                >
                                    <BarColumn
                                        $height={height}
                                        $isActive={isActive}
                                        title={`${formatDateTooltip(item.date)}: ${item.total.toLocaleString('en-US')} ₸`}
                                    />
                                    <BarLabel>{dateLabel}</BarLabel>
                                </ChartBar>
                            );
                        })}

                        {/* Line chart overlay */}
                        {aggregatedData.length > 1 && linePath && (
                            <ChartLine style={{ pointerEvents: 'none' }}>
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke="var(--primary-color)"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity="0.6"
                                />
                            </ChartLine>
                        )}
                    </LineChartWrapper>

                    {/* Tooltip */}
                    {hoveredIndex !== null && aggregatedData[hoveredIndex] && (
                        <Tooltip
                            $visible={true}
                            style={{
                                left: `${tooltipPosition.x}px`,
                                top: `${tooltipPosition.y}px`,
                            }}
                        >
                            <strong>{formatDateTooltip(aggregatedData[hoveredIndex].date)}</strong>
                            <div>Total: {aggregatedData[hoveredIndex].total.toLocaleString('en-US')} ₸</div>
                        </Tooltip>
                    )}
                </>
            )}
        </ChartContainer>
    );
}

