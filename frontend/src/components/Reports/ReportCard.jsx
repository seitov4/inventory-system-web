import React, { useState } from "react";
import styled from "styled-components";

// ===== STYLED COMPONENTS =====
const CardWrapper = styled.div`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 24px;
    transition: all 0.2s ease;
    cursor: ${props => props.$enabled ? 'pointer' : 'not-allowed'};
    opacity: ${props => props.$enabled ? 1 : 0.5};
    position: relative;

    ${props => props.$enabled && `
        &:hover {
            border-color: var(--primary-color);
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }
    `}
`;

const LockOverlay = styled.div`
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--warning-bg);
    color: var(--warning-color);
    font-size: 11px;
    font-weight: 600;
`;

const LockIcon = styled.span`
    font-size: 12px;
`;

const Tooltip = styled.div`
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
    box-shadow: var(--shadow-md);
    z-index: 10;
    opacity: ${props => props.$visible ? 1 : 0};
    visibility: ${props => props.$visible ? 'visible' : 'hidden'};
    transition: opacity 0.2s, visibility 0.2s;
    max-width: 280px;
    white-space: normal;
    text-align: center;

    &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 6px solid transparent;
        border-top-color: var(--border-color);
    }
`;

const ReportIcon = styled.div`
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--primary-light);
    color: var(--primary-color);
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 16px;
`;

const ReportTitle = styled.h3`
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 8px;
`;

const ReportDescription = styled.p`
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0 0 16px;
    line-height: 1.5;
`;

const ReportFormats = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
`;

const FormatBadge = styled.span`
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: ${props => props.$enabled ? 'var(--primary-light)' : 'var(--bg-tertiary)'};
    color: ${props => props.$enabled ? 'var(--primary-color)' : 'var(--text-tertiary)'};
    opacity: ${props => props.$enabled ? 1 : 0.6};
`;

const CardActions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
`;

const ActionButton = styled.button`
    border: 1px solid var(--primary-color);
    background: var(--primary-color);
    color: white;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    min-height: 34px;

    &:hover:not(:disabled) {
        background: var(--primary-hover);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
`;

// ===== COMPONENT =====
export default function ReportCard({ 
    icon, 
    title, 
    description, 
    formats = [], 
    enabled = false,
    onClick,
    actions = [],
}) {
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClick = () => {
        if (enabled && onClick) {
            onClick();
        }
    };

    const handleMouseEnter = () => {
        if (!enabled) {
            setShowTooltip(true);
        }
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
    };

    const normalizedFormats = formats.map((format) => (
        typeof format === "string"
            ? { label: format, disabled: false }
            : { label: format.label, disabled: Boolean(format.disabled) }
    ));

    return (
        <CardWrapper 
            $enabled={enabled}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {!enabled && (
                <>
                    <LockOverlay>
                        <LockIcon>🔒</LockIcon>
                        Coming Soon
                    </LockOverlay>
                    <Tooltip $visible={showTooltip}>
                        This report will be available after analytics logic is implemented
                    </Tooltip>
                </>
            )}
            
            <ReportIcon>{icon}</ReportIcon>
            <ReportTitle>{title}</ReportTitle>
            <ReportDescription>{description}</ReportDescription>
            <ReportFormats>
                {normalizedFormats.map(format => (
                    <FormatBadge key={format.label} $enabled={enabled && !format.disabled}>
                        {format.label}
                    </FormatBadge>
                ))}
            </ReportFormats>
            {enabled && actions.length > 0 && (
                <CardActions>
                    {actions.map((action) => (
                        <ActionButton
                            key={action.label}
                            type="button"
                            disabled={action.disabled}
                            onClick={(event) => {
                                event.stopPropagation();
                                action.onClick?.();
                            }}
                        >
                            {action.label}
                        </ActionButton>
                    ))}
                </CardActions>
            )}
        </CardWrapper>
    );
}

