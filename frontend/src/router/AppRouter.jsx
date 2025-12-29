import React from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import StoreAppRoot from "../store-app/StoreAppRoot.jsx";
import PlatformRoot from "../platform/PlatformRoot.jsx";
import StoreLogin from "../auth/StoreLogin.jsx";
import PlatformLogin from "../auth/PlatformLogin.jsx";
import { PlatformAuthProvider } from "../platform/context/PlatformAuthContext.jsx";

function StoreProtectedRoute({ children }) {
    const hasToken = Boolean(localStorage.getItem("token"));
    if (!hasToken) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

function PlatformZone() {
    return (
        <PlatformAuthProvider>
            <PlatformRoot />
        </PlatformAuthProvider>
    );
}

function PlatformProtectedRoute() {
    const hasToken = Boolean(localStorage.getItem("platformToken"));
    if (!hasToken) {
        return <Navigate to="/platform/login" replace />;
    }
    return <PlatformZone />;
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
                <Route path="/platform/*" element={<PlatformProtectedRoute />} />

                {/* ===== DEFAULT ===== */}
                <Route path="/" element={<Navigate to="/app" replace />} />
            </Routes>
        </BrowserRouter>
    );
}


