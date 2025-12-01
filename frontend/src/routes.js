import React from "react";

import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/Login/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProductsPage from "./pages/Products/ProductsPage";
import SalesPage from "./pages/Sales/SalesPage";
import WarehousePage from "./pages/Warehouse/WarehousePage";
import SettingsPage from "./pages/Settings/SettingsPage";

export const routes = [
    { path: "/", element: <LandingPage /> },
    { path: "/login", element: <LoginPage /> },

    { path: "/dashboard", element: <DashboardPage /> },
    { path: "/products", element: <ProductsPage /> },
    { path: "/sales", element: <SalesPage /> },
    { path: "/warehouse", element: <WarehousePage /> },
    { path: "/settings", element: <SettingsPage /> },
];
