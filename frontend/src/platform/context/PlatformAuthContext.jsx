import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setPlatformAuthToken, setPlatformUnauthorizedHandler } from "../api/platformClient.js";
import {
    getPlatformProfile,
    platformLogin as apiLogin,
    platformLogout as apiLogout,
} from "../api/auth.api.js";
import { logAuditEvent } from "../utils/auditLogger.js";

const PlatformAuthContext = createContext(null);
const PLATFORM_TOKEN_KEY = "platformToken";
const PLATFORM_USER_KEY = "platformUser";
const PLATFORM_LAST_LOGIN_KEY = "platformLastLogin";
const PLATFORM_ROLES = ["platform_super_admin", "platform_admin"];

function readStoredUser() {
    try {
        const stored = localStorage.getItem(PLATFORM_USER_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function readStoredDate(key) {
    try {
        const stored = localStorage.getItem(key);
        return stored ? new Date(stored) : null;
    } catch {
        return null;
    }
}

function getErrorMessage(error, fallback = "Login failed") {
    return error?.response?.data?.error?.message || error?.message || fallback;
}

function isPlatformAdmin(user) {
    return user?.scope === "platform" && PLATFORM_ROLES.includes(user?.role);
}

export function PlatformAuthProvider({ children }) {
    const navigate = useNavigate();
    const [token, setToken] = useState(() => localStorage.getItem(PLATFORM_TOKEN_KEY));
    const [user, setUser] = useState(() => readStoredUser());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastLogin, setLastLogin] = useState(() => readStoredDate(PLATFORM_LAST_LOGIN_KEY));

    const clearSession = React.useCallback(
        ({ redirect = false } = {}) => {
            localStorage.removeItem(PLATFORM_TOKEN_KEY);
            localStorage.removeItem(PLATFORM_USER_KEY);
            localStorage.removeItem(PLATFORM_LAST_LOGIN_KEY);
            setPlatformAuthToken(null);
            setToken(null);
            setUser(null);
            setLastLogin(null);
            if (redirect) {
                navigate("/platform/login", { replace: true });
            }
        },
        [navigate]
    );

    const loadCurrentUser = React.useCallback(async () => {
        const currentToken = localStorage.getItem(PLATFORM_TOKEN_KEY);
        if (!currentToken) {
            clearSession();
            setLoading(false);
            return null;
        }

        setLoading(true);
        setError("");
        setPlatformAuthToken(currentToken);

        try {
            const profile = await getPlatformProfile();
            const currentUser = profile?.user || profile || null;
            if (!isPlatformAdmin(currentUser)) {
                throw new Error("Platform user profile was not returned");
            }

            setToken(currentToken);
            setUser(currentUser);
            localStorage.setItem(PLATFORM_USER_KEY, JSON.stringify(currentUser));
            return currentUser;
        } catch (e) {
            const message = getErrorMessage(e, "Session expired, please sign in again.");
            setError(message);
            clearSession();
            return null;
        } finally {
            setLoading(false);
        }
    }, [clearSession]);

    useEffect(() => {
        setPlatformAuthToken(token);
        if (token) {
            localStorage.setItem(PLATFORM_TOKEN_KEY, token);
        }
    }, [token]);

    useEffect(() => {
        setPlatformUnauthorizedHandler(() => {
            clearSession({ redirect: true });
        });

        loadCurrentUser();

        return () => {
            setPlatformUnauthorizedHandler(null);
        };
    }, [clearSession, loadCurrentUser]);

    const login = React.useCallback(
        async ({ email, password } = {}) => {
            setError("");
            setLoading(true);

            try {
                if (!email || !password) {
                    throw new Error("Email and password are required");
                }

                const result = await apiLogin({
                    email: email.trim().toLowerCase(),
                    password,
                });
                const receivedToken = result?.token;
                const receivedUser = result?.user;

                if (!receivedToken || !isPlatformAdmin(receivedUser)) {
                    throw new Error("Invalid platform login response");
                }

                setPlatformAuthToken(receivedToken);
                localStorage.setItem(PLATFORM_TOKEN_KEY, receivedToken);
                localStorage.setItem(PLATFORM_USER_KEY, JSON.stringify(receivedUser));
                setToken(receivedToken);
                setUser(receivedUser);

                const loginTime = new Date();
                setLastLogin(loginTime);
                localStorage.setItem(PLATFORM_LAST_LOGIN_KEY, loginTime.toISOString());
                logAuditEvent({
                    type: "AUTH_LOGIN",
                    email: receivedUser.email,
                    metadata: { timestamp: loginTime.toISOString() },
                });

                return { token: receivedToken, user: receivedUser };
            } catch (e) {
                clearSession();
                const message = getErrorMessage(e);
                setError(message);
                logAuditEvent({
                    type: "AUTH_FAILED",
                    email: email || "unknown",
                    metadata: {
                        timestamp: new Date().toISOString(),
                        reason: message,
                    },
                });
                return { success: false, error: message };
            } finally {
                setLoading(false);
            }
        },
        [clearSession]
    );

    const logout = React.useCallback(async () => {
        const userEmail = user?.email || "unknown";
        try {
            if (token) {
                await apiLogout();
            }
        } catch (e) {
            // Local logout should still complete if the token is already expired.
            console.warn("[PlatformAuth] Logout API call failed", e);
        } finally {
            logAuditEvent({
                type: "AUTH_LOGOUT",
                email: userEmail,
                metadata: { timestamp: new Date().toISOString() },
            });
            clearSession({ redirect: true });
            setError("");
        }
    }, [clearSession, token, user?.email]);

    const value = useMemo(
        () => ({
            token,
            user,
            platformToken: token,
            platformUser: user,
            isAuthenticated: Boolean(token && user),
            loading,
            error,
            lastLogin,
            login,
            logout,
            checkAuth: loadCurrentUser,
            loadCurrentUser,
        }),
        [token, user, loading, error, lastLogin, login, logout, loadCurrentUser]
    );

    return <PlatformAuthContext.Provider value={value}>{children}</PlatformAuthContext.Provider>;
}

export function usePlatformAuth() {
    const ctx = useContext(PlatformAuthContext);
    if (!ctx) {
        throw new Error("usePlatformAuth must be used within PlatformAuthProvider");
    }
    return ctx;
}

export default PlatformAuthContext;
