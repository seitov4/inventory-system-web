import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { usePage } from "../../context/PageContext";
import { useAuth } from "../../context/AuthContext";
import notificationsApi from "../../api/notificationsApi";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

// ===== STYLED COMPONENTS =====
const HeaderWrapper = styled.header`
    position: sticky;
    top: 0;
    z-index: 1000;
    min-height: 68px;
    background: var(--bg-header);
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 8px 28px rgba(15, 23, 42, 0.045);
    backdrop-filter: blur(16px);
`;

const HeaderInner = styled.div`
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 28px;
    min-height: 68px;
    display: grid;
    grid-template-columns: minmax(210px, auto) minmax(240px, 1fr) auto;
    align-items: center;
    gap: 22px;

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
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: 0;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;

    &:hover {
        color: var(--primary-color);
    }

    @media (max-width: 430px) {
        span:last-child {
            display: none;
        }
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

const LogoMark = styled.span`
    width: 32px;
    height: 32px;
    border-radius: 12px;
    background: var(--accent-gradient);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    box-shadow: 0 12px 24px rgba(22, 141, 255, 0.22);
`;

const SearchForm = styled.form`
    width: min(100%, 420px);
    position: relative;
`;

const SearchIconWrap = styled.span`
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    display: inline-flex;

    svg {
        width: 18px;
        height: 18px;
    }
`;

const SearchInput = styled.input`
    width: 100%;
    padding: 11px 14px 11px 40px;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    font-size: 13px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.035);
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;

    &::placeholder {
        color: var(--text-tertiary);
    }

    &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 4px rgba(22, 141, 255, 0.12);
    }
`;

// Right block: User Info
const UserBlock = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;

    @media (max-width: 768px) {
        gap: 8px;
        justify-content: flex-end;
    }
`;

const UserInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px 6px 8px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 18px;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);

    @media (max-width: 640px) {
        display: none;
    }
`;

const UserIcon = styled.div`
    width: 32px;
    height: 32px;
    border-radius: 12px;
    background: var(--accent-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
`;

const UserDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const UserName = styled.span`
    font-size: 14px;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.2;
`;

const UserRole = styled.span`
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.2;
`;

const ActionButton = styled.button`
    padding: 10px 13px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.18s ease;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.035);

    svg {
        width: 17px;
        height: 17px;
    }

    &:hover {
        background: var(--bg-hover);
        border-color: var(--border-color);
        color: var(--text-primary);
        transform: translateY(-1px);
    }

    @media (max-width: 640px) {
        padding: 9px 10px;
        font-size: 13px;

        span {
            display: none;
        }
    }
`;

const BtnLogin = styled(ActionButton)`
    background: var(--accent-gradient);
    color: white;
    border-color: transparent;

    &:hover {
        border-color: transparent;
        color: #ffffff;
        box-shadow: 0 14px 28px rgba(22, 141, 255, 0.22);
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
    padding: 10px 14px;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    cursor: pointer;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-primary);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.035);
    transition: all 0.18s ease;

    svg {
        width: 18px;
        height: 18px;
        color: var(--primary-color);
    }

    &:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
        transform: translateY(-1px);
    }

    @media (max-width: 560px) {
        padding: 9px 10px;

        span {
            display: none;
        }
    }
`;

const Badge = styled.span`
    position: absolute;
    top: -6px;
    right: -5px;
    min-width: 18px;
    height: 18px;
    border-radius: var(--radius-pill);
    background: var(--error-color);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid #ffffff;
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
                    (n) => n.status === "UNREAD" || n.status === "NEW" || n.is_read === false
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
                    <Logo
                        type="button"
                        aria-label="Open landing page"
                        onClick={() => setActivePage("landing")}
                    >
                        <LogoMark>IX</LogoMark>
                        <span>Inventory System</span>
                    </Logo>
                </LogoBlock>

                {/* Center: global search only (main navigation in sidebar) */}
                {isAuthenticated && (
                    <NavBlock>
                        <SearchForm onSubmit={handleGlobalSearch}>
                            <SearchIconWrap aria-hidden="true">
                                <SearchOutlinedIcon />
                            </SearchIconWrap>
                            <SearchInput
                                type="search"
                                placeholder="Search products by name, SKU or barcode"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />
                        </SearchForm>
                    </NavBlock>
                )}

                {/* Right: User Info */}
                <UserBlock>
                    {isAuthenticated ? (
                        <>
                            <NotificationsButton onClick={() => setActivePage("notifications")}>
                                <NotificationsNoneOutlinedIcon />
                                <span>Alerts</span>
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
                                <SettingsOutlinedIcon />
                                <span>Settings</span>
                            </ActionButton>
                            <BtnLogout
                                onClick={() => {
                                    logout();
                                    setActivePage("login");
                                }}
                            >
                                <LogoutOutlinedIcon />
                                <span>Logout</span>
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
