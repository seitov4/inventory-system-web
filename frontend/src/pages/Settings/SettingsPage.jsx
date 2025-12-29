import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import Layout from "../../components/Layout/Layout";
import { useTheme } from "../../context/ThemeContext";
import { usePage } from "../../context/PageContext";
import authApi from "../../api/authApi";
import usersApi from "../../api/usersApi";

// ===== ANIMATIONS =====
const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

// ===== STYLED COMPONENTS =====
const SettingsPageWrapper = styled.div`
    max-width: 1000px;
    margin: 0 auto;
`;

const LoadingText = styled.div`
    padding: 24px;
    text-align: center;
    color: #64748b;
    font-size: 14px;
`;

const ErrorText = styled.div`
    padding: 24px;
    text-align: center;
    color: #b91c1c;
    background: #fef2f2;
    border-radius: 10px;
    border: 1px solid #fecaca;
    font-size: 14px;
`;

const TabsContainer = styled.div`
    display: flex;
    gap: 4px;
    margin-bottom: 24px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 0;
    overflow-x: auto;
    scrollbar-width: none;
    
    &::-webkit-scrollbar {
        display: none;
    }

    @media (max-width: 768px) {
        overflow-x: auto;
    }
`;

const Tab = styled.button`
    padding: 12px 20px;
    border: none;
    background: transparent;
    color: ${props => props.$active ? '#0ea5e9' : '#64748b'};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border-bottom: 2px solid ${props => props.$active ? '#0ea5e9' : 'transparent'};
    margin-bottom: -2px;
    transition: color 0.2s ease, border-color 0.2s ease;
    white-space: nowrap;

    &:hover {
        color: #0f172a;
    }
`;

const ContentContainer = styled.div`
    background: #ffffff;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
    border: 1px solid rgba(148, 163, 184, 0.2);

    @media (max-width: 768px) {
        padding: 20px;
    }
`;

const TabContent = styled.div`
    animation: ${fadeIn} 0.2s ease;
`;

const SectionTitle = styled.h2`
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
`;

const SectionSubtitle = styled.p`
    margin: 0 0 24px;
    font-size: 14px;
    color: #64748b;
`;

const SectionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
    }
`;

const SettingsCard = styled.div`
    background: #f8fafc;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #e2e8f0;
    margin-bottom: ${props => props.$marginBottom || '0'}px;
`;

const CardTitle = styled.h3`
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
`;

const SettingsNote = styled.p`
    margin: 16px 0 0;
    font-size: 13px;
    color: #64748b;
    font-style: italic;
`;

// Form Styles
const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const FormLabel = styled.label`
    font-size: 13px;
    font-weight: 600;
    color: #475569;
`;

const Required = styled.span`
    color: #b91c1c;
`;

const FormInput = styled.input`
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 14px;
    color: #0f172a;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    background: #ffffff;

    &:focus {
        outline: none;
        border-color: #0ea5e9;
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
`;

const FormSelect = styled.select`
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 14px;
    color: #0f172a;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    background: #ffffff;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: #0ea5e9;
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
`;

const FormInfo = styled.div`
    padding: 12px 16px;
    background: #f1f5f9;
    border-radius: 8px;
    font-size: 13px;
    color: #475569;
    line-height: 1.6;
`;

const FormMessage = styled.div`
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    background: #ecfdf3;
    color: #166534;
    border: 1px solid #bbf7d0;
`;

const FormError = styled.div`
    padding: 12px 16px;
    border-radius: 10px;
    background: #fef2f2;
    color: #b91c1c;
    font-size: 14px;
    border: 1px solid #fecaca;
    margin-bottom: 16px;
`;

const FormActions = styled.div`
    display: flex;
    justify-content: flex-start;
    gap: 12px;
    margin-top: 8px;
`;

// Button Styles
const BtnPrimary = styled.button`
    padding: 11px 24px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #0ea5e9, #3b82f6);
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);

    &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
`;

const BtnSecondary = styled.button`
    padding: 10px 18px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;

    &:hover {
        background: #f8fafc;
        border-color: #94a3b8;
    }
