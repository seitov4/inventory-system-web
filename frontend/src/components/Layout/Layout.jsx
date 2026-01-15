import React from "react";
import styled from "styled-components";

// ===== STYLED COMPONENTS =====
const LayoutWrapper = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100%;
`;

const LayoutHeader = styled.div`
    padding: 18px 20px 12px;
    border-bottom: 1px solid var(--border-color-subtle);
    background: transparent;
`;

const LayoutTitle = styled.h1`
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
`;

const LayoutContent = styled.div`
    padding: 18px 20px 24px;
    flex: 1;
    background: transparent;
`;

// ===== COMPONENT =====
export default function Layout({ title, children }) {
    return (
        <LayoutWrapper>
            {title && (
                <LayoutHeader>
                    <LayoutTitle>{title}</LayoutTitle>
                </LayoutHeader>
            )}
            <LayoutContent>{children}</LayoutContent>
        </LayoutWrapper>
    );
}

