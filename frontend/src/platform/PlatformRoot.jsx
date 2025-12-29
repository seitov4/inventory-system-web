import React, { useState } from "react";
import { createGlobalStyle } from "styled-components";
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
    const [activeSection, setActiveSection] = useState("dashboard");
    const [selectedStoreId, setSelectedStoreId] = useState(null);

    const handleNavigate = (section, storeId = null) => {
        setActiveSection(section);
        if (storeId) {
            setSelectedStoreId(storeId);
        } else if (section !== "store-overview") {
            // Clear selected store when navigating away from store overview
            setSelectedStoreId(null);
        }
    };

    const renderSection = () => {
        switch (activeSection) {
            case "dashboard":
                return <DashboardSection onNavigate={handleNavigate} />;
            case "stores":
                return <StoresSection onNavigate={handleNavigate} onStoreSelect={setSelectedStoreId} />;
            case "store-create":
                return (
                    <StoreCreateSection
                        onNavigate={handleNavigate}
                    />
                );
            case "store-overview":
                return (
                    <StoreOverviewSection
                        storeId={selectedStoreId}
                        onNavigate={handleNavigate}
                    />
                );
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
            <PlatformLayout
                activeSection={activeSection}
                onNavigate={handleNavigate}
            >
                {renderSection()}
            </PlatformLayout>
        </>
    );
}