`;

const BtnLink = styled.button`
    background: none;
    border: none;
    color: ${props => props.$danger ? '#b91c1c' : '#0ea5e9'};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 8px;
    margin-right: 12px;
    transition: color 0.2s ease;

    &:hover {
        color: ${props => props.$danger ? '#991b1b' : '#0284c7'};
    }
`;

const BtnDanger = styled.button`
    padding: 10px 20px;
    border-radius: 10px;
    border: 1px solid #fca5a5;
    background: #fee2e2;
    color: #b91c1c;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;

    &:hover {
        background: #fecaca;
        border-color: #f87171;
    }
`;

// Theme Options
const ThemeOptions = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const ThemeOption = styled.button`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px;
    border-radius: 12px;
    border: 2px solid ${props => props.$active ? '#0ea5e9' : '#e2e8f0'};
    background: ${props => props.$active ? '#eff6ff' : '#ffffff'};
    cursor: pointer;
    transition: border-color 0.2s ease, transform 0.2s ease;

    &:hover {
        border-color: #cbd5e1;
        transform: translateY(-2px);
    }

    span {
        font-size: 13px;
        font-weight: 600;
        color: #475569;
    }
`;

const ThemePreview = styled.div`
    width: 60px;
    height: 40px;
    border-radius: 8px;
    border: 2px solid #cbd5e1;
    background: ${props => {
        if (props.$theme === 'light') return 'linear-gradient(to bottom, #ffffff 50%, #f8fafc 50%)';
        if (props.$theme === 'dark') return 'linear-gradient(to bottom, #1e293b 50%, #0f172a 50%)';
        return 'linear-gradient(to bottom, #ffffff 50%, #1e293b 50%)';
    }};
`;

// Table Styles
const EmployeesTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;

    @media (max-width: 768px) {
        font-size: 12px;
    }

    thead {
        background: #f8fafc;
    }

    th {
        text-align: left;
        padding: 12px;
        font-weight: 600;
        color: #475569;
        border-bottom: 2px solid #e2e8f0;

        @media (max-width: 768px) {
            padding: 8px;
        }
    }

    td {
        padding: 12px;
        border-bottom: 1px solid #e2e8f0;
        color: #0f172a;

        @media (max-width: 768px) {
            padding: 8px;
        }
    }

    tbody tr:hover {
        background: #f8fafc;
    }
`;

const RoleBadge = styled.span`
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    background: #e0f2fe;
    color: #0369a1;
`;

const EmptyState = styled.div`
    padding: 32px;
    text-align: center;
    color: #64748b;
    font-size: 14px;
`;

// System Actions
const SystemActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const SystemActionItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid #e2e8f0;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
`;

const SystemActionTitle = styled.h3`
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
`;

const SystemActionDescription = styled.p`
    margin: 0;
    font-size: 13px;
    color: #64748b;
`;

// Modal Styles
const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
`;

const ModalContent = styled.div`
    background: var(--bg-secondary, #ffffff);
    border-radius: 16px;
    padding: 24px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg, 0 6px 20px rgba(15, 23, 42, 0.06));
    border: 1px solid var(--border-color-light, rgba(148, 163, 184, 0.2));

    @media (max-width: 768px) {
        padding: 20px;
        max-width: 100%;
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--text-primary, #0f172a);
`;

const ModalClose = styled.button`
    background: none;
    border: none;
    font-size: 32px;
    color: var(--text-tertiary, #64748b);
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: background 0.2s ease, color 0.2s ease;

    &:hover {
        background: var(--bg-hover, #f8fafc);
        color: var(--text-primary, #0f172a);
    }
`;

// ===== TAB CONSTANTS =====
const TABS = {
    PROFILE: "profile",
    APPEARANCE: "appearance",
    EMPLOYEES: "employees",
    SYSTEM: "system",
};

