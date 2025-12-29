import React, { useState } from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import useStores from "../hooks/useStores.jsx";

const Grid = styled.div`
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const Label = styled.label`
    font-size: 13px;
    color: #e5e7eb;
`;

const Input = styled.input`
    border-radius: 10px;
    border: 1px solid rgba(55, 65, 81, 0.9);
    background: rgba(15, 23, 42, 0.9);
    padding: 9px 11px;
    font-size: 13px;
    color: #e5e7eb;

    &:focus {
        outline: none;
        border-color: #0ea5e9;
        box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.4);
    }

    &::placeholder {
        color: #6b7280;
    }
`;

const Error = styled.div`
    font-size: 12px;
    color: #fca5a5;
    margin-top: 4px;
`;

const Success = styled.div`
    font-size: 12px;
    color: #bbf7d0;
    margin-top: 4px;
`;

const Actions = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 4px;
`;

export default function StoreCreateSection({ onNavigate }) {
    const [form, setForm] = useState({
        name: "",
        slug: "",
        ownerEmail: "",
        ownerPassword: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { createStore } = useStores();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError("");
        setSuccess("");
    };

    const validate = () => {
        if (!form.name.trim()) return "Store name is required.";
        if (!form.slug.trim()) return "Slug is required.";
        if (!/^[a-z0-9-]+$/.test(form.slug)) {
            return "Slug must contain only lowercase letters, numbers and dashes.";
        }
        if (!form.ownerEmail.trim()) return "Owner email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail)) {
            return "Owner email must be a valid email address.";
        }
        if (!form.ownerPassword || form.ownerPassword.length < 8) {
            return "Owner password must be at least 8 characters.";
        }
        return "";
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);
        setError("");
        setSuccess("");

        // Mock-first: try API, on error UI will remain in mock state
        createStore({
            name: form.name.trim(),
            slug: form.slug.trim(),
            ownerEmail: form.ownerEmail.trim(),
            ownerPassword: form.ownerPassword,
        })
            .then(() => {
                setSuccess("Store created successfully.");
            })
            .catch(() => {
                setError(
                    "Store was not persisted to backend (mock-only). Please check platform API configuration."
                );
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    return (
        <Grid>
            <Card
                title="Create new store"
                description="Provision a new tenant workspace for the inventory platform."
            >
                <form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Label>Store name</Label>
                        <Input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Acme Retail"
                        />
                    </FieldGroup>

                    <FieldGroup style={{ marginTop: 10 }}>
                        <Label>Slug</Label>
                        <Input
                            name="slug"
                            value={form.slug}
                            onChange={handleChange}
                            placeholder="acme-retail"
                        />
                    </FieldGroup>

                    <FieldGroup style={{ marginTop: 10 }}>
                        <Label>Owner email</Label>
                        <Input
                            name="ownerEmail"
                            type="email"
                            value={form.ownerEmail}
                            onChange={handleChange}
                            placeholder="owner@acme.io"
                        />
                    </FieldGroup>

                    <FieldGroup style={{ marginTop: 10 }}>
                        <Label>Owner password</Label>
                        <Input
                            name="ownerPassword"
                            type="password"
                            value={form.ownerPassword}
                            onChange={handleChange}
                            placeholder="At least 8 characters"
                        />
                    </FieldGroup>

                    {error && <Error>{error}</Error>}
                    {success && <Success>{success}</Success>}

                    <Actions>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Creating..." : "Create store"}
                        </Button>
                        <Button
                            type="button"
                            tone="ghost"
                            onClick={() => onNavigate("stores")}
                        >
                            Cancel
                        </Button>
                    </Actions>
                </form>
            </Card>
        </Grid>
    );
}


