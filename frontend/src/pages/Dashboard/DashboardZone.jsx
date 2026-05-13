import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
    horizontalListSortingStrategy,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styled from "styled-components";
import DashboardCard from "../../components/UI/DashboardCard";

const zoneLabels = {
    kpi: "Performance",
    wide: "Sales overview",
    info: "Operational shortcuts",
    about: "System context",
};

const ZoneContainer = styled.div`
    margin-bottom: ${(props) => (props.$layout === "paired" ? "0" : "16px")};
    min-height: ${(props) => props.$minHeight || "120px"};
    padding: ${(props) => (props.$layout === "paired" ? "16px" : "0")};
    border-radius: ${(props) => (props.$layout === "paired" ? "var(--radius-xl)" : "0")};
    background: ${(props) => {
        if (props.$isDraggingOver && props.$isValidDrop) return "var(--primary-light)";
        if (props.$isDraggingOver && !props.$isValidDrop) return "var(--error-bg)";
        if (props.$layout === "paired") return "var(--bg-secondary)";
        return "transparent";
    }};
    border: ${(props) => {
        if (props.$isDraggingOver && props.$isValidDrop) return "2px dashed var(--primary-color)";
        if (props.$isDraggingOver && !props.$isValidDrop) return "2px dashed var(--error-color)";
        if (props.$layout === "paired") return "1px solid var(--border-color)";
        return "0";
    }};
    box-shadow: ${(props) => (props.$layout === "paired" ? "var(--shadow-card)" : "none")};
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    @media (max-width: 1199px) {
        min-height: ${(props) => (props.$layout === "paired" ? "auto" : props.$minHeight || "120px")};
    }
`;

const ZoneTitle = styled.h3`
    font-size: 12px;
    font-weight: 900;
    color: var(--text-tertiary);
    margin: 0 0 ${(props) => (props.$layout === "paired" ? "12px" : "10px")} 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
`;

const ZoneGrid = styled.div`
    display: grid;
    grid-template-columns: ${(props) => {
        if (props.$zone === "kpi" && props.$layout === "paired") return "repeat(2, minmax(0, 1fr))";
        if (props.$zone === "kpi") return "repeat(4, 1fr)";
        if (props.$zone === "wide") return "1fr";
        if (props.$zone === "info") return "repeat(3, 1fr)";
        return "1fr";
    }};
    gap: 12px;
    align-items: stretch;
    flex: ${(props) => (props.$layout === "paired" ? "1" : "initial")};
    min-height: 0;
    grid-auto-rows: ${(props) =>
        props.$layout === "paired" ? "minmax(150px, 1fr)" : "auto"};

    @media (max-width: 1200px) {
        grid-template-columns: ${(props) => {
            if (props.$zone === "kpi") return "repeat(2, 1fr)";
            if (props.$zone === "info") return "repeat(2, 1fr)";
            return "1fr";
        }};
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
    }
`;

const SortableWidget = styled.div`
    opacity: ${(props) => (props.$isDragging ? 0.5 : 1)};
    transition: opacity 0.2s ease;
    min-height: 0;
    height: ${(props) => (props.$layout === "paired" ? "100%" : "auto")};
`;

const DropHint = styled.div`
    padding: 20px;
    text-align: center;
    color: var(--text-tertiary);
    font-size: 12px;
`;

function SortableWidgetItem({ widget, renderWidget, editMode, layout, zone }) {
    const isAboutZone = widget.zone === "about";
    const isLockedToZone = widget.allowedZones?.length === 1 && widget.allowedZones[0] === widget.zone;
    const isFullyLocked = isAboutZone || !editMode;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: widget.id,
        disabled: isFullyLocked || !editMode,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 200ms ease",
    };

    const cardSize =
        layout === "paired" && zone === "kpi"
            ? "panelMetric"
            : layout === "paired" && zone === "wide"
              ? "panelChart"
              : widget.size;

    return (
        <SortableWidget ref={setNodeRef} style={style} $isDragging={isDragging} $layout={layout}>
            <DashboardCard
                title={widget.title}
                badge={widget.badge}
                type={widget.type}
                value={widget.value}
                description={widget.description}
                size={cardSize}
                tint={widget.tint}
                icon={widget.icon}
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

export default function DashboardZone({
    zone,
    widgets,
    renderWidget,
    editMode = false,
    isDraggingOver = false,
    isValidDrop = false,
    minHeight,
    layout = "stacked",
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: zone,
        disabled: !editMode,
    });

    const widgetIds = widgets.map((widget) => widget.id);
    const sortStrategy = zone === "kpi" ? horizontalListSortingStrategy : verticalListSortingStrategy;
    const draggingOver = editMode && (isDraggingOver || isOver);

    return (
        <ZoneContainer
            ref={setNodeRef}
            $isDraggingOver={draggingOver}
            $isValidDrop={isValidDrop}
            $minHeight={minHeight}
            $layout={layout}
        >
            <ZoneTitle $layout={layout}>{zoneLabels[zone] || zone}</ZoneTitle>
            {widgetIds.length > 0 ? (
                <SortableContext items={widgetIds} strategy={sortStrategy}>
                    <ZoneGrid $zone={zone} $layout={layout}>
                        {widgets.map((widget) => (
                            <SortableWidgetItem
                                key={widget.id}
                                widget={widget}
                                renderWidget={renderWidget}
                                editMode={editMode}
                                layout={layout}
                                zone={zone}
                            />
                        ))}
                    </ZoneGrid>
                </SortableContext>
            ) : (
                editMode && (
                    <ZoneGrid $zone={zone} $layout={layout}>
                        <DropHint>
                            {draggingOver
                                ? isValidDrop
                                    ? "Drop here"
                                    : "Invalid drop zone"
                                : "Drop widgets here"}
                        </DropHint>
                    </ZoneGrid>
                )
            )}
        </ZoneContainer>
    );
}
