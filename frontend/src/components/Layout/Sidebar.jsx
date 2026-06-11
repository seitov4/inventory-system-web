import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { usePage } from "../../context/PageContext";
import { useAuth } from "../../context/AuthContext";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import MoveToInboxOutlinedIcon from "@mui/icons-material/MoveToInboxOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

const navItems = [
    { key: "dashboard", label: "Dashboard", icon: DashboardOutlinedIcon, roles: ["cashier", "manager", "owner"] },
    { key: "products", label: "Products", icon: Inventory2OutlinedIcon, roles: ["cashier", "manager", "owner"] },
    { key: "warehouse", label: "Warehouse", icon: WarehouseOutlinedIcon, roles: ["manager", "owner"] },
    { key: "stockIn", label: "Stock intake", icon: MoveToInboxOutlinedIcon, roles: ["manager", "owner"] },
    { key: "pos", label: "POS", icon: PointOfSaleOutlinedIcon, roles: ["cashier", "manager", "owner"] },
    { key: "forecast", label: "Forecast", icon: AutoGraphOutlinedIcon, roles: ["owner"] },
    { key: "reports", label: "Reports", icon: DescriptionOutlinedIcon, roles: ["owner"] },
    { key: "movements", label: "Movements", icon: SwapHorizOutlinedIcon, roles: ["manager", "owner"] },
    { key: "notifications", label: "Notifications", icon: NotificationsNoneOutlinedIcon, roles: ["cashier", "manager", "owner"] },
    { key: "addEmployee", label: "Staff", icon: GroupsOutlinedIcon, roles: ["owner"] },
    { key: "settings", label: "Settings", icon: SettingsOutlinedIcon, roles: ["owner"] },
];

const SidebarWrapper = styled.aside`
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    color: var(--text-primary);
    transition: width 0.25s ease;
    width: ${(props) => (props.$collapsed ? "64px" : "240px")};
    position: relative;
    box-shadow: 8px 0 24px rgba(15, 23, 42, 0.035);

    @media (max-width: 720px) {
        display: block;
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
        overflow-x: auto;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }
`;

const SidebarInner = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 18px 14px 14px;

    @media (max-width: 720px) {
        height: auto;
        padding: 10px 12px;
    }
`;

const SidebarSectionTop = styled.div`
    flex: 1;

    @media (max-width: 720px) {
        min-width: max-content;
    }
`;

const SidebarHeader = styled.div`
    display: flex;
    justify-content: ${(props) => (props.$collapsed ? "center" : "space-between")};
    align-items: center;
    margin-bottom: 10px;

    @media (max-width: 720px) {
        display: none;
    }
`;

const SidebarLabel = styled.div`
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
    font-weight: 800;
`;

const ToggleButton = styled.button`
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 14px;
    font-weight: 800;
    padding: 4px 8px;
    transition: all 0.18s ease;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: var(--bg-hover);
        color: var(--primary-color);
    }
`;

const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: 6px;

    @media (max-width: 720px) {
        flex-direction: row;
        gap: 8px;
    }
`;

const NavLink = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 16px;
    font-size: 14px;
    color: ${(props) => (props.$active ? "var(--primary-color)" : "var(--text-secondary)")};
    background: ${(props) => (props.$active ? "var(--accent-gradient-soft)" : "transparent")};
    font-weight: ${(props) => (props.$active ? "800" : "650")};
    border: 1px solid ${(props) => (props.$active ? "rgba(22, 141, 255, 0.14)" : "transparent")};
    cursor: pointer;
    transition: all 0.18s ease;
    position: relative;
    justify-content: ${(props) => (props.$collapsed ? "center" : "flex-start")};
    width: 100%;
    text-align: left;

    @media (max-width: 720px) {
        width: auto;
        min-width: max-content;
        justify-content: flex-start;
    }

    &:hover {
        background: ${(props) => (props.$active ? "var(--accent-gradient-soft)" : "var(--bg-hover)")};
        color: ${(props) => (props.$active ? "var(--primary-color)" : "var(--text-primary)")};
        transform: translateX(1px);
    }
`;

const NavIcon = styled.span`
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 12px;
    background: ${(props) => (props.$active ? "#ffffff" : "transparent")};
    color: ${(props) => (props.$active ? "var(--primary-color)" : "var(--text-tertiary)")};
    box-shadow: ${(props) => (props.$active ? "0 8px 18px rgba(22, 141, 255, 0.12)" : "none")};
    transition: all 0.18s ease;

    svg {
        width: 20px;
        height: 20px;
    }

    ${NavLink}:hover & {
        color: ${(props) => (props.$active ? "var(--primary-color)" : "var(--text-primary)")};
        background: #ffffff;
    }
`;

const NavText = styled.span`
    white-space: nowrap;
    display: ${(props) => (props.$collapsed ? "none" : "block")};

    @media (max-width: 720px) {
        display: block;
    }
`;

const SidebarSectionBottom = styled.div`
    margin-top: 14px;

    @media (max-width: 720px) {
        display: none;
    }
`;

const SidebarFootnote = styled.div`
    font-size: 11px;
    color: var(--text-tertiary);
`;

export default function Sidebar({ onCollapseChange }) {
    const { activePage, setActivePage } = usePage();
    const { role } = useAuth();
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem("sidebarCollapsed");
        return saved === "true";
    });

    useEffect(() => {
        localStorage.setItem("sidebarCollapsed", collapsed.toString());
        onCollapseChange?.(collapsed);
    }, [collapsed, onCollapseChange]);

    return (
        <SidebarWrapper $collapsed={collapsed}>
            <SidebarInner>
                <SidebarSectionTop>
                    <SidebarHeader $collapsed={collapsed}>
                        {!collapsed && <SidebarLabel>Navigation</SidebarLabel>}
                        <ToggleButton
                            onClick={() => setCollapsed((value) => !value)}
                            title={collapsed ? "Expand menu" : "Collapse menu"}
                            type="button"
                        >
                            {collapsed ? ">" : "<"}
                        </ToggleButton>
                    </SidebarHeader>
                    <Nav>
                        {navItems
                            .filter((item) => !item.roles || item.roles.includes(role))
                            .map((item) => {
                                const Icon = item.icon;
                                const active = activePage === item.key;
                                return (
                                    <NavLink
                                        key={item.key}
                                        onClick={() => setActivePage(item.key)}
                                        $active={active}
                                        $collapsed={collapsed}
                                        title={collapsed ? item.label : undefined}
                                        type="button"
                                    >
                                        <NavIcon $active={active}>
                                            <Icon />
                                        </NavIcon>
                                        <NavText $collapsed={collapsed}>{item.label}</NavText>
                                    </NavLink>
                                );
                            })}
                    </Nav>
                </SidebarSectionTop>

                {!collapsed && (
                    <SidebarSectionBottom>
                        <SidebarFootnote>RetailSystem v1.0</SidebarFootnote>
                    </SidebarSectionBottom>
                )}
            </SidebarInner>
        </SidebarWrapper>
    );
}

