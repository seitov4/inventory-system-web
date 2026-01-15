import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { fadeInUp, countUp } from "../../utils/animations";

/**
 * DashboardCard - Unified base component for all dashboard blocks
 * 
 * Props:
 * - title: string (required)
 * - badge: { text: string, variant: "default" | "success" | "warning" | "error" }
 * - type: "metric" | "status" | "chart" | "info"
 * - value: string | number (for metric/status types)
 * - description: string (meta text below content)
 * - size: "small" | "medium" | "large"
 * - statusColor: string (for status type - green/yellow/red)
 * - tint: "blue" | "green" | "amber" | "neutral" (soft background tint)
 * - onClick: function (optional, makes card clickable)
 * - children: ReactNode (for chart type or custom content)
 */
const CardWrapper = styled.div`
    background: var(--bg-card);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--shadow-card);
    border: 1px solid var(--border-color-subtle);
    display: flex;
    flex-direction: column;
    height: ${props => {
        if (props.$size === "small") return "120px";
        if (props.$size === "medium") return "160px";
        return "220px";
    }};
    transition: ${props => props.$onClick ? "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease" : "none"};
    cursor: ${props => props.$onClick ? "pointer" : "default"};
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    
    /* Soft tint overlay */
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${props => {
            if (!props.$tint) return 'transparent';
            const tints = {
                blue: 'var(--tint-blue)',
                'blue-strong': 'var(--tint-blue-strong)',
                green: 'var(--tint-green)',
                'green-strong': 'var(--tint-green-strong)',
                amber: 'var(--tint-amber)',
                'amber-strong': 'var(--tint-amber-strong)',
                neutral: 'var(--tint-neutral)',
                'neutral-strong': 'var(--tint-neutral-strong)',
            };
            return tints[props.$tint] || tints[props.$tint + '-strong'] || 'transparent';
        }};
        pointer-events: none;
        border-radius: 12px;
        z-index: 0;
    }
    
    /* Subtle top highlight for depth */
    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(240, 243, 246, 0.08), transparent);
        z-index: 1;
    }
    
    /* Ensure content is above tint */
    > * {
        position: relative;
        z-index: 1;
    }

    ${props => props.$onClick && `
        &:hover {
            transform: translateY(-3px);
            box-shadow: var(--shadow-lg);
            border-color: var(--border-color);
            
            &::after {
                background: linear-gradient(90deg, transparent, rgba(88, 166, 255, 0.2), transparent);
            }
        }
    `}
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
    flex-shrink: 0;
    min-height: 20px;
    position: relative;
    cursor: ${props => {
        if (props.$isStatic) return 'not-allowed';
        return props.$draggable ? 'grab' : 'default';
    }};
    user-select: none;
    opacity: ${props => props.$isStatic ? 0.85 : 1};
    
    &:active {
        cursor: ${props => {
            if (props.$isStatic) return 'not-allowed';
            return props.$draggable ? 'grabbing' : 'default';
        }};
    }
`;

const LockIcon = styled.span`
    font-size: 12px;
    color: var(--text-tertiary);
    opacity: 0.6;
    margin-left: 4px;
    display: inline-flex;
    align-items: center;
    line-height: 1;
`;

const DragHandleIcon = styled.div`
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 14px;
    color: var(--text-tertiary);
    opacity: 0.4;
    cursor: grab;
    user-select: none;
    transition: opacity 0.2s ease;
    
    &:hover {
        opacity: 0.7;
    }
    
    &:active {
        cursor: grabbing;
    }
`;

const CardTitle = styled.div`
    font-size: 12px;
    color: var(--text-tertiary);
    font-weight: 500;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    font-size: 11px;
`;

const Badge = styled.span`
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 500;
    background: ${props => {
        if (props.$variant === "success") return "rgba(52, 211, 153, 0.25)";
        if (props.$variant === "warning") return "rgba(252, 211, 77, 0.25)";
        if (props.$variant === "error") return "rgba(248, 113, 113, 0.25)";
        return "rgba(96, 165, 250, 0.25)";
    }};
    color: ${props => {
        if (props.$variant === "success") return "#34D399";
        if (props.$variant === "warning") return "#FCD34D";
        if (props.$variant === "error") return "#F87171";
        return "#60A5FA";
    }};
    border: 1px solid ${props => {
        if (props.$variant === "success") return "rgba(52, 211, 153, 0.4)";
        if (props.$variant === "warning") return "rgba(252, 211, 77, 0.4)";
        if (props.$variant === "error") return "rgba(248, 113, 113, 0.4)";
        return "rgba(96, 165, 250, 0.4)";
    }};
`;

const CardContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: ${props => {
        if (props.$type === "metric") return "center";
        return "flex-start";
    }};
    gap: 6px;
    min-height: 0;
    overflow: hidden;
    align-items: ${props => props.$type === "metric" ? "flex-start" : "stretch"};
`;

const MetricValue = styled.div`
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
    word-break: break-word;
    overflow-wrap: break-word;
    letter-spacing: -0.02em;
