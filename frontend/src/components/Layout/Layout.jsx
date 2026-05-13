import React from "react";
import styled from "styled-components";

// ===== STYLED COMPONENTS =====
const LayoutWrapper = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 100%;
`;

const LayoutHeader = styled.div`
    padding: 18px 24px 12px;
    border-bottom: 1px solid var(--border-color-subtle);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(244, 245, 250, 0));
`;

const LayoutTitle = styled.h1`
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0;
`;

const LayoutContent = styled.div`
    padding: 18px 24px 26px;
    flex: 1;
    background: transparent;

    @media (max-width: 720px) {
        padding: 16px;
    }
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