// ===== MAIN COMPONENT =====
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState(TABS.PROFILE);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { setActivePage } = usePage();

    useEffect(() => {
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const res = await authApi.me();
            setCurrentUser(res?.user || null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setActivePage("login");
    };

    if (loading) {
        return (
            <Layout title="Settings">
                <LoadingText>Loading...</LoadingText>
            </Layout>
        );
    }

    const isAdmin = currentUser?.role === "admin" || currentUser?.role === "owner";

    return (
        <Layout title="Settings">
            <SettingsPageWrapper>
                <TabsContainer>
                    <Tab
                        $active={activeTab === TABS.PROFILE}
                        onClick={() => setActiveTab(TABS.PROFILE)}
                    >
                        Profile
                    </Tab>
                    <Tab
                        $active={activeTab === TABS.APPEARANCE}
                        onClick={() => setActiveTab(TABS.APPEARANCE)}
                    >
                        Appearance
                    </Tab>
                    {isAdmin && (
                        <Tab
                            $active={activeTab === TABS.EMPLOYEES}
                            onClick={() => setActiveTab(TABS.EMPLOYEES)}
                        >
                            Employees
                        </Tab>
                    )}
                    <Tab
                        $active={activeTab === TABS.SYSTEM}
                        onClick={() => setActiveTab(TABS.SYSTEM)}
                    >
                        System
                    </Tab>
                </TabsContainer>

                <ContentContainer>
                    {activeTab === TABS.PROFILE && (
                        <ProfileTab user={currentUser} onUpdate={loadCurrentUser} />
                    )}
                    {activeTab === TABS.APPEARANCE && <AppearanceTab />}
                    {activeTab === TABS.EMPLOYEES && isAdmin && <EmployeesTab />}
                    {activeTab === TABS.SYSTEM && <SystemTab onLogout={handleLogout} />}
                </ContentContainer>
            </SettingsPageWrapper>
        </Layout>
    );
}

// ===== PROFILE TAB =====
function ProfileTab({ user, onUpdate }) {
    const [form, setForm] = useState({
        firstName: user?.first_name || "",
        lastName: user?.last_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setTimeout(() => {
            setMessage("Profile updated (feature will be implemented)");
            setSaving(false);
        }, 500);
    };

    return (
        <TabContent>
            <SectionTitle>Profile</SectionTitle>
            <SectionSubtitle>
                Manage personal data and contacts
            </SectionSubtitle>

            <Form onSubmit={handleSubmit}>
                <FormRow>
                    <FormGroup>
                        <FormLabel>
                            First name <Required>*</Required>
                        </FormLabel>
                        <FormInput
                            type="text"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>
                            Last name <Required>*</Required>
                        </FormLabel>
                        <FormInput
                            type="text"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>
                </FormRow>

                <FormRow>
                    <FormGroup>
                        <FormLabel>Email</FormLabel>
                        <FormInput
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                        />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>Phone</FormLabel>
                        <FormInput
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+1..."
                        />
                    </FormGroup>
                </FormRow>

                <FormInfo>
                    <strong>Role:</strong> {user?.role || "—"} <br />
                    <strong>Store:</strong> {user?.store_name || "—"}
                </FormInfo>

                {message && <FormMessage>{message}</FormMessage>}

                <FormActions>
                    <BtnPrimary type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save changes"}
                    </BtnPrimary>
                </FormActions>
            </Form>
        </TabContent>
    );
}

// ===== APPEARANCE TAB =====
function AppearanceTab() {
    const { theme, changeTheme } = useTheme();

    return (
        <TabContent>
            <SectionTitle>Appearance</SectionTitle>
            <SectionSubtitle>
                Configure interface color theme. Changes are applied instantly.
            </SectionSubtitle>

            <SettingsCard>
                <ThemeOptions>
                    <ThemeOption
                        $active={theme === "light"}
                        onClick={() => changeTheme("light")}
                    >
                        <ThemePreview $theme="light" />
                        <span>Light theme</span>
                    </ThemeOption>
                    <ThemeOption
                        $active={theme === "dark"}
                        onClick={() => changeTheme("dark")}
                    >
                        <ThemePreview $theme="dark" />
                        <span>Dark theme</span>
                    </ThemeOption>
                    <ThemeOption
                        $active={theme === "system"}
                        onClick={() => changeTheme("system")}
                    >
                        <ThemePreview $theme="system" />
                        <span>System theme</span>
                    </ThemeOption>
                </ThemeOptions>
                <SettingsNote>
                    Theme is applied instantly and saved for your next visit
                </SettingsNote>
            </SettingsCard>
        </TabContent>
    );
}

// ===== EMPLOYEES TAB =====
function EmployeesTab() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const res = await usersApi.getAll();
            setEmployees(Array.isArray(res) ? res : []);
        } catch (e) {
            console.error(e);
            setError("Failed to load employees list");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this employee? This action cannot be undone.")) return;
        try {
            await usersApi.deleteUser(id);
            await loadEmployees();
        } catch (e) {
            console.error(e);
            const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Failed to delete employee";
            alert(msg);
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
    };

    const handleCloseEdit = () => {
        setEditingEmployee(null);
    };

    const handleUpdateSuccess = () => {
        setEditingEmployee(null);
        loadEmployees();
    };

    return (
        <TabContent>
            <SectionHeader>
                <div>
                    <SectionTitle>Employees</SectionTitle>
                    <SectionSubtitle>
                        Manage store employees
                    </SectionSubtitle>
                </div>
                <BtnPrimary onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? "Hide form" : "Add employee"}
                </BtnPrimary>
            </SectionHeader>

            {showAddForm && (
                <AddEmployeeForm
                    onSuccess={() => {
                        setShowAddForm(false);
                        loadEmployees();
                    }}
                />
            )}

            {editingEmployee && (
                <EmployeeEditModal
                    employee={editingEmployee}
                    onClose={handleCloseEdit}
                    onSuccess={handleUpdateSuccess}
                />
            )}

            {loading ? (
                <LoadingText>Loading employees...</LoadingText>
            ) : error ? (
                <ErrorText>{error}</ErrorText>
            ) : (
                <SettingsCard>
                    <EmployeesTable>
                        <thead>
                            <tr>
                                <th>First name</th>
                                <th>Last name</th>
                                <th>Role</th>
                                <th>Email / Phone</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id}>
                                    <td>{emp.first_name || "—"}</td>
                                    <td>{emp.last_name || "—"}</td>
                                    <td>
                                        <RoleBadge>{emp.role}</RoleBadge>
                                    </td>
                                    <td>{emp.email || emp.phone || "—"}</td>
                                    <td>
                                        <BtnLink onClick={() => handleEdit(emp)}>
                                            Edit
                                        </BtnLink>
                                        <BtnLink $danger onClick={() => handleDelete(emp.id)}>
                                            Delete
                                        </BtnLink>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </EmployeesTable>
                    {employees.length === 0 && (
                        <EmptyState>
                            No employees found. Add the first employee.
                        </EmptyState>
                    )}
                </SettingsCard>
            )}
        </TabContent>
    );
}