`;

const StatusValue = styled.div`
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.$statusColor || "var(--text-primary)"};
    line-height: 1.2;
`;

const InfoTitle = styled.h2`
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.01em;
`;

const InfoText = styled.p`
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
`;

const CardMeta = styled.div`
    font-size: 11px;
    color: var(--text-tertiary);
    margin-top: 6px;
    padding-top: 6px;
    flex-shrink: 0;
    border-top: 1px solid var(--border-color-subtle);
`;

const CardFooter = styled.div`
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
`;

export default function DashboardCard({
    title,
    badge,
    type = "metric",
    value,
    description,
    size = "small",
    statusColor,
    tint,
    onClick,
    children,
    footer,
    index = 0, // For staggered animations
    animateCountUp = false, // Enable count-up animation for metrics
    draggable = false, // Enable drag handle
    isStatic = false, // Widget is locked (non-draggable)
    showLockIcon = false, // Show lock icon (only in edit mode)
    showDragHandle = false, // Show drag handle icon (only in edit mode)
    dragHandleProps = null, // Props for drag handle from dnd-kit
}) {
    const cardRef = useRef(null);
    const metricValueRef = useRef(null);
    const hasAnimated = useRef(false);
    const hasCountedUp = useRef(false);
    const previousValue = useRef(value);
    
    useEffect(() => {
        // Only animate on initial mount, after DOM is ready
        if (hasAnimated.current) return;
        
        // Use requestAnimationFrame to ensure DOM is fully ready
        const timeoutId = requestAnimationFrame(() => {
            if (!hasAnimated.current && cardRef.current && cardRef.current instanceof HTMLElement) {
                fadeInUp(cardRef.current, index * 50, { duration: 600 });
                hasAnimated.current = true;
            }
        });
        
        return () => {
            cancelAnimationFrame(timeoutId);
        };
    }, [index]);
    
    useEffect(() => {
        // Count-up animation for metrics
        if (type === "metric" && animateCountUp && value !== undefined) {
            // Only proceed if ref is ready and element is valid
            if (!metricValueRef.current || !(metricValueRef.current instanceof HTMLElement)) {
                return;
            }
            
            const numValue = typeof value === 'string' 
                ? parseFloat(value.replace(/[^\d.-]/g, '')) || 0
                : Number(value) || 0;
            
            // Only animate when value changes from 0 or when first loaded
            if (!hasCountedUp.current && numValue > 0) {
                const formatFn = typeof value === 'string' && value.includes('₸')
                    ? (val) => `${Math.floor(val).toLocaleString("ru-RU")} ₸`
                    : (val) => Math.floor(val).toLocaleString("ru-RU");
                
                const timeoutId = setTimeout(() => {
                    // Double-check ref is still valid before animating
                    if (metricValueRef.current && metricValueRef.current instanceof HTMLElement && !hasCountedUp.current) {
                        countUp(metricValueRef.current, 0, numValue, {
                            formatFn,
                            duration: 700
                        });
                        hasCountedUp.current = true;
                    }
                }, 200 + index * 50);
                
                return () => clearTimeout(timeoutId);
            } else if (previousValue.current !== value && numValue > 0) {
                // Update without animation on subsequent changes
                if (metricValueRef.current && metricValueRef.current instanceof HTMLElement) {
                    metricValueRef.current.textContent = typeof value === 'string' ? value : numValue.toLocaleString("ru-RU");
                }
            }
            previousValue.current = value;
        }
    }, [value, type, animateCountUp, index]);
    
    const handleClick = onClick ? () => onClick() : undefined;

    return (
        <CardWrapper ref={cardRef} $size={size} $onClick={onClick} $tint={tint} onClick={handleClick}>
            <CardHeader 
                $draggable={draggable && !isStatic} 
                $isStatic={isStatic}
                className={draggable && !isStatic ? "react-grid-item-drag-handle" : ""}
                {...(dragHandleProps || {})}
            >
                <CardTitle>
                    {title}
                    {showLockIcon && <LockIcon title="Locked - cannot be moved between zones">🔒</LockIcon>}
                </CardTitle>
                {badge && <Badge $variant={badge.variant || "default"}>{badge.text}</Badge>}
                {showDragHandle && (
                    <DragHandleIcon {...(dragHandleProps || {})} title="Drag to reorder">
                        ⋮⋮
                    </DragHandleIcon>
                )}
            </CardHeader>

            <CardContent $type={type}>
                {type === "metric" && value !== undefined && (
                    <MetricValue ref={metricValueRef}>{value}</MetricValue>
                )}
                {type === "status" && value !== undefined && (
                    <StatusValue $statusColor={statusColor}>{value}</StatusValue>
                )}
                {type === "chart" && children}
                {type === "info" && children}
            </CardContent>

            {description && <CardMeta>{description}</CardMeta>}

            {footer && <CardFooter>{footer}</CardFooter>}
        </CardWrapper>
    );
}

