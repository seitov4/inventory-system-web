import React, { useState } from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import useStores from "../hooks/useStores.jsx";

const Grid = styled.div`
    max-width: 920px;
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

const FormGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

const SectionTitle = styled.div`
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin: 16px 0 10px;
`;

const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const Label = styled.label`
    font-size: 13px;
    font-weight: 600;
    color: #334155;
`;

const Input = styled.input`
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    padding: 10px 12px;
    font-size: 13px;
    color: #0f172a;

    &:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    &::placeholder {
        color: #94a3b8;
    }
`;

const Select = styled.select`
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    padding: 10px 12px;
    font-size: 13px;
    color: #0f172a;

    &:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
`;

const Error = styled.div`
    font-size: 12px;
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 9px 10px;
    margin-top: 12px;
`;

const Success = styled.div`
    font-size: 12px;
    color: #15803d;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 9px 10px;
    margin-top: 12px;
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
        plan: "standard",
        region: "local",
        address: "",
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

        createStore({
            name: form.name.trim(),
            slug: form.slug.trim(),
            ownerEmail: form.ownerEmail.trim(),
            ownerPassword: form.ownerPassword,
            plan: form.plan,
            region: form.region,
            address: form.address.trim(),
        })
            .then(() => {
                setSuccess("Store created successfully.");
                window.setTimeout(() => onNavigate("stores"), 500);
            })
            .catch(() => {
                setError("Store was not created. Please check platform API configuration.");
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
                    <SectionTitle>Store details</SectionTitle>
                    <FormGrid>
                        <FieldGroup>
                            <Label>Store name</Label>
                            <Input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Acme Retail"
                            />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>Slug</Label>
                            <Input
                                name="slug"
                                value={form.slug}
                                onChange={handleChange}
                                placeholder="acme-retail"
                            />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>Plan</Label>
                            <Select name="plan" value={form.plan} onChange={handleChange}>
                                <option value="standard">Standard</option>
                                <option value="premium">Premium</option>
                                <option value="enterprise">Enterprise</option>
                            </Select>
                        </FieldGroup>

                        <FieldGroup>
                            <Label>Region</Label>
                            <Input
                                name="region"
                                value={form.region}
                                onChange={handleChange}
                                placeholder="local"
                            />
                        </FieldGroup>
                    </FormGrid>

                    <FieldGroup style={{ marginTop: 14 }}>
                        <Label>Address</Label>
                        <Input
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            placeholder="City, street, building"
                        />
                    </FieldGroup>

                    <SectionTitle>Owner account</SectionTitle>
                    <FormGrid>
                        <FieldGroup>
                            <Label>Owner email</Label>
                            <Input
                                name="ownerEmail"
                                type="email"
                                value={form.ownerEmail}
                                onChange={handleChange}
                                placeholder="owner@acme.io"
                            />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>Owner password</Label>
                            <Input
                                name="ownerPassword"
                                type="password"
                                value={form.ownerPassword}
                                onChange={handleChange}
                                placeholder="At least 8 characters"
                            />
                        </FieldGroup>
                    </FormGrid>

                    {error && <Error>{error}</Error>}
                    {success && <Success>{success}</Success>}

                    <Actions>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Creating..." : "Create store"}
                        </Button>
                        <Button type="button" tone="ghost" onClick={() => onNavigate("stores")}>
                            Cancel
                        </Button>
                    </Actions>
                </form>
            </Card>
        </Grid>
    );
}
