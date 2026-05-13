import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { countUp, fadeInUp } from "../../utils/animations";

const CardWrapper = styled.div`
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    padding: 14px;
    box-shadow: var(--shadow-card);
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    height: ${(props) => {
        if (props.$size === "small") return "112px";
        if (props.$size === "medium") return "142px";
        if (props.$size === "square") return "260px";
        if (props.$size === "panelMetric") return "100%";
        if (props.$size === "panelChart") return "100%";
        return "190px";
    }};
    transition: ${(props) =>
        props.$onClick
            ? "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
            : "none"};
    cursor: ${(props) => (props.$onClick ? "pointer" : "default")};
    box-sizing: border-box;
    position: relative;
    overflow: hidden;

    &::before {
        content: "";
        position: absolute;
        inset: 0;
        background: ${(props) => {
            if (!props.$tint) return "transparent";
            const tints = {
                blue: "var(--tint-blue)",
                "blue-strong": "var(--tint-blue-strong)",
                purple: "var(--tint-purple)",
                "purple-strong": "var(--tint-purple-strong)",
                green: "var(--tint-green)",
                "green-strong": "var(--tint-green-strong)",
                amber: "var(--tint-amber)",
                "amber-strong": "var(--tint-amber-strong)",
                neutral: "var(--tint-neutral)",
                "neutral-strong": "var(--tint-neutral-strong)",
            };
            return tints[props.$tint] || "transparent";
        }};
        pointer-events: none;
        border-radius: var(--radius-lg);
        z-index: 0;
    }

    > * {
        position: relative;
        z-index: 1;
    }

    ${(props) =>
        props.$onClick &&
        `
        &:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
            border-color: var(--primary-soft);
        }
    `}
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    flex-shrink: 0;
    min-height: 34px;
    position: relative;
    cursor: ${(props) => {
        if (props.$isStatic) return "not-allowed";
        return props.$draggable ? "grab" : "default";
    }};
    user-select: none;
    opacity: ${(props) => (props.$isStatic ? 0.85 : 1)};

    &:active {
        cursor: ${(props) => {
            if (props.$isStatic) return "not-allowed";
            return props.$draggable ? "grabbing" : "default";
        }};
    }
`;

const TitleGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
`;

const IconBadge = styled.span`
    width: 34px;
    height: 34px;
    border-radius: 13px;
    background: #ffffff;
    color: var(--primary-color);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
    border: 1px solid rgba(230, 232, 239, 0.78);
    flex-shrink: 0;

    svg {
        width: 20px;
        height: 20px;
    }
`;

const LockIcon = styled.span`
    font-size: 10px;
    color: var(--text-tertiary);
    opacity: 0.75;
    margin-left: 4px;
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
`;

const CardTitle = styled.div`
    color: var(--text-tertiary);
    font-weight: 850;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const Badge = styled.span`
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
    background: ${(props) => {
        if (props.$variant === "success") return "var(--success-bg)";
        if (props.$variant === "warning") return "var(--warning-bg)";
        if (props.$variant === "error") return "var(--error-bg)";
        return "var(--primary-light)";
    }};
    color: ${(props) => {
        if (props.$variant === "success") return "var(--success-color)";
        if (props.$variant === "warning") return "var(--warning-color)";
        if (props.$variant === "error") return "var(--error-color)";
        return "var(--primary-color)";
    }};
    border: 1px solid ${(props) => {
        if (props.$variant === "success") return "var(--success-border)";
        if (props.$variant === "warning") return "var(--warning-border)";
        if (props.$variant === "error") return "var(--error-border)";
        return "var(--primary-soft)";
    }};
`;

const CardContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: ${(props) => (props.$type === "metric" ? "center" : "flex-start")};
    gap: 5px;
    min-height: 0;
    overflow: hidden;
    align-items: ${(props) => (props.$type === "metric" ? "flex-start" : "stretch")};
`;

const MetricValue = styled.div`
    font-size: clamp(24px, 2.25vw, 34px);
    font-weight: 950;
    color: var(--text-primary);
    line-height: 1.08;
    word-break: break-word;
    overflow-wrap: break-word;
    letter-spacing: 0;
    max-width: 100%;
`;

const StatusValue = styled.div`
    font-size: 24px;
    font-weight: 900;
    color: ${(props) => props.$statusColor || "var(--text-primary)"};
    line-height: 1.2;
`;

const CardMeta = styled.div`
    font-size: 11px;
    color: var(--text-tertiary);
    margin-top: 7px;
    padding-top: 7px;
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
    icon,
    onClick,
    children,
    footer,
    index = 0,
    animateCountUp = false,
    draggable = false,
    isStatic = false,
    showLockIcon = false,
    showDragHandle = false,
    dragHandleProps = null,
}) {
    const cardRef = useRef(null);
    const metricValueRef = useRef(null);
    const hasAnimated = useRef(false);
    const hasCountedUp = useRef(false);
    const previousValue = useRef(value);
    const Icon = icon;

    useEffect(() => {
        if (hasAnimated.current) return;

        const timeoutId = requestAnimationFrame(() => {
            if (!hasAnimated.current && cardRef.current instanceof HTMLElement) {
                fadeInUp(cardRef.current, index * 50, { duration: 600 });
                hasAnimated.current = true;
            }
        });

        return () => {
            cancelAnimationFrame(timeoutId);
        };
    }, [index]);

    useEffect(() => {
        if (type === "metric" && animateCountUp && value !== undefined) {
            if (!(metricValueRef.current instanceof HTMLElement)) return;

            const numValue =
                typeof value === "string"
                    ? parseFloat(value.replace(/,/g, "").replace(/[^\d.-]/g, "")) || 0
                    : Number(value) || 0;

            if (!hasCountedUp.current && numValue > 0) {
                const formatFn =
                    typeof value === "string" && value.includes("KZT")
                        ? (val) =>
                              `${new Intl.NumberFormat("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                              }).format(val)} KZT`
                        : (val) => Math.floor(val).toLocaleString("en-US");

                const timeoutId = setTimeout(() => {
                    if (metricValueRef.current instanceof HTMLElement && !hasCountedUp.current) {
                        countUp(metricValueRef.current, 0, numValue, {
                            formatFn,
                            duration: 700,
                        });
                        hasCountedUp.current = true;
                    }
                }, 200 + index * 50);

                return () => clearTimeout(timeoutId);
            }

            if (previousValue.current !== value && numValue > 0 && metricValueRef.current instanceof HTMLElement) {
                metricValueRef.current.textContent =
                    typeof value === "string" ? value : numValue.toLocaleString("en-US");
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
                <TitleGroup>
                    {Icon && (
                        <IconBadge>
                            <Icon />
                        </IconBadge>
                    )}
                    <CardTitle>
                        {title}
                        {showLockIcon && <LockIcon title="Locked - cannot be moved between zones">Locked</LockIcon>}
                    </CardTitle>
                </TitleGroup>
                {badge && <Badge $variant={badge.variant || "default"}>{badge.text}</Badge>}
                {showDragHandle && (
                    <DragHandleIcon {...(dragHandleProps || {})} title="Drag to reorder">
                        ::
                    </DragHandleIcon>
                )}
            </CardHeader>

            <CardContent $type={type}>
                {type === "metric" && value !== undefined && <MetricValue ref={metricValueRef}>{value}</MetricValue>}
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
