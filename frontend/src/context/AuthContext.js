import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import authApi from "../api/authApi";

/**
 * AuthContext
 * Stores:
 * - user (with role)
 * - token
 * - status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
 * - login/logout methods
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [status, setStatus] = useState("idle"); // idle -> loading -> authenticated/unauthenticated
    const [error, setError] = useState("");

    // Load profile by existing token
    useEffect(() => {
        let cancelled = false;

        async function loadProfile() {
            if (!token) {
                setUser(null);
                setStatus("unauthenticated");
                setError("");
                return;
            }

            setStatus("loading");
            setError("");

            try {
                const res = await authApi.me();
                const u = res?.user || res || null;
                if (cancelled) return;
                setUser(u);
                setStatus("authenticated");
            } catch (e) {
                console.error("[Auth] Failed to load profile", e);
                if (cancelled) return;
                // Token is no longer valid — clear it
                localStorage.removeItem("token");
                setToken(null);
                setUser(null);
                setStatus("unauthenticated");
                setError(
                    e?.response?.data?.error ||
                        e?.message ||
                        "Session expired, please log in again."
                );
            }
        }

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, [token]);

    const login = async (identifier, password) => {
        setError("");
        try {
            const res = await authApi.login(identifier, password);
            const t = res?.token || res?.accessToken;
            if (!t) {
                throw new Error("Token not received from server");
            }
            localStorage.setItem("token", t);
            setToken(t);

            // load profile immediately after login
            try {
                const me = await authApi.me();
                const u = me?.user || me || null;
                setUser(u);
                setStatus("authenticated");
                return { user: u, token: t };
            } catch (profileErr) {
                console.error("[Auth] Failed to load profile after login", profileErr);
                // even if profile didn't come, we consider token exists
                setStatus("authenticated");
                return { user: null, token: t };
            }
        } catch (e) {
            console.error("[Auth] Login failed", e);
            const msg =
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                e?.message ||
                "Failed to log in. Check your login and password.";
            setError(msg);
            setStatus("unauthenticated");
            throw e;
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setStatus("unauthenticated");
        setError("");
    };

    const value = useMemo(
        () => ({
            user,
            token,
            role: user?.role || null,
            status,
            error,
            login,
            logout,
            isAuthenticated: status === "authenticated",
            hasRole: (...roles) => {
                if (!user?.role) return false;
                return roles.includes(user.role);
            },
        }),
        [user, token, status, error]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}


