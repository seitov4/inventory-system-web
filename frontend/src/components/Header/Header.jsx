import React from "react";
import styled from "styled-components";
import { usePage } from "../../context/PageContext";

// ===== STYLED COMPONENTS =====
const HeaderWrapper = styled.header`
    position: sticky;
    top: 0;
    z-index: 1000;
    background: var(--bg-secondary);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-color-light);
`;

const HeaderInner = styled.div`
    max-width: 1180px;
    margin: 0 auto;
    padding: 14px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
`;

const Logo = styled.button`
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.3px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    
    &:hover {
        opacity: 0.85;
    }
`;

const RightSection = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

const BtnLogin = styled.button`
    padding: 8px 18px;
    background: #38bdf8;
    color: #0f172a;
    font-size: 14px;
    font-weight: 600;
    border-radius: 999px;
    border: none;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(56, 189, 248, 0.3);
    transition: 0.2s ease;

    &:hover {
        background: #0ea5e9;
        box-shadow: 0 4px 12px rgba(56, 189, 248, 0.4);
    }
`;

const BtnRegister = styled.button`
    padding: 8px 18px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    cursor: pointer;
    transition: 0.25s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

const BtnProfile = styled.button`
    padding: 8px 18px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    cursor: pointer;
    transition: 0.25s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

const BtnLogout = styled.button`
    padding: 8px 18px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    cursor: pointer;
    transition: 0.25s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

// ===== COMPONENT =====
export default function Header() {
    const { setActivePage } = usePage();
    const token = localStorage.getItem("token");
    const logged = Boolean(token);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setActivePage("login");
    };

    return (
        <HeaderWrapper>
            <HeaderInner>
                {/* LOGO */}
                <Logo onClick={() => setActivePage("landing")}>
                    RetailSystem
                </Logo>

                {/* RIGHT SIDE */}
                <RightSection>
                    {logged ? (
                        <>
                            <BtnProfile onClick={() => setActivePage("settings")}>
                                Профиль
                            </BtnProfile>
                            <BtnLogout onClick={handleLogout}>
                                Выйти
                            </BtnLogout>
                        </>
                    ) : (
                        <>
                            <BtnLogin onClick={() => setActivePage("login")}>
                                Войти
                            </BtnLogin>
                            <BtnRegister onClick={() => setActivePage("register")}>
                                Зарегистрироваться
                            </BtnRegister>
                        </>
                    )}
                </RightSection>
            </HeaderInner>
        </HeaderWrapper>
    );
}

