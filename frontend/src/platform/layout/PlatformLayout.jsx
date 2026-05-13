import React from "react";
import styled from "styled-components";
import PlatformSidebar from "./PlatformSidebar.jsx";
import PlatformHeader from "./PlatformHeader.jsx";
import PlatformContent from "./PlatformContent.jsx";

const Root = styled.div`
    display: flex;
    min-height: 100vh;
    background: #F6F7F9;
    color: #111827;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const SidebarWrapper = styled.div`
    width: 260px;
    background: #FFFFFF;
    border-right: 1px solid #E5E7EB;

    @media (max-width: 900px) {
        display: none;
    }
`;

const Main = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #F6F7F9;
`;

const HeaderWrapper = styled.div`
    flex-shrink: 0;
`;

const ContentWrapper = styled.div`
    flex: 1;
    padding: 16px 20px 20px;
    background: #F6F7F9;
    overflow: auto;
`;

export default function PlatformLayout({ activeSection, onNavigate, children }) {
    return (
        <Root>
            <SidebarWrapper>
                <PlatformSidebar
                    activeSection={activeSection}
                    onNavigate={onNavigate}
                />
            </SidebarWrapper>
            <Main>
                <HeaderWrapper>
                    <PlatformHeader
                        activeSection={activeSection}
                        onNavigate={onNavigate}
                    />
                </HeaderWrapper>
                <ContentWrapper>
                    <PlatformContent>
                        {children}
                    </PlatformContent>
                </ContentWrapper>
            </Main>
        </Root>
    );
}


