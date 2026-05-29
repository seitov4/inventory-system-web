import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import {
    createPlatformUser,
    disablePlatformUser,
    getPlatformUsers,
    updatePlatformUser,
} from "../api/users.api.js";

const ROLE_OPTIONS = ["platform_admin", "platform_super_admin"];

const HeaderRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;

    @media (max-width: 720px) {
        align-items: flex-start;
        flex-direction: column;
    }
`;

const Title = styled.div`
    font-size: 18px;
    font-weight: 600;
    color: #111827;
`;

const Subtitle = styled.div`
    margin-top: 4px;
    font-size: 13px;
    color: #6b7280;
`;

const Toolbar = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 14px;
`;

const Select = styled.select`
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    background: #ffffff;
    color: #111827;
`;

const Input = styled.input`
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    background: #ffffff;
    color: #111827;
`;

const FormGrid = styled.form`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 14px;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

const Field = styled.label`
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #4b5563;
    font-size: 12px;
`;

const FormActions = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 8px;
`;

const ErrorMessage = styled.div`
    padding: 10px 12px;
    border-radius: 8px;
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    font-size: 13px;
    margin-bottom: 14px;
`;

const TableShell = styled.div`
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: auto;
    background: #ffffff;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
`;

const Th = styled.th`
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
    color: #6b7280;
    font-weight: 600;
    white-space: nowrap;
`;

const Td = styled.td`
    padding: 10px 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #111827;
    white-space: nowrap;
`;

const Badge = styled.span`
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 3px 8px;
    font-size: 12px;
    background: ${(props) => (props.$active ? "#dcfce7" : "#fee2e2")};
    color: ${(props) => (props.$active ? "#166534" : "#991b1b")};
`;

const EmptyState = styled.div`
    padding: 18px;
    color: #6b7280;
    font-size: 13px;
    text-align: center;
`;

function createEmptyForm() {
    return {
        id: null,
        name: "",
        email: "",
        password: "",
        role: "platform_admin",
        is_active: true,
    };
}

function validateForm(form, isEditing) {
    if (!form.name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Email is invalid.";
    if (!isEditing && !form.password) return "Password is required.";
    if (form.password && form.password.length < 8) {
        return "Password must be at least 8 characters.";
    }
    if (!form.role) return "Role is required.";
    return "";
}

export default function UsersSection() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(() => createEmptyForm());
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getPlatformUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const roleMatches = roleFilter === "all" || user.role === roleFilter;
            const statusMatches =
                statusFilter === "all" ||
                (statusFilter === "active" ? user.is_active : !user.is_active);
            return roleMatches && statusMatches;
        });
    }, [users, roleFilter, statusFilter]);

    const updateForm = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setForm(createEmptyForm());
        setShowForm(false);
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const validationError = validateForm(form, Boolean(form.id));
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                role: form.role,
                is_active: form.is_active,
            };

            if (form.password) {
                payload.password = form.password;
            }

            if (form.id) {
                await updatePlatformUser(form.id, payload);
            } else {
                await createPlatformUser(payload);
            }

            resetForm();
            await fetchUsers();
        } catch (e) {
            setError(e.message || "Failed to save user.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user) => {
        setForm({
            id: user.id,
            name: user.name || "",
            email: user.email || "",
            password: "",
            role: user.role || "platform_admin",
            is_active: user.is_active !== false,
        });
        setShowForm(true);
        setError("");
    };

    const handleDisable = async (user) => {
        setLoading(true);
        setError("");
        try {
            await disablePlatformUser(user.id);
            await fetchUsers();
        } catch (e) {
            setError(e.message || "Failed to disable user.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <HeaderRow>
                <div>
                    <Title>Platform Admins</Title>
                    <Subtitle>Manage private SaaS platform administrator accounts.</Subtitle>
                </div>
                <Button
                    type="button"
                    tone="primary"
                    onClick={() => {
                        setForm(createEmptyForm());
                        setShowForm(true);
                    }}
                >
                    Add user
                </Button>
            </HeaderRow>

            <Toolbar>
                <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="all">All roles</option>
                    {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                            {role}
                        </option>
                    ))}
                </Select>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                </Select>
                <Button type="button" tone="ghost" onClick={fetchUsers} disabled={loading}>
                    Refresh
                </Button>
            </Toolbar>

            {showForm && (
                <Card title={form.id ? "Edit user" : "Create user"}>
                    <FormGrid onSubmit={handleSubmit}>
                        <Field>
                            Name
                            <Input
                                value={form.name}
                                onChange={(e) => updateForm("name", e.target.value)}
                            />
                        </Field>
                        <Field>
                            Email
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => updateForm("email", e.target.value)}
                            />
                        </Field>
                        <Field>
                            Password
                            <Input
                                type="password"
                                value={form.password}
                                placeholder={form.id ? "Leave blank to keep current password" : ""}
                                onChange={(e) => updateForm("password", e.target.value)}
                            />
                        </Field>
                        <Field>
                            Role
                            <Select
                                value={form.role}
                                onChange={(e) => updateForm("role", e.target.value)}
                            >
                                {ROLE_OPTIONS.map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                        <Field>
                            Status
                            <Select
                                value={form.is_active ? "active" : "disabled"}
                                onChange={(e) =>
                                    updateForm("is_active", e.target.value === "active")
                                }
                            >
                                <option value="active">Active</option>
                                <option value="disabled">Disabled</option>
                            </Select>
                        </Field>
                        <FormActions>
                            <Button type="submit" disabled={loading}>
                                {form.id ? "Save changes" : "Create user"}
                            </Button>
                            <Button type="button" tone="ghost" onClick={resetForm}>
                                Cancel
                            </Button>
                        </FormActions>
                    </FormGrid>
                </Card>
            )}

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <TableShell>
                {loading && users.length === 0 ? (
                    <EmptyState>Loading users...</EmptyState>
                ) : filteredUsers.length === 0 ? (
                    <EmptyState>No users found.</EmptyState>
                ) : (
                    <Table>
                        <thead>
                            <tr>
                                <Th>Name</Th>
                                <Th>Email</Th>
                                <Th>Role</Th>
                                <Th>Status</Th>
                                <Th>Created</Th>
                                <Th style={{ textAlign: "right" }}>Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <Td>{user.name}</Td>
                                    <Td>{user.email}</Td>
                                    <Td>{user.role}</Td>
                                    <Td>
                                        <Badge $active={user.is_active}>
                                            {user.is_active ? "active" : "disabled"}
                                        </Badge>
                                    </Td>
                                    <Td>{user.created_at}</Td>
                                    <Td style={{ textAlign: "right" }}>
                                        <Button
                                            type="button"
                                            tone="ghost"
                                            size="small"
                                            onClick={() => handleEdit(user)}
                                        >
                                            Edit
                                        </Button>{" "}
                                        <Button
                                            type="button"
                                            tone="danger"
                                            size="small"
                                            onClick={() => handleDisable(user)}
                                            disabled={loading || user.is_active === false}
                                        >
                                            Disable
                                        </Button>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </TableShell>
        </>
    );
}
