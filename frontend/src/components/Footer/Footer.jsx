import React from "react";
import styled from "styled-components";

const FooterWrapper = styled.footer`
    margin-top: auto;
    height: 52px;
    background: rgba(255, 255, 255, 0.74);
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

const FooterSeparator = styled.span`
    color: var(--text-tertiary);
    margin: 0 4px;

    @media (max-width: 640px) {
        display: none;
    }
`;

const FooterProjectName = styled.span`
    font-weight: 700;
    color: var(--text-primary);
`;

const FooterYear = styled.span`
    color: var(--text-secondary);
`;

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <FooterWrapper>
            <FooterInner>
                <FooterProjectName>Inventory Management System</FooterProjectName>
                <FooterSeparator>|</FooterSeparator>
                <FooterYear>(c) {currentYear}</FooterYear>
            </FooterInner>
        </FooterWrapper>
    );
}
