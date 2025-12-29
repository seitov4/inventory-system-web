import React from "react";
import styled from "styled-components";

const Container = styled.div`
    margin-bottom: 20px;
`;

const Title = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #e5e7eb;
    margin-bottom: 8px;
`;

const Description = styled.div`
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 14px;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;

    @media (max-width: 800px) {
        grid-template-columns: 1fr;
    }
`;

/**
 * MetricGroup Component
 * 
 * Container for a group of related metrics.
 * Provides title, description, and responsive grid layout.
 */
export default function MetricGroup({ title, description, children }) {
    return (
        <Container>
            {title && <Title>{title}</Title>}
            {description && <Description>{description}</Description>}
            <Grid>{children}</Grid>
        </Container>
    );
}

