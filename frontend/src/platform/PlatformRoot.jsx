import React from "react";
import { createGlobalStyle } from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import PlatformLayout from "./layout/PlatformLayout.jsx";
import DashboardSection from "./sections/DashboardSection.jsx";
import StoresSection from "./sections/StoresSection.jsx";
import StoreCreateSection from "./sections/StoreCreateSection.jsx";
import MonitoringSection from "./sections/MonitoringSection.jsx";
import LogsSection from "./sections/LogsSection.jsx";
import SettingsSection from "./sections/SettingsSection.jsx";
import StoreOverviewSection from "./sections/StoreOverviewSection.jsx";

const PlatformGlobalStyle = createGlobalStyle`
    * {
        box-sizing: border-box;
    }

    html, body, #root {
        margin: 0;
        padding: 0;
        height: 100%;
    }

    body {
        background: #020617;
    }
`;

/**
 * PlatformRoot
 * Entry point for the isolated platform admin panel.
 * Navigation is state-based only: activeSection.
 */
export default function PlatformRoot() {
    const location = useLocation();
    const navigate = useNavigate();

    // derive section and optional store id from URL: /platform/<section> or /platform/store-overview/:id
    const parts = location.pathname.split("/").filter(Boolean);
    const section = parts[1] || "dashboard";
    const storeId = parts[2] || null;

    const handleNavigate = (targetSection, maybeStoreId = null) => {
        if (targetSection === "store-overview" && maybeStoreId) {
            navigate(`/platform/store-overview/${maybeStoreId}`);
        } else {
            navigate(`/platform/${targetSection}`);
        }
    };

    const renderSection = () => {
        switch (section) {
            case "dashboard":
                return <DashboardSection onNavigate={handleNavigate} />;
            case "stores":
                return <StoresSection onNavigate={handleNavigate} onStoreSelect={(id) => handleNavigate("store-overview", id)} />;
            case "store-create":
                return <StoreCreateSection onNavigate={handleNavigate} />;
            case "store-overview":
                return <StoreOverviewSection storeId={storeId} onNavigate={handleNavigate} />;
            case "monitoring":
                return <MonitoringSection />;
            case "logs":
                return <LogsSection />;
            case "settings":
                return <SettingsSection />;
            default:
                return <DashboardSection onNavigate={handleNavigate} />;
        }
    };

    return (
        <>
            <PlatformGlobalStyle />
            <PlatformLayout activeSection={section} onNavigate={handleNavigate}>
                {renderSection()}
            </PlatformLayout>
        </>
    );
}


