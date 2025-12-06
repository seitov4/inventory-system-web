import React, { useState } from "react";
import Sidebar from "./Sidebar";
import "./layout.css";

export default function Layout({ title, children }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem("sidebarCollapsed");
        return saved === "true";
    });

    return (
        <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
            <Sidebar onCollapseChange={setSidebarCollapsed} />

            <div className="app-shell-main">
                {title && (
                    <div className="app-shell-header">
                        <h1 className="app-shell-title">{title}</h1>
                    </div>
                )}

                <div className="app-shell-content">{children}</div>
            </div>
        </div>
    );
}
