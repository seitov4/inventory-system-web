import React, { useState } from "react";
import styled from "styled-components";
import authApi from "../../api/authApi";
import { usePage } from "../../context/PageContext";

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
    max-width: 640px;
    background: #ffffff;
    border-radius: 18px;
    padding: 28px 28px 24px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);

    @media (max-width: 640px) {
        padding: 22px 18px 18px;
    }
`;

const Title = styled.h1`
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
`;

const Subtitle = styled.p`
    margin: 0 0 20px;
    font-size: 14px;
    color: #64748b;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const Label = styled.label`
    display: flex;
    flex-direction: column;
    font-size: 13px;
    color: #475569;
    gap: 4px;
`;

const Input = styled.input`
    border-radius: 10px;
    border: 1px solid #d4d4dd;
    padding: 10px 12px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.18);
    }
`;

const Select = styled.select`
    border-radius: 10px;
    border: 1px solid #d4d4dd;
    padding: 10px 12px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;

    &:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 1px rgba(79, 70, 229, 0.18);
    }
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 640px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

const SubmitButton = styled.button`
    margin-top: 8px;
    width: 100%;
    border: none;
    border-radius: 999px;
    padding: 11px 16px;
    font-size: 15px;
    font-weight: 600;
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: #ffffff;
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.15s ease;

    &:disabled {
        opacity: 0.7;
        cursor: default;
        box-shadow: none;
    }

    &:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 22px rgba(79, 70, 229, 0.3);
    }
`;

const ErrorMessage = styled.div`
    margin-bottom: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: #fef2f2;
    color: #b91c1c;
    font-size: 13px;
`;

const FooterLinks = styled.div`
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    font-size: 13px;
`;

const FooterLink = styled.button`
    color: ${props => props.$muted ? '#6b7280' : '#4f46e5'};
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 13px;

    &:hover {
        text-decoration: underline;
    }
`;

// ===== INITIAL STATE =====
const initialState = {
    storeName: "",
    firstName: "",
    lastName: "",
    contact: "",
    role: "owner",
    password: "",
    passwordConfirm: "",
};

// ===== COMPONENT =====
const RegisterPage = () => {
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { setActivePage } = usePage();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const {
            storeName,
            firstName,
            lastName,
            contact,
            role,
            password,
            passwordConfirm,
        } = form;

        if (!storeName || !firstName || !lastName || !contact || !password) {
            setError("Please fill in all required fields");
            return;
        }

        if (password !== passwordConfirm) {
            setError("Password and confirmation do not match");
            return;
        }

        try {
            setLoading(true);
            const res = await authApi.register({
                storeName,
                firstName,
                lastName,
                contact,
                role,
                password,
                passwordConfirm,
            });

            const token = res?.token;
            if (token) {
                localStorage.setItem("token", token);
                setActivePage("dashboard");
            } else {
                setError("Failed to obtain token after registration");
            }
        } catch (e) {
            console.error(e);
            const msg =
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                e?.message ||
                "Store registration failed";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper>
            <Card>
                <Title>Store registration</Title>
                <Subtitle>
                    Create a store and the first administrator in one step.
                </Subtitle>

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <Form onSubmit={handleSubmit}>
                    <Label>
                        Store name
                        <Input
                            type="text"
                            name="storeName"
                            value={form.storeName}
                            onChange={handleChange}
                            placeholder="For example, Corner Store"
                        />
                    </Label>

                    <FormRow>
                        <Label>
                            Admin first name
                            <Input
                                type="text"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder="First name"
                            />
                        </Label>
                        <Label>
                            Admin last name
                            <Input
                                type="text"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder="Last name"
                            />
                        </Label>
                    </FormRow>

                    <Label>
                        Phone or email
                        <Input
                            type="text"
                            name="contact"
                            value={form.contact}
                            onChange={handleChange}
                            placeholder="+1... or you@example.com"
                        />
                    </Label>

                    <Label>
                        Owner role
                        <Select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                        >
                            <option value="owner">Owner (owner)</option>
                            <option value="admin">Administrator (admin)</option>
                        </Select>
                    </Label>

                    <FormRow>
                        <Label>
                            Password
                            <Input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                            />
                        </Label>
                        <Label>
                            Confirm password
                            <Input
                                type="password"
                                name="passwordConfirm"
                                value={form.passwordConfirm}
                                onChange={handleChange}
                                placeholder="Repeat password"
                            />
                        </Label>
                    </FormRow>

                    <SubmitButton type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Register store"}
                    </SubmitButton>
                </Form>

                <FooterLinks>
                    <FooterLink onClick={() => setActivePage("login")}>
                        Already have an account? Sign in
                    </FooterLink>
                    <FooterLink $muted onClick={() => setActivePage("landing")}>
                        ← Back to landing
                    </FooterLink>
                </FooterLinks>
            </Card>
        </PageWrapper>
    );
};

export default RegisterPage;

