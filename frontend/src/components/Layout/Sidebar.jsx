import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./layout.css";

const navItems = [
    { to: "/dashboard", label: "Дашборд" },
    { to: "/products", label: "Товары" },
    { to: "/sales", label: "Продажи" },
    { to: "/warehouse", label: "Склад" },
    { to: "/settings", label: "Настройки" },
];

export default function Sidebar() {
    const { pathname } = useLocation();

    return (
        <aside className="app-sidebar">
            <div className="app-sidebar-inner">
                <div className="app-sidebar-section app-sidebar-section-top">
                    <div className="app-sidebar-label">Навигация</div>
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
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="app-sidebar-section app-sidebar-section-bottom">
                    <div className="app-sidebar-footnote">
                        RetailSystem · v1.0
                    </div>
                </div>
            </div>
        </aside>
    );
}
