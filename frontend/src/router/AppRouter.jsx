import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StoreAppRoot from "../store-app/StoreAppRoot.jsx";
import PlatformRoot from "../platform/PlatformRoot.jsx";
import StoreLogin from "../auth/StoreLogin.jsx";
import PlatformLogin from "../auth/PlatformLogin.jsx";
import { PlatformAuthProvider, usePlatformAuth } from "../platform/context/PlatformAuthContext.jsx";
import { AuthProvider, useAuth } from "../context/AuthContext.js";

function StoreProtectedRoute({ children }) {
    const { isAuthenticated, status } = useAuth();
    // while auth is initializing, don't redirect (prevent flicker)
    if (status === "loading" || status === "idle") {
        return <div />;
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function PlatformZone() {
    return (
        <PlatformAuthProvider>
            <PlatformProtectedRoute>
                <PlatformRoot />
            </PlatformProtectedRoute>
        </PlatformAuthProvider>
    );
}

const PLATFORM_ROLES = ["platform_super_admin", "platform_admin"];

function PlatformProtectedRoute({ children }) {
    const { token, user, loading } = usePlatformAuthGuard();

    if (loading) {
        return <div />;
    }

    if (!token) {
        return <Navigate to="/platform/login" replace />;
    }

    if (user?.scope !== "platform" || !PLATFORM_ROLES.includes(user?.role)) {
        return <Navigate to="/403" replace />;
    }

    return children;
}

function usePlatformAuthGuard() {
    const { token, user, loading } = usePlatformAuth();
    return { token, user, loading };
}

function PlatformLoginZone() {
    return (
        <PlatformAuthProvider>
            <PlatformLogin />
        </PlatformAuthProvider>
    );
}

export default function AppRouter() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* ===== STORE ZONE ===== */}
                    <Route path="/login" element={<StoreLogin />} />
                    <Route
                        path="/app/*"
                        element={
                            <StoreProtectedRoute>
                                <StoreAppRoot />
                            </StoreProtectedRoute>
                        }
                    />

                    {/* ===== PLATFORM ZONE ===== */}
                    <Route path="/platform/login" element={<PlatformLoginZone />} />
                    <Route path="/platform/*" element={<PlatformZone />} />
                    <Route path="/403" element={<div>403 Access denied</div>} />

                    {/* ===== DEFAULT ===== */}
                    <Route path="/" element={<Navigate to="/app" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
