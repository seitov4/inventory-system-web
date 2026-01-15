import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { usePage } from "../../context/PageContext";
import { useAuth } from "../../context/AuthContext";
import notificationsApi from "../../api/notificationsApi";

// ===== STYLED COMPONENTS =====
const HeaderWrapper = styled.header`
    position: sticky;
    top: 0;
    z-index: 1000;
    height: 64px;
    background: var(--bg-header);
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(8px);
    position: relative;
    
    /* Subtle cool blue tint */
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--tint-blue);
        pointer-events: none;
        z-index: 0;
    }
    
    /* Subtle top highlight */
    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(88, 166, 255, 0.2), transparent);
        z-index: 1;
    }
    
    /* Ensure content is above tint */
    > * {
        position: relative;
        z-index: 1;
    }
`;

const HeaderInner = styled.div`
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    height: 100%;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 32px;

    @media (max-width: 768px) {
        grid-template-columns: auto 1fr;
        gap: 16px;
        padding: 0 16px;
    }
`;

// Left block: Logo / Title
const LogoBlock = styled.div`
    display: flex;
    align-items: center;
`;

const Logo = styled.button`
    font-size: 22px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;

    &:hover {
        opacity: 0.8;
    }
`;

// Center block: Global search (navigation handled by sidebar)
const NavBlock = styled.nav`
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: center;

    @media (max-width: 768px) {
        display: none;
    }
`;

// Right block: User Info
const UserBlock = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;

    @media (max-width: 768px) {
        gap: 8px;
    }
`;

const UserInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    background: var(--bg-tertiary);
    border-radius: 8px;

    @media (max-width: 640px) {
        display: none;
    }
`;

const UserIcon = styled.div`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--primary-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
`;

const UserDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const UserName = styled.span`
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    line-height: 1.2;
`;

const UserRole = styled.span`
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.2;
`;

const ActionButton = styled.button`
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;

    &:hover {
        background: var(--bg-hover);
        border-color: var(--border-color);
    }

    @media (max-width: 640px) {
        padding: 8px 12px;
        font-size: 13px;
    }
`;

const BtnLogin = styled(ActionButton)`
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);

    &:hover {
        background: var(--primary-hover);
        border-color: var(--primary-hover);
    }
`;

const BtnLogout = styled(ActionButton)`
    color: var(--error-color);

    &:hover {
        background: var(--error-bg);
        border-color: var(--error-color);
    }
`;

const NotificationsButton = styled.button`
    position: relative;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid var(--border-color);
    background: var(--bg-tertiary);
    cursor: pointer;
    font-size: 14px;
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &:hover {
        background: var(--bg-hover);
    }
`;

const BellIcon = styled.span`
    font-size: 16px;
`;

const Badge = styled.span`
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--error-color);
    color: #fff;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
`;

// ===== COMPONENT =====
export default function Header() {
    const { setActivePage } = usePage();
    const { user, isAuthenticated, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchValue, setSearchValue] = useState("");

    // Load unread notifications count
    useEffect(() => {
        let cancelled = false;
        async function loadNotifications() {
            if (!isAuthenticated) {
                setUnreadCount(0);
                return;
            }
            try {
                const data = await notificationsApi.getAll();
                if (cancelled) return;
                const list = Array.isArray(data) ? data : [];
                const count = list.filter(
                    (n) => n.status === "UNREAD" || n.is_read === false
                ).length;
                setUnreadCount(count);
            } catch (e) {
                console.error("[Header] Failed to load notifications", e);
            }
        }
        loadNotifications();

        const interval = setInterval(loadNotifications, 60000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [isAuthenticated]);

    const handleGlobalSearch = (e) => {
        e.preventDefault();
        const q = searchValue.trim();
        if (!q) return;
        // Simple strategy: jump to products section, refine search inside.
        sessionStorage.setItem("globalSearchQuery", q);
        setActivePage("products");
    };

    const getRoleLabel = (roleValue) => {
        const labels = {
            owner: "Owner",
            admin: "Administrator",
            manager: "Manager",
            cashier: "Cashier",
        };
        return labels[roleValue] || roleValue;
    };

    const getUserDisplayName = () => {
        if (!user) return "User";
        if (user.first_name || user.last_name) {
            return `${user.first_name || ""} ${user.last_name || ""}`.trim();
        }
        if (user.email) return user.email;
        if (user.phone) return user.phone;
        return "User";
    };

    const getUserInitials = () => {
        if (!user) return "U";
        const name = getUserDisplayName();
        if (name.includes("@")) return name[0].toUpperCase();
        const parts = name.trim().split(" ");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    return (
        <HeaderWrapper>
            <HeaderInner>
                {/* Left: Logo / Title */}
                <LogoBlock>
                    <Logo onClick={() => setActivePage(isAuthenticated ? "dashboard" : "landing")}>
                        Inventory System
                    </Logo>
                </LogoBlock>

                {/* Center: global search only (main navigation in sidebar) */}
                {isAuthenticated && (
                    <NavBlock>
                        <form onSubmit={handleGlobalSearch} style={{ marginLeft: 8 }}>
                            <input
                                type="search"
                                placeholder="Search (products, receipts, movements)"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                style={{
                                    padding: "6px 12px",
                                    borderRadius: 6,
                                    border: "1px solid var(--border-color-light)",
                                    fontSize: 13,
                                    minWidth: 200,
                                    background: "var(--bg-primary)",
                                    color: "var(--text-primary)",
                                    transition: "all 0.15s ease",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "var(--primary-color)";
                                    e.target.style.background = "var(--bg-secondary)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "var(--border-color-light)";
                                    e.target.style.background = "var(--bg-primary)";
                                }}
                            />
                        </form>
                    </NavBlock>
                )}

                {/* Right: User Info */}
                <UserBlock>
                    {isAuthenticated ? (
                        <>
                            <NotificationsButton onClick={() => setActivePage("notifications")}>
                                <BellIcon>🔔</BellIcon>
                                {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
                            </NotificationsButton>
                            {user && (
                                <UserInfo>
                                    <UserIcon>{getUserInitials()}</UserIcon>
                                    <UserDetails>
                                        <UserName>{getUserDisplayName()}</UserName>
                                        {user.role && (
                                            <UserRole>{getRoleLabel(user.role)}</UserRole>
                                        )}
                                    </UserDetails>
                                </UserInfo>
                            )}
                            <ActionButton onClick={() => setActivePage("settings")}>
                                Settings
                            </ActionButton>
                            <BtnLogout
                                onClick={() => {
                                    logout();
                                    setActivePage("login");
                                }}
                            >
                                Logout
                            </BtnLogout>
                        </>
                    ) : (
                        <>
                            <ActionButton onClick={() => setActivePage("register")}>
                                Register
                            </ActionButton>
                            <BtnLogin onClick={() => setActivePage("login")}>Login</BtnLogin>
                        </>
                    )}
                </UserBlock>
            </HeaderInner>
        </HeaderWrapper>
    );
}

