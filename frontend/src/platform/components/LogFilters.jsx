import React from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border-radius: 12px;
    border: 1px solid rgba(31, 41, 55, 0.9);
    background: rgba(15, 23, 42, 0.98);
    margin-bottom: 14px;
`;

const FilterGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const Label = styled.label`
    font-size: 12px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const Options = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

const FilterButton = styled.button`
    border-radius: 6px;
    border: 1px solid
        ${(props) =>
            props.$active ? "rgba(59, 130, 246, 0.8)" : "rgba(55, 65, 81, 0.9)"};
    background: ${(props) =>
        props.$active ? "rgba(30, 64, 175, 0.7)" : "rgba(15, 23, 42, 0.9)"};
    color: ${(props) => (props.$active ? "#e5e7eb" : "#9ca3af")};
    font-size: 12px;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: rgba(30, 64, 175, 0.8);
        color: #e5e7eb;
        border-color: rgba(59, 130, 246, 0.9);
    }
`;

const Actions = styled.div`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 8px;
    border-top: 1px solid rgba(31, 41, 55, 0.5);
`;

/**
 * LogFilters Component
 * 
 * Filter controls for platform logs.
 * Updates hook state only - no direct API calls.
 */
export default function LogFilters({ filters, onFilterChange, onClearFilters }) {
    const severityOptions = [
        { value: "all", label: "All" },
        { value: "info", label: "Info" },
        { value: "warn", label: "Warning" },
        { value: "error", label: "Error" },
    ];

    const sourceOptions = [
        { value: "all", label: "All Sources" },
        { value: "platform-auth", label: "Platform Auth" },
        { value: "api", label: "API" },
        { value: "db", label: "Database" },
        { value: "worker", label: "Worker" },
        { value: "scheduler", label: "Scheduler" },
    ];

    const environmentOptions = [
        { value: "all", label: "All Environments" },
        { value: "production", label: "Production" },
        { value: "staging", label: "Staging" },
        { value: "local", label: "Local" },
    ];

    const hasActiveFilters =
        filters.severity !== "all" ||
        filters.source !== "all" ||
        filters.environment !== "all";

    return (
        <Container>
            <FilterGroup>
                <Label>Severity</Label>
                <Options>
                    {severityOptions.map((option) => (
                        <FilterButton
                            key={option.value}
                            type="button"
                            $active={filters.severity === option.value}
                            onClick={() => onFilterChange("severity", option.value)}
                        >
                            {option.label}
                        </FilterButton>
                    ))}
                </Options>
            </FilterGroup>

            <FilterGroup>
                <Label>Source</Label>
                <Options>
                    {sourceOptions.map((option) => (
                        <FilterButton
                            key={option.value}
                            type="button"
                            $active={filters.source === option.value}
                            onClick={() => onFilterChange("source", option.value)}
                        >
                            {option.label}
                        </FilterButton>
                    ))}
                </Options>
            </FilterGroup>

            <FilterGroup>
                <Label>Environment</Label>
                <Options>
                    {environmentOptions.map((option) => (
                        <FilterButton
                            key={option.value}
                            type="button"
                            $active={filters.environment === option.value}
                            onClick={() => onFilterChange("environment", option.value)}
                        >
                            {option.label}
                        </FilterButton>
                    ))}
                </Options>
            </FilterGroup>

            {hasActiveFilters && (
                <Actions>
                    <Button tone="ghost" size="small" onClick={onClearFilters}>
                        Clear filters
                    </Button>
                </Actions>
            )}
        </Container>
    );
}

