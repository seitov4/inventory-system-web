/**
 * DashboardZone - Individual zone component for dashboard
 * Handles drag and drop within and between zones
 */

import React from 'react';
import styled from 'styled-components';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DashboardCard from '../../components/UI/DashboardCard';

const ZoneContainer = styled.div`
    margin-bottom: 24px;
    min-height: ${props => props.$minHeight || '120px'};
    padding: 16px;
    border-radius: 12px;
    background: ${props => {
        if (props.$isDraggingOver && props.$isValidDrop) {
            return 'rgba(80, 140, 255, 0.08)';
        }
        if (props.$isDraggingOver && !props.$isValidDrop) {
            return 'rgba(248, 81, 73, 0.05)';
        }
        return 'transparent';
    }};
    border: 2px dashed ${props => {
        if (props.$isDraggingOver && props.$isValidDrop) {
            return 'rgba(80, 140, 255, 0.4)';
        }
        if (props.$isDraggingOver && !props.$isValidDrop) {
            return 'rgba(248, 81, 73, 0.3)';
        }
        return 'transparent';
    }};
    transition: all 0.2s ease;
`;

const ZoneTitle = styled.h3`
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const ZoneGrid = styled.div`
    display: grid;
    grid-template-columns: ${props => {
        if (props.$zone === 'kpi') return 'repeat(4, 1fr)';
        if (props.$zone === 'wide') return '1fr';
        if (props.$zone === 'info') return 'repeat(3, 1fr)';
        return '1fr';
    }};
    gap: 16px;
    
    @media (max-width: 1200px) {
        grid-template-columns: ${props => {
            if (props.$zone === 'kpi') return 'repeat(2, 1fr)';
            if (props.$zone === 'info') return 'repeat(2, 1fr)';
            return '1fr';
        }};
    }
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const SortableWidget = styled.div`
    opacity: ${props => props.$isDragging ? 0.5 : 1};
    transition: opacity 0.2s ease;
`;

/**
 * Sortable Widget Item
 */
function SortableWidgetItem({ widget, renderWidget, index, editMode }) {
    // ABOUT zone widgets are always locked
    const isAboutZone = widget.zone === 'about';
    const isLockedToZone = widget.allowedZones?.length === 1 && widget.allowedZones[0] === widget.zone;
    const isFullyLocked = isAboutZone || (!editMode);
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: widget.id,
        disabled: isFullyLocked || !editMode,
    });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms ease',
    };
    
    return (
        <SortableWidget ref={setNodeRef} style={style} $isDragging={isDragging}>
            <DashboardCard
                title={widget.title}
                badge={widget.badge}
                type={widget.type}
                value={widget.value}
                description={widget.description}
                size={widget.size}
                tint={widget.tint}
                onClick={widget.onClick}
                animateCountUp={widget.animateCountUp}
                draggable={editMode && !isFullyLocked}
                isStatic={isLockedToZone}
                showLockIcon={editMode && isLockedToZone}
                showDragHandle={editMode && !isFullyLocked}
                dragHandleProps={editMode && !isFullyLocked ? { ...attributes, ...listeners } : null}
            >
                {renderWidget(widget)}
            </DashboardCard>
        </SortableWidget>
    );
}

/**
 * Dashboard Zone Component
 */
export default function DashboardZone({
    zone,
    widgets,
    renderWidget,
    editMode = false,
    isDraggingOver = false,
    isValidDrop = false,
    minHeight,
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: zone,
        disabled: !editMode,
    });
    
    const widgetIds = widgets.map(w => w.id);
    const sortStrategy = zone === 'kpi' ? horizontalListSortingStrategy : verticalListSortingStrategy;
    
    // Use isOver from useDroppable or provided prop (only in edit mode)
    const draggingOver = editMode && (isDraggingOver || isOver);
    
    return (
        <ZoneContainer
            ref={setNodeRef}
            $isDraggingOver={draggingOver}
            $isValidDrop={isValidDrop}
            $minHeight={minHeight}
        >
            <ZoneTitle>
                {zone.toUpperCase()} Zone
                {editMode && zone === 'about' && (
                    <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        (Locked)
                    </span>
                )}
            </ZoneTitle>
            {widgetIds.length > 0 ? (
                <SortableContext items={widgetIds} strategy={sortStrategy}>
                    <ZoneGrid $zone={zone}>
                        {widgets.map((widget, index) => (
                            <SortableWidgetItem
                                key={widget.id}
                                widget={widget}
                                renderWidget={renderWidget}
                                index={index}
                                editMode={editMode}
                            />
                        ))}
                    </ZoneGrid>
                </SortableContext>
            ) : (
                editMode && (
                    <ZoneGrid $zone={zone}>
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                            {draggingOver ? (isValidDrop ? 'Drop here' : 'Invalid drop zone') : 'Drop widgets here'}
                        </div>
                    </ZoneGrid>
                )
            )}
        </ZoneContainer>
    );
}

