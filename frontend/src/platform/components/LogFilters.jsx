import React from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border-radius: 8px;
    border: 1px solid #dbe3ef;
    background: #ffffff;
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
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const Options = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

const FilterButton = styled.button`
    border-radius: 8px;
    border: 1px solid ${(props) => (props.$active ? "#2563eb" : "#cbd5e1")};
    background: ${(props) => (props.$active ? "#2563eb" : "#ffffff")};
    color: ${(props) => (props.$active ? "#ffffff" : "#334155")};
    font-size: 12px;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
        background: ${(props) => (props.$active ? "#1d4ed8" : "#eff6ff")};
        color: ${(props) => (props.$active ? "#ffffff" : "#1d4ed8")};
        border-color: #93c5fd;
    }
`;

const Actions = styled.div`
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
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

