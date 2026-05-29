import React from "react";
import styled from "styled-components";
import { usePlatformAuth } from "../platform/context/PlatformAuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Wrapper = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f6f7f9;
    color: #111827;
    font-family:
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
`;

const Card = styled.div`
    width: 100%;
    max-width: 420px;
    background: #ffffff;
    border-radius: 8px;
    padding: 26px 24px 20px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
    border: 1px solid #e5e7eb;
`;

const Title = styled.h1`
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 700;
`;

const Subtitle = styled.p`
    margin: 0 0 16px;
    font-size: 13px;
    color: #6b7280;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const Label = styled.label`
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: #4b5563;
`;

const Input = styled.input`
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    padding: 9px 11px;
    font-size: 13px;
    background: #ffffff;
    color: #111827;

    &:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
`;

const Button = styled.button`
    margin-top: 8px;
    width: 100%;
    border-radius: 8px;
    border: none;
    padding: 10px 16px;
    background: #2563eb;
    color: #ffffff;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    box-shadow: none;

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        box-shadow: none;
    }
`;

const Error = styled.div`
    margin-top: 6px;
    font-size: 12px;
    color: #dc2626;
`;

export default function PlatformLogin() {
    const { login, loading, error } = usePlatformAuth();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [localError, setLocalError] = React.useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError("");
        if (!email || !password) {
            setLocalError("Email and password are required.");
            return;
        }
        try {
            const result = await login({ email, password });
            if (result?.token) {
                navigate("/platform/dashboard", { replace: true });
            } else if (result?.error) {
                setLocalError(result.error);
            }
        } catch (e) {
            setLocalError(e.message || "Unable to sign in.");
        }
    };

    return (
        <Wrapper>
            <Card>
                <Title>Platform Admin Login</Title>
                <Subtitle>Private server administration for platform operators.</Subtitle>
                <Form onSubmit={handleSubmit}>
                    <Label>
                        Email
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="owner@platform.io"
                        />
                    </Label>
                    <Label>
                        Password
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 8 characters"
                        />
                    </Label>
                    {(localError || error) && <Error>{localError || error}</Error>}
                    <Button type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in to Platform"}
                    </Button>
                </Form>
            </Card>
        </Wrapper>
    );
}
