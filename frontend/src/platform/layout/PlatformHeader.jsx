import React from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";
import { usePlatformAuth } from "../context/PlatformAuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Wrapper = styled.header`
    height: 60px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.85);
    background: rgba(15, 23, 42, 0.92);
    backdrop-filter: blur(10px);
`;

const Inner = styled.div`
    height: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    padding: 0 20px;
    gap: 16px;
`;

const TitleBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

const Title = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #e5e7eb;
`;

const Subtitle = styled.div`
    font-size: 12px;
    color: #9ca3af;
`;

const RightBlock = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
`;

const Avatar = styled.div`
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: #e5e7eb;
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
    font-size: 12px;
    color: #e5e7eb;
    font-weight: 500;
`;

const OwnerRole = styled.div`
    font-size: 11px;
    color: #9ca3af;
`;

function getSectionTitle(section) {
    switch (section) {
        case "dashboard":
            return "Platform overview";
        case "stores":
            return "Stores management";
        case "store-create":
            return "Create new store";
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
                    <Subtitle>
                        Platform owner panel · state-based SPA
                    </Subtitle>
                </TitleBlock>
                <RightBlock>
                    {activeSection !== "stores" && (
                        <Button
                            tone="primary"
                            size="small"
                            onClick={() => onNavigate("stores")}
                        >
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
                                <OwnerRole>{user.role || "platform_owner"}</OwnerRole>
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


