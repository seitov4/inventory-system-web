import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "../context/AuthContext.js";

// ===== STYLED COMPONENTS =====
const PageWrapper = styled.div`
    background: #f7f8ff;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24px 16px;
`;

const Card = styled.div`
    width: 100%;
    max-width: 480px;
    background: #ffffff;
    border-radius: 18px;
    padding: 32px 32px 24px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);

    @media (max-width: 640px) {
        padding: 28px 24px 20px;
        max-width: 100%;
    }
`;

const Title = styled.h1`
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    text-align: left;

    @media (max-width: 640px) {
        font-size: 22px;
    }
`;

const Subtitle = styled.p`
    margin: 0 0 24px;
    font-size: 14px;
    color: #64748b;
    text-align: left;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const Label = styled.label`
    display: flex;
    flex-direction: column;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    gap: 6px;
    text-align: left;
`;

const Input = styled.input`
    width: 100%;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    padding: 11px 14px;
    font-size: 14px;
    color: #0f172a;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    background: #ffffff;
    box-sizing: border-box;

    &:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }

    &::placeholder {
        color: #94a3b8;
    }
`;

const SubmitButton = styled.button`
    margin-top: 4px;
    width: 100%;
    border: none;
    border-radius: 10px;
    padding: 12px 20px;
    font-size: 15px;
    font-weight: 600;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: #ffffff;
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.15s ease;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    &:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(79, 70, 229, 0.3);
    }
`;

const ErrorMessage = styled.div`
    margin-bottom: 8px;
    padding: 12px 14px;
    border-radius: 10px;
    background: #fef2f2;
    color: #b91c1c;
    font-size: 14px;
    border: 1px solid #fecaca;
    text-align: left;
`;

// ===== LOGIN COMPONENT =====
function StoreLoginForm() {
    const [loginValue, setLoginValue] = useState("");
    const [pass, setPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [localError, setLocalError] = useState("");
    const { login, error: authError } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        setLocalError("");

        if (!loginValue || !pass) {
            setLocalError("Enter login (email or phone) and password");
            return;
        }

        try {
            setLoading(true);
            await login(loginValue, pass);
            // Navigate to /app after successful login
            navigate("/app", { replace: true });
        } catch (e) {
            console.error(e);
            if (!authError) {
                const msg =
                    e?.response?.data?.error ||
                    e?.response?.data?.message ||
                    e?.message ||
                    "Login failed. Please check your credentials.";
                setLocalError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!loading) handleLogin();
    };

    return (
        <PageWrapper>
            <Card>
                <Title>Store Login</Title>
                <Subtitle>
                    Enter employee login and password to access the store system.
                </Subtitle>

                {(localError || authError) && (
                    <ErrorMessage>{localError || authError}</ErrorMessage>
                )}

                <Form onSubmit={handleSubmit}>
                    <Label>
                        Login (email or phone)
                        <Input
                            type="text"
                            value={loginValue}
                            onChange={(e) => setLoginValue(e.target.value)}
                            placeholder="+1... or you@example.com"
                            autoFocus
                            disabled={loading}
                            required
                        />
                    </Label>

                    <Label>
                        Password
                        <Input
                            type="password"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            placeholder="Enter password"
                            disabled={loading}
                            required
                        />
                    </Label>

                    <SubmitButton
                        type="submit"
                        disabled={loading || !loginValue || !pass}
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </SubmitButton>
                </Form>
            </Card>
        </PageWrapper>
    );
}

// ===== EXPORT WITH AUTH PROVIDER =====
export default function StoreLogin() {
    return (
        <AuthProvider>
            <StoreLoginForm />
        </AuthProvider>
    );
}
