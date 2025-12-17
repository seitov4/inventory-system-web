import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { usePage } from "../../context/PageContext";
import authApi from "../../api/authApi";

// ===== NAVIGATION ITEMS =====
const mainNavItems = [
    { key: "products", label: "Товары" },
    { key: "warehouse", label: "Склад" },
    { key: "pos", label: "POS" },
    { key: "sales", label: "Аналитика" },
    { key: "notifications", label: "Уведомления" },
];

// ===== STYLED COMPONENTS =====
const HeaderWrapper = styled.header`
    position: sticky;
    top: 0;
    z-index: 1000;
    height: 64px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    box-shadow: var(--shadow-sm);
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

// Center block: Navigation
const NavBlock = styled.nav`
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: center;

    @media (max-width: 768px) {
        display: none;
    }
`;

const NavLink = styled.button`
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
    min-height: 40px;
    display: flex;
    align-items: center;

    &:hover {
        color: var(--text-primary);
        background: var(--bg-hover);
    }

    ${props => props.$active && `
        color: var(--primary-color);
        background: var(--bg-hover);
        font-weight: 600;
    `}
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

// ===== COMPONENT =====
export default function Header() {
    const { setActivePage } = usePage();
    const token = localStorage.getItem("token");
    const logged = Boolean(token);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (logged) {
            loadUser();
        }
    }, [logged]);

    const loadUser = async () => {
        try {
            const res = await authApi.me();
            setUser(res?.user || res || null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setActivePage("login");
    };

    const getRoleLabel = (role) => {
        const labels = {
            owner: "Владелец",
            admin: "Администратор",
            manager: "Менеджер",
            cashier: "Кассир",
        };
        return labels[role] || role;
    };

    const getUserDisplayName = () => {
        if (!user) return "Пользователь";
        if (user.first_name || user.last_name) {
            return `${user.first_name || ""} ${user.last_name || ""}`.trim();
        }
        if (user.email) return user.email;
        if (user.phone) return user.phone;
        return "Пользователь";
    };

    const { activePage } = usePage();

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
                    <Logo onClick={() => setActivePage(logged ? "dashboard" : "landing")}>
                        Inventory System
                    </Logo>
                </LogoBlock>

                {/* Center: Navigation */}
                {logged && (
                    <NavBlock>
                        {mainNavItems.map((item) => (
                            <NavLink
                                key={item.key}
                                $active={activePage === item.key}
                                onClick={() => setActivePage(item.key)}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </NavBlock>
                )}

                {/* Right: User Info */}
                <UserBlock>
                    {logged ? (
                        <>
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
                                Настройки
                            </ActionButton>
                            <BtnLogout onClick={handleLogout}>Выйти</BtnLogout>
                        </>
                    ) : (
                        <>
                            <ActionButton onClick={() => setActivePage("register")}>
                                Регистрация
                            </ActionButton>
                            <BtnLogin onClick={() => setActivePage("login")}>Войти</BtnLogin>
                        </>
                    )}
                </UserBlock>
            </HeaderInner>
        </HeaderWrapper>
    );
}

