import React from "react";
import styled from "styled-components";

// ===== STYLED COMPONENTS =====
const FooterWrapper = styled.footer`
    margin-top: auto;
    height: 56px;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
`;

const FooterInner = styled.div`
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 13px;
    color: var(--text-secondary);

    @media (max-width: 640px) {
        flex-direction: column;
        padding: 12px 16px;
        height: auto;
        gap: 4px;
        font-size: 12px;
    }
`;

const FooterText = styled.span`
    color: var(--text-secondary);
`;

const FooterSeparator = styled.span`
    color: var(--text-tertiary);
    margin: 0 4px;

    @media (max-width: 640px) {
        display: none;
    }
`;

const FooterProjectName = styled.span`
    font-weight: 600;
    color: var(--text-primary);
`;

const FooterYear = styled.span`
    color: var(--text-secondary);
`;

// ===== COMPONENT =====
export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <FooterWrapper>
            <FooterInner>
                <FooterText>Diploma project</FooterText>
                <FooterSeparator>•</FooterSeparator>
                <FooterProjectName>Inventory Management System</FooterProjectName>
                <FooterSeparator>•</FooterSeparator>
                <FooterYear>© {currentYear}</FooterYear>
            </FooterInner>
        </FooterWrapper>
    );
}

