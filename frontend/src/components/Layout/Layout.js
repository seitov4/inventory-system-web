import React from "react";
import Sidebar from "./Sidebar";
import "./layout.css";

export default function Layout({ title, children }) {
    return (
        <div className="app-shell">
            <Sidebar />

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
