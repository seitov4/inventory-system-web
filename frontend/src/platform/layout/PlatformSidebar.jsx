import React from "react";
import styled from "styled-components";
import Badge from "../ui/Badge.jsx";

const SidebarInner = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 24px 18px 16px;
`;

const Brand = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 28px;
`;

const BrandMark = styled.div`
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #2563eb;
    margin-right: 10px;
`;

const BrandTitle = styled.div`
    font-size: 16px;
    font-weight: 700;
    color: #111827;
`;

const BrandSubtitle = styled.div`
    font-size: 12px;
    color: #6b7280;
`;

const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
`;

const NavGroupLabel = styled.div`
    margin: 16px 0 4px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
`;

const NavItem = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 12px;
    border-radius: 10px;
    font-size: 15px;
    color: ${(props) => (props.$active ? "#0f4fe6" : "#334155")};
    background: ${(props) => (props.$active ? "#eff6ff" : "transparent")};
    border: none;
    cursor: pointer;
    transition: 0.15s ease;
    position: relative;
    width: 100%;
    text-align: left;

    &:hover {
        background: ${(props) => (props.$active ? "#eff6ff" : "#f1f5f9")};
    }
`;

const NavIcon = styled.span`
    font-size: 10px;
    font-weight: 800;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: ${(props) => (props.$active ? "#dbeafe" : "#f1f5f9")};
    color: ${(props) => (props.$active ? "#1d4ed8" : "#64748b")};
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
    border-top: 1px solid #e5e7eb;
    font-size: 12px;
    color: #64748b;
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
        key: "users",
        label: "Platform admins",
        icon: "US",
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
                        <NavIcon $active={activeSection === item.key}>{item.icon}</NavIcon>
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
                        <NavIcon $active={activeSection === item.key}>{item.icon}</NavIcon>
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
                        <NavIcon $active={activeSection === item.key}>{item.icon}</NavIcon>
                        <NavText>{item.label}</NavText>
                    </NavItem>
                ))}
            </Nav>

            <Footer>
                <div>Inventory Platform - SaaS</div>
                <Version>v0.1</Version>
            </Footer>
        </SidebarInner>
    );
}
