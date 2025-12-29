import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { usePage } from "../../context/PageContext";
import { useAuth } from "../../context/AuthContext";

// ===== NAV ITEMS DATA =====
const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "📊", roles: ["cashier", "manager", "owner", "admin"] },
    { key: "products", label: "Products", icon: "📦", roles: ["cashier", "manager", "owner", "admin"] },
    { key: "warehouse", label: "Warehouse", icon: "🏭", roles: ["manager", "owner", "admin"] },
    { key: "stockIn", label: "Stock intake", icon: "📥", roles: ["manager", "owner", "admin"] },
    { key: "pos", label: "POS", icon: "🛒", roles: ["cashier", "manager", "owner", "admin"] },
    { key: "sales", label: "Analytics", icon: "📈", roles: ["owner", "admin"] },
    { key: "movements", label: "Movements", icon: "📜", roles: ["manager", "owner", "admin"] },
    { key: "notifications", label: "Notifications", icon: "🔔", roles: ["cashier", "manager", "owner", "admin"] },
    { key: "addEmployee", label: "Staff", icon: "👤", roles: ["owner", "admin"] },
    { key: "settings", label: "Settings", icon: "⚙️", roles: ["owner", "admin"] },
];

// ===== STYLED COMPONENTS =====
const SidebarWrapper = styled.aside`
    background: #020617;
    border-right: 1px solid rgba(15, 23, 42, 0.9);
    color: #e5e7eb;
    transition: width 0.3s ease;
    width: ${props => props.$collapsed ? '64px' : '240px'};

    @media (max-width: 720px) {
        display: none;
    }
`;

const SidebarInner = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px 14px 14px;
`;

const SidebarSectionTop = styled.div`
    flex: 1;
`;

const SidebarHeader = styled.div`
    display: flex;
    justify-content: ${props => props.$collapsed ? 'center' : 'space-between'};
    align-items: center;
    margin-bottom: 8px;
`;

const SidebarLabel = styled.div`
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
`;

const ToggleButton = styled.button`
    background: rgba(148, 163, 184, 0.2);
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 6px;
    color: #e5e7eb;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
    transition: background 0.2s ease;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: rgba(148, 163, 184, 0.3);
    }
`;

const Nav = styled.nav`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const NavLink = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 8px;
    font-size: 14px;
    color: #e5e7eb;
    background: ${props => props.$active ? 'linear-gradient(90deg, #0ea5e9, #22c55e)' : 'transparent'};
    color: ${props => props.$active ? '#0f172a' : '#e5e7eb'};
    font-weight: ${props => props.$active ? '600' : '400'};
    border: none;
    cursor: pointer;
    transition: 0.15s ease;
    position: relative;
    justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};
    width: 100%;
    text-align: left;

    &:hover {
        background: ${props => props.$active ? 'linear-gradient(90deg, #0ea5e9, #22c55e)' : 'rgba(148, 163, 184, 0.18)'};
    }
`;

const NavIcon = styled.span`
    font-size: 18px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
`;

const NavText = styled.span`
    white-space: nowrap;
    display: ${props => props.$collapsed ? 'none' : 'block'};
`;

const SidebarSectionBottom = styled.div`
    margin-top: 12px;
`;

const SidebarFootnote = styled.div`
    font-size: 11px;
    color: #6b7280;
`;

// ===== COMPONENT =====
export default function Sidebar({ onCollapseChange }) {
    const { activePage, setActivePage } = usePage();
    const { role } = useAuth();
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem("sidebarCollapsed");
        return saved === "true";
    });

    useEffect(() => {
        localStorage.setItem("sidebarCollapsed", collapsed.toString());
        if (onCollapseChange) {
            onCollapseChange(collapsed);
        }
    }, [collapsed, onCollapseChange]);

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    return (
        <SidebarWrapper $collapsed={collapsed}>
            <SidebarInner>
                <SidebarSectionTop>
                    <SidebarHeader $collapsed={collapsed}>
                        {!collapsed && (
                            <SidebarLabel>Navigation</SidebarLabel>
                        )}
                        <ToggleButton
                            onClick={toggleCollapse}
                            title={collapsed ? "Expand menu" : "Collapse menu"}
                        >
                            {collapsed ? "→" : "←"}
                        </ToggleButton>
                    </SidebarHeader>
                    <Nav>
                        {navItems
                            .filter((item) => !item.roles || item.roles.includes(role))
                            .map((item) => (
                                <NavLink
                                    key={item.key}
                                    onClick={() => setActivePage(item.key)}
                                    $active={activePage === item.key}
                                    $collapsed={collapsed}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <NavIcon>{item.icon}</NavIcon>
                                    <NavText $collapsed={collapsed}>{item.label}</NavText>
                                </NavLink>
                            ))}
                    </Nav>
                </SidebarSectionTop>

                {!collapsed && (
                    <SidebarSectionBottom>
                        <SidebarFootnote>
                            RetailSystem · v1.0
                        </SidebarFootnote>
                    </SidebarSectionBottom>
                )}
            </SidebarInner>
        </SidebarWrapper>
    );
}