// ===== ADD EMPLOYEE FORM =====
function AddEmployeeForm({ onSuccess }) {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        contact: "",
        role: "cashier",
        password: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const generatePassword = () => {
        const pwd = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);
        setForm((prev) => ({ ...prev, password: pwd }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const { firstName, lastName, contact, role, password } = form;
        if (!firstName || !lastName || !contact || !password) {
            setError("Fill in all required fields");
            return;
        }

        try {
            setSaving(true);
            await usersApi.createEmployee({
                firstName,
                lastName,
                contact,
                role,
                password,
            });
            setSuccess("Employee successfully added");
            setForm({
                firstName: "",
                lastName: "",
                contact: "",
                role: "cashier",
                password: "",
            });
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1000);
        } catch (e) {
            console.error(e);
            const msg =
                e?.response?.data?.error || e?.response?.data?.message || e?.message || "Error adding employee";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsCard $marginBottom={24}>
            <CardTitle>Add employee</CardTitle>
            {error && <FormError>{error}</FormError>}
            {success && <FormMessage>{success}</FormMessage>}

            <Form onSubmit={handleSubmit}>
                <FormRow>
                    <FormGroup>
                        <FormLabel>
                            First name <Required>*</Required>
                        </FormLabel>
                        <FormInput
                            type="text"
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>
                            Last name <Required>*</Required>
                        </FormLabel>
                        <FormInput
                            type="text"
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>
                </FormRow>

                <FormRow>
                    <FormGroup>
                        <FormLabel>
                            Phone or Email <Required>*</Required>
                        </FormLabel>
                        <FormInput
                            type="text"
                            name="contact"
                            value={form.contact}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>
                            Role <Required>*</Required>
                        </FormLabel>
                        <FormSelect
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="cashier">Cashier</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Administrator</option>
                        </FormSelect>
                    </FormGroup>
                </FormRow>

                <FormRow>
                    <FormGroup>
                        <FormLabel>
                            Password <Required>*</Required>
                        </FormLabel>
                        <FormInput
                            type="text"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>
                    <FormGroup>
                        <FormLabel>&nbsp;</FormLabel>
                        <BtnSecondary type="button" onClick={generatePassword}>
                            Generate password
                        </BtnSecondary>
                    </FormGroup>
                </FormRow>

                <FormActions>
                    <BtnPrimary type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Add employee"}
                    </BtnPrimary>
                </FormActions>
            </Form>
        </SettingsCard>
    );
}

// ===== SYSTEM TAB =====
function SystemTab({ onLogout }) {
    return (
        <TabContent>
            <SectionTitle>System</SectionTitle>
            <SectionSubtitle>
                System settings and security
            </SectionSubtitle>

            <SettingsCard>
                <SystemActions>
                    <SystemActionItem>
                        <div>
                            <SystemActionTitle>Logout</SystemActionTitle>
                            <SystemActionDescription>
                                End current session and log out of the system
                            </SystemActionDescription>
                        </div>
                        <BtnDanger onClick={onLogout}>
                            Logout
                        </BtnDanger>
                    </SystemActionItem>
                </SystemActions>
            </SettingsCard>
        </TabContent>
    );
}

// ===== EMPLOYEE EDIT MODAL =====
function EmployeeEditModal({ employee, onClose, onSuccess }) {
    const [form, setForm] = useState({
        firstName: employee.first_name || "",
        lastName: employee.last_name || "",
        contact: employee.email || employee.phone || "",
        role: employee.role || "cashier",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const { firstName, lastName, contact, role } = form;
        if (!firstName || !lastName || !contact) {
            setError("Fill in all required fields");
            return;
        }

        try {
            setSaving(true);
            await usersApi.updateUser(employee.id, {
                firstName,
                lastName,
                contact,
                role,
            });
            setSuccess("Employee successfully updated");
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1000);
        } catch (e) {
            console.error(e);
            const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Error updating employee";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>Edit employee</ModalTitle>
                    <ModalClose onClick={onClose}>×</ModalClose>
                </ModalHeader>

                {error && <FormError>{error}</FormError>}
                {success && <FormMessage>{success}</FormMessage>}

                <Form onSubmit={handleSubmit}>
                    <FormRow>
                        <FormGroup>
                            <FormLabel>
                                First name <Required>*</Required>
                            </FormLabel>
                            <FormInput
                                type="text"
                                name="firstName"
                                value={form.firstName}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <FormLabel>
                                Last name <Required>*</Required>
                            </FormLabel>
                            <FormInput
                                type="text"
                                name="lastName"
                                value={form.lastName}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>
                    </FormRow>

                    <FormRow>
                        <FormGroup>
                            <FormLabel>
                                Phone or Email <Required>*</Required>
                            </FormLabel>
                            <FormInput
                                type="text"
                                name="contact"
                                value={form.contact}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <FormLabel>
                                Role <Required>*</Required>
                            </FormLabel>
                            <FormSelect
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="cashier">Cashier</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Administrator</option>
                            </FormSelect>
                        </FormGroup>
                    </FormRow>

                    <FormActions>
                        <BtnSecondary type="button" onClick={onClose} disabled={saving}>
                            Cancel
                        </BtnSecondary>
                        <BtnPrimary type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save changes"}
                        </BtnPrimary>
                    </FormActions>
                </Form>
            </ModalContent>
        </ModalOverlay>
    );
}

