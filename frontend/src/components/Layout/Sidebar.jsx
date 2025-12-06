import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./layout.css";

const navItems = [
    { to: "/dashboard", label: "Дашборд", icon: "📊" },
    { to: "/products", label: "Товары", icon: "📦" },
    { to: "/sales", label: "Продажи", icon: "💵" },
    { to: "/warehouse", label: "Склад", icon: "🏭" },
    { to: "/add-employee", label: "Добавить сотрудника", icon: "👤" },
    { to: "/settings", label: "Настройки", icon: "⚙️" },
];

export default function Sidebar({ onCollapseChange }) {
    const { pathname } = useLocation();
    const [collapsed, setCollapsed] = useState(() => {
        const saved = localStorage.getItem("sidebarCollapsed");
        return saved === "true";
    });

    useEffect(() => {
        localStorage.setItem("sidebarCollapsed", collapsed.toString());
        if (onCollapseChange) {
            onCollapseChange(collapsed);
        }
    }, [collapsed, onCollapseChange]);

    const toggleCollapse = () => {
        setCollapsed(!collapsed);
    };

    return (
        <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
            <div className="app-sidebar-inner">
                <div className="app-sidebar-section app-sidebar-section-top">
                    <div className="app-sidebar-header">
                        {!collapsed && (
                            <div className="app-sidebar-label">Навигация</div>
                        )}
                        <button
                            className="app-sidebar-toggle"
                            onClick={toggleCollapse}
                            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
                        >
                            {collapsed ? "→" : "←"}
                        </button>
                    </div>
                    <nav className="app-sidebar-nav">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={
                                    pathname === item.to
                                        ? "app-sidebar-link active"
                                        : "app-sidebar-link"
                                }
                                title={collapsed ? item.label : undefined}
                            >
                                <span className="app-sidebar-icon">{item.icon}</span>
                                {!collapsed && <span className="app-sidebar-text">{item.label}</span>}
                            </Link>
                        ))}
                    </nav>
                </div>

                {!collapsed && (
                    <div className="app-sidebar-section app-sidebar-section-bottom">
                        <div className="app-sidebar-footnote">
                            RetailSystem · v1.0
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
