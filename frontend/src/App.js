// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/Login/LoginPage";
import RegisterPage from "./pages/Register/RegisterPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProductsPage from "./pages/Products/ProductsPage";
import SalesPage from "./pages/Sales/SalesPage";
import WarehousePage from "./pages/Warehouse/WarehousePage";
import SettingsPage from "./pages/Settings/SettingsPage";
import AddEmployeePage from "./pages/AddEmployee/AddEmployeePage";

import "./components/Layout/layout.css";

function AppLayout() {
    const { pathname } = useLocation();
    const withoutSidebar =
        pathname === "/" || pathname === "/login" || pathname === "/register";

    return (
        <div className="app-root">
            <Header />

            <div className={withoutSidebar ? "app-body" : "app-body app-body--with-sidebar"}>

                <main className="app-main">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/products" element={<ProductsPage />} />
                        <Route path="/sales" element={<SalesPage />} />
                        <Route path="/warehouse" element={<WarehousePage />} />
                        <Route path="/add-employee" element={<AddEmployeePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                </main>
            </div>

            <Footer />
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <Router>
                <AppLayout />
            </Router>
        </ThemeProvider>
    );
}
