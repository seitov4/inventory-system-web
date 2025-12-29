import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setPlatformAuthToken } from "../api/platformClient.js";
import { platformLogin as apiLogin, getPlatformProfile, platformLogout as apiLogout } from "../api/auth.api.js";
import { logAuditEvent } from "../utils/auditLogger.js";

const PlatformAuthContext = createContext(null);

export function PlatformAuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        return localStorage.getItem("platformToken") || null;
    });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [lastLogin, setLastLogin] = useState(() => {
        // Try to get last login from localStorage
        try {
            const stored = localStorage.getItem("platformLastLogin");
            return stored ? new Date(stored) : null;
        } catch {
            return null;
        }
    });

    const loadProfile = React.useCallback(async () => {
        if (!token) return;
        try {
            const profile = await getPlatformProfile();
            setUser(profile.user || profile || null);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("[PlatformAuth] Failed to load profile", e);
            // Profile loading failure doesn't invalidate token
        }
    }, [token]);

    useEffect(() => {
        setPlatformAuthToken(token);
        if (token) {
            localStorage.setItem("platformToken", token);
            // Try to load user profile if token exists
            loadProfile();
        } else {
            localStorage.removeItem("platformToken");
            setUser(null);
        }
    }, [token, loadProfile]);

    const login = async ({ email, password }) => {
        setError("");
        setLoading(true);
        try {
            if (!email || !password) {
                throw new Error("Email and password are required");
            }

            // Try real API first
            try {
                const result = await apiLogin({ email, password });
                const receivedToken = result?.token || result?.accessToken;
                if (receivedToken) {
                    setToken(receivedToken);
                    // Load profile after successful login
                    let userProfile = null;
                    try {
                        const profile = await getPlatformProfile();
                        userProfile = profile.user || profile || { email, role: "platform_owner" };
                        setUser(userProfile);
                    } catch (profileErr) {
                        // Profile loading failure doesn't invalidate login
                        console.warn("[PlatformAuth] Profile load failed, but login succeeded", profileErr);
                        userProfile = { email, role: "platform_owner" };
                        setUser(userProfile);
                    }

                    // Record successful login in audit log
                    const loginTime = new Date();
                    setLastLogin(loginTime);
                    localStorage.setItem("platformLastLogin", loginTime.toISOString());
                    logAuditEvent({
                        type: "AUTH_LOGIN",
                        email: userProfile.email || email,
                        metadata: { timestamp: loginTime.toISOString() },
                    });

                    return { token: receivedToken, user: userProfile };
                }
            } catch (apiError) {
                // If API call fails (404, network error, etc), fall back to mock
                // eslint-disable-next-line no-console
                console.warn("[PlatformAuth] API login failed, using mock mode", apiError);
                // Mock mode: accept any credentials and set fake token
                // TODO: Remove mock mode when backend API is available
                const mockToken = "mock-platform-token";
                setToken(mockToken);
                const mockUser = { email, role: "platform_owner" };
                setUser(mockUser);

                // Record successful login in audit log (mock mode)
                const loginTime = new Date();
                setLastLogin(loginTime);
                localStorage.setItem("platformLastLogin", loginTime.toISOString());
                logAuditEvent({
                    type: "AUTH_LOGIN",
                    email,
                    metadata: { timestamp: loginTime.toISOString(), mode: "mock" },
                });

                return { token: mockToken, user: mockUser };
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("[PlatformAuth] login failed", e);
            const errorMessage = e.message || "Login failed";
            setError(errorMessage);

            // Record failed login attempt in audit log
            logAuditEvent({
                type: "AUTH_FAILED",
                email: email || "unknown",
                metadata: {
                    timestamp: new Date().toISOString(),
                    reason: errorMessage,
                },
            });

            throw e;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        const userEmail = user?.email || "unknown";
        try {
            // Try to call logout API if token exists
            if (token) {
                await apiLogout();
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[PlatformAuth] Logout API call failed", e);
            // Continue with local logout even if API fails
        } finally {
            // Record logout in audit log
            logAuditEvent({
                type: "AUTH_LOGOUT",
                email: userEmail,
                metadata: { timestamp: new Date().toISOString() },
            });

            setToken(null);
            setUser(null);
            setError("");
            setLastLogin(null);
            localStorage.removeItem("platformLastLogin");
        }
    };

    const value = useMemo(
        () => ({
            token,
            user,
            isAuthenticated: Boolean(token),
            loading,
            error,
            lastLogin,
            login,
            logout,
        }),
        [token, user, loading, error, lastLogin]
    );

    return (
        <PlatformAuthContext.Provider value={value}>
            {children}
        </PlatformAuthContext.Provider>
    );
}

export function usePlatformAuth() {
    const ctx = useContext(PlatformAuthContext);
    if (!ctx) {
        throw new Error("usePlatformAuth must be used within PlatformAuthProvider");
    }
    return ctx;
}

export default PlatformAuthContext;


