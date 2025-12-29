import React from "react";
import styled from "styled-components";
import { usePlatformAuth } from "../platform/context/PlatformAuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Wrapper = styled.div`
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at top left, #0ea5e9 0, #020617 55%);
    color: #e5e7eb;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Card = styled.div`
    width: 100%;
    max-width: 420px;
    background: rgba(15, 23, 42, 0.96);
    border-radius: 18px;
    padding: 26px 24px 20px;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.7);
    border: none;
`;

const Title = styled.h1`
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 700;
`;

const Subtitle = styled.p`
    margin: 0 0 16px;
    font-size: 13px;
    color: #9ca3af;
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
    color: #e5e7eb;
`;

const Input = styled.input`
    border-radius: 10px;
    border: none;
    padding: 9px 11px;
    font-size: 13px;
    background: rgba(15, 23, 42, 0.9);
    color: #e5e7eb;

    &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.5);
    }
`;

const Button = styled.button`
    margin-top: 8px;
    width: 100%;
    border-radius: 999px;
    border: none;
    padding: 10px 16px;
    background: linear-gradient(135deg, #22c55e, #0ea5e9);
    color: #020617;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 16px 40px rgba(16, 185, 129, 0.45);

    &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        box-shadow: none;
    }
`;

const Error = styled.div`
    margin-top: 6px;
    font-size: 12px;
    color: #fecaca;
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
            await login({ email, password });
            navigate("/platform", { replace: true });
        } catch {
            // error already handled in context
        }
    };

    return (
        <Wrapper>
            <Card>
                <Title>Platform owner login</Title>
                <Subtitle>
                    Sign in to manage tenants, platform health and logs. This form works in mock
                    mode until the platform auth API is connected.
                </Subtitle>
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


