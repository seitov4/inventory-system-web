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
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    color: var(--text-primary);
    transition: width 0.3s ease;
    width: ${props => props.$collapsed ? '64px' : '240px'};
    position: relative;
    
    /* Subtle neutral tint for sidebar */
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--tint-neutral);
        pointer-events: none;
        z-index: 0;
    }
    
    /* Subtle right edge highlight */
    &::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 1px;
        background: linear-gradient(180deg, transparent, rgba(88, 166, 255, 0.15), transparent);
        pointer-events: none;
        z-index: 1;
    }
    
    /* Ensure content is above tint */
    > * {
        position: relative;
        z-index: 1;
    }

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
    color: var(--text-tertiary);
`;

const ToggleButton = styled.button`
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
    transition: all 0.2s ease;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: var(--bg-hover);
        border-color: var(--primary-color);
        color: var(--text-primary);
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
    padding: 10px 12px;
    border-radius: 6px;
    font-size: 14px;
    color: var(--text-secondary);
    background: ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
    color: ${props => props.$active ? '#FFFFFF' : 'var(--text-secondary)'};
    font-weight: ${props => props.$active ? '600' : '500'};
    border: none;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
    justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};
    width: 100%;
    text-align: left;
    margin-bottom: 2px;

    /* Active indicator */
    ${props => props.$active && `
        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 60%;
            background: var(--primary-color);
            border-radius: 0 2px 2px 0;
        }
    `}

    &:hover {
        background: ${props => props.$active ? 'var(--primary-hover)' : 'var(--bg-hover)'};
        color: ${props => props.$active ? '#FFFFFF' : 'var(--text-primary)'};
        transform: ${props => props.$active ? 'none' : 'translateX(2px)'};
    }
`;

const NavIcon = styled.span`
    font-size: 18px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    opacity: ${props => props.$active ? '1' : '0.8'};
    transition: opacity 0.15s ease;
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
    color: var(--text-tertiary);
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
                                    <NavIcon $active={activePage === item.key}>{item.icon}</NavIcon>
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
