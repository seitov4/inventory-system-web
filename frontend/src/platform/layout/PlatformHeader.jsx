import React from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";
import { usePlatformAuth } from "../context/PlatformAuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Wrapper = styled.header`
    min-height: 68px;
    border-bottom: 1px solid #e2e8f0;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(10px);
`;

const Inner = styled.div`
    height: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: 12px 24px;
    gap: 16px;

    @media (max-width: 860px) {
        grid-template-columns: 1fr;
        align-items: flex-start;
    }
`;

const TitleBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const Title = styled.div`
    font-size: 18px;
    font-weight: 700;
    color: #111827;
`;

const Subtitle = styled.div`
    font-size: 13px;
    color: #6b7280;
`;

const RightBlock = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
`;

const Avatar = styled.div`
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: #2563eb;
    font-weight: 600;
`;

const OwnerInfo = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    margin-right: 8px;
`;

const OwnerEmail = styled.div`
    font-size: 13px;
    color: #111827;
    font-weight: 500;
`;

const OwnerRole = styled.div`
    font-size: 12px;
    color: #6b7280;
`;

function formatRole(role) {
    return String(role || "platform")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSectionTitle(section) {
    switch (section) {
        case "dashboard":
            return "Platform overview";
        case "stores":
            return "Stores management";
        case "store-create":
            return "Create new store";
        case "users":
            return "Platform admins";
        case "monitoring":
            return "System monitoring";
        case "logs":
            return "Activity & logs";
        case "settings":
            return "Platform settings";
        default:
            return "Platform overview";
    }
}

export default function PlatformHeader({ activeSection, onNavigate }) {
    const title = getSectionTitle(activeSection);
    const { user, logout, isAuthenticated } = usePlatformAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/platform/login", { replace: true });
    };

    const getInitials = (email) => {
        if (!email) return "PW";
        const parts = email.split("@")[0].split(".");
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return email.substring(0, 2).toUpperCase();
    };

    return (
        <Wrapper>
            <Inner>
                <TitleBlock>
                    <Title>{title}</Title>
                    <Subtitle>Platform owner panel - state-based SPA</Subtitle>
                </TitleBlock>
                <RightBlock>
                    {activeSection !== "stores" && (
                        <Button tone="primary" size="small" onClick={() => onNavigate("stores")}>
                            Go to stores
                        </Button>
                    )}
                    {activeSection !== "store-create" && (
                        <Button
                            tone="ghost"
                            size="small"
                            onClick={() => onNavigate("store-create")}
                        >
                            + New store
                        </Button>
                    )}
                    {isAuthenticated && user && (
                        <>
                            <OwnerInfo>
                                <OwnerEmail>{user.email}</OwnerEmail>
                                <OwnerRole>{formatRole(user.role)}</OwnerRole>
                            </OwnerInfo>
                            <Button tone="ghost" size="small" onClick={handleLogout}>
                                Logout
                            </Button>
                        </>
                    )}
                    <Avatar>{getInitials(user?.email)}</Avatar>
                </RightBlock>
            </Inner>
        </Wrapper>
    );
}
