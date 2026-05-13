import React from "react";
import styled from "styled-components";
import Badge from "../ui/Badge.jsx";

const SidebarInner = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 18px 14px 14px;
`;

const Brand = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 18px;
`;

const BrandMark = styled.div`
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #EFF6FF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #2563EB;
    margin-right: 10px;
`;

const BrandTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #111827;
`;

const BrandSubtitle = styled.div`
    font-size: 11px;
    color: #6b7280;
`;

const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
`;

const NavGroupLabel = styled.div`
    margin: 10px 0 4px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
`;

const NavItem = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 8px;
    font-size: 13px;
    color: ${(props) => (props.$active ? "#2563EB" : "#4B5563")};
    background: ${(props) => (props.$active ? "#EFF6FF" : "transparent")};
    border: none;
    cursor: pointer;
    transition: 0.15s ease;
    position: relative;
    width: 100%;
    text-align: left;

    &:hover {
        background: ${(props) => (props.$active ? "#EFF6FF" : "#F1F5F9")};
    }
`;

const NavIcon = styled.span`
    font-size: 10px;
    font-weight: 800;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: #F1F5F9;
    color: #6B7280;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const NavText = styled.span`
    flex: 1;
`;

const Footer = styled.div`
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid #E5E7EB;
    font-size: 11px;
    color: #6b7280;
`;

const Version = styled.div`
    margin-top: 4px;
`;

const navItems = [
    {
        key: "dashboard",
        label: "Dashboard",
        icon: "DB",
        group: "overview",
    },
    {
        key: "stores",
        label: "Stores",
        icon: "ST",
        group: "core",
    },
    {
        key: "store-create",
        label: "Create store",
        icon: "CR",
        group: "core",
    },
    {
        key: "monitoring",
        label: "Monitoring",
        icon: "MO",
        group: "ops",
    },
    {
        key: "logs",
        label: "Logs",
        icon: "LG",
        group: "ops",
    },
    {
        key: "settings",
        label: "Settings",
        icon: "SE",
        group: "ops",
    },
];

export default function PlatformSidebar({ activeSection, onNavigate }) {
    const grouped = {
        overview: navItems.filter((i) => i.group === "overview"),
        core: navItems.filter((i) => i.group === "core"),
        ops: navItems.filter((i) => i.group === "ops"),
    };

    return (
        <SidebarInner>
            <Brand>
                <BrandMark>PF</BrandMark>
                <div>
                    <BrandTitle>Platform Admin</BrandTitle>
                    <BrandSubtitle>Owner panel</BrandSubtitle>
                </div>
            </Brand>

            <Nav>
                <NavGroupLabel>Overview</NavGroupLabel>
                {grouped.overview.map((item) => (
                    <NavItem
                        key={item.key}
                        $active={activeSection === item.key}
                        onClick={() => onNavigate(item.key)}
                    >
                        <NavIcon>{item.icon}</NavIcon>
                        <NavText>{item.label}</NavText>
                    </NavItem>
                ))}

                <NavGroupLabel>Stores</NavGroupLabel>
                {grouped.core.map((item) => (
                    <NavItem
                        key={item.key}
                        $active={activeSection === item.key}
                        onClick={() => onNavigate(item.key)}
                    >
                        <NavIcon>{item.icon}</NavIcon>
                        <NavText>{item.label}</NavText>
                        {item.key === "stores" && (
                            <Badge tone="blue" size="small">
                                multi-tenant
                            </Badge>
                        )}
                    </NavItem>
                ))}

                <NavGroupLabel>Operations</NavGroupLabel>
                {grouped.ops.map((item) => (
                    <NavItem
                        key={item.key}
                        $active={activeSection === item.key}
                        onClick={() => onNavigate(item.key)}
                    >
                        <NavIcon>{item.icon}</NavIcon>
                        <NavText>{item.label}</NavText>
                    </NavItem>
                ))}
            </Nav>

            <Footer>
                <div>Inventory Platform · SaaS</div>
                <Version>v0.1 · mock mode</Version>
            </Footer>
        </SidebarInner>
    );
}


