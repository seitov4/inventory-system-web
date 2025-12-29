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
    border-radius: 999px;
    background: linear-gradient(135deg, #22c55e, #0ea5e9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    margin-right: 10px;
`;

const BrandTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #e5e7eb;
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
    color: ${(props) => (props.$active ? "#0f172a" : "#e5e7eb")};
    background: ${(props) =>
        props.$active
            ? "linear-gradient(90deg, #0ea5e9, #22c55e)"
            : "transparent"};
    border: none;
    cursor: pointer;
    transition: 0.15s ease;
    position: relative;
    width: 100%;
    text-align: left;

    &:hover {
        background: ${(props) =>
            props.$active ? "linear-gradient(90deg, #0ea5e9, #22c55e)" : "rgba(148, 163, 184, 0.18)"};
    }
`;

const NavIcon = styled.span`
    font-size: 16px;
    width: 22px;
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
    border-top: 1px solid rgba(15, 23, 42, 0.8);
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
        icon: "📊",
        group: "overview",
    },
    {
        key: "stores",
        label: "Stores",
        icon: "🏬",
        group: "core",
    },
    {
        key: "store-create",
        label: "Create store",
        icon: "➕",
        group: "core",
    },
    {
        key: "monitoring",
        label: "Monitoring",
        icon: "🩺",
        group: "ops",
    },
    {
        key: "logs",
        label: "Logs",
        icon: "📜",
        group: "ops",
    },
    {
        key: "settings",
        label: "Settings",
        icon: "⚙️",
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


