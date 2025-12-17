import React, { useState } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import usersApi from "../../api/usersApi";

// ===== STYLED COMPONENTS =====
const PageWrapper = styled.div`
    max-width: 900px;
    width: 100%;
`;

const Card = styled.section`
    background: var(--bg-secondary);
    border-radius: 16px;
    padding: 32px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border-color);
    width: 100%;
    box-sizing: border-box;

    @media (max-width: 768px) {
        padding: 24px;
    }

    @media (max-width: 640px) {
        padding: 20px;
    }
`;

const Header = styled.div`
    margin-bottom: 24px;
`;

const Title = styled.h2`
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
`;

const Subtitle = styled.p`
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.5;
`;

const ErrorMessage = styled.div`
    margin-bottom: 16px;
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--error-bg);
    color: var(--error-color);
    font-size: 14px;
    border: 1px solid var(--error-color);
`;

const SuccessMessage = styled.div`
    margin-bottom: 16px;
    padding: 12px 16px;
    border-radius: 10px;
    background: var(--success-bg);
    color: var(--success-color);
    font-size: 14px;
    border: 1px solid var(--success-color);
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    width: 100%;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 14px;
    }

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
        gap: 12px;
    }
`;

const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    width: 100%;
`;

const FormGroupAction = styled(FormGroup)`
    align-items: flex-end;
`;

const FormLabel = styled.label`
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
`;

const Required = styled.span`
    color: var(--error-color);
`;

const FormInput = styled.input`
    width: 100%;
    min-width: 0;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 14px;
    color: var(--text-primary);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    background: var(--bg-primary);
    box-sizing: border-box;

    &::placeholder {
        color: var(--text-tertiary);
    }

    &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &:disabled {
        background: var(--bg-tertiary);
        cursor: not-allowed;
    }

    @media (max-width: 640px) {
        padding: 9px 12px;
    }
`;

const FormSelect = styled.select`
    width: 100%;
    min-width: 0;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 14px;
    color: var(--text-primary);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    background: var(--bg-primary);
    box-sizing: border-box;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    @media (max-width: 640px) {
        padding: 9px 12px;
    }
`;

const FormActions = styled.div`
    display: flex;
    justify-content: flex-start;
    margin-top: 8px;
`;

const BtnPrimary = styled.button`
    padding: 11px 24px;
    border-radius: 8px;
    border: none;
    background: var(--primary-color);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background: var(--primary-hover);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const BtnSecondary = styled.button`
    padding: 10px 18px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-secondary);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s, border-color 0.2s;

    &:hover {
        background: var(--bg-tertiary);
        border-color: var(--text-tertiary);
    }
`;

// ===== COMPONENT =====
export default function AddEmployeePage() {
    const [employee, setEmployee] = useState({
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
        setEmployee((prev) => ({ ...prev, [name]: value }));
    };

    const generatePassword = () => {
        const pwd = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);
        setEmployee((prev) => ({ ...prev, password: pwd }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const { firstName, lastName, contact, role, password } = employee;
        if (!firstName || !lastName || !contact || !password) {
            setError("Заполните все обязательные поля");
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
            setSuccess("Сотрудник успешно добавлен");
            setEmployee({
                firstName: "",
                lastName: "",
                contact: "",
                role: "cashier",
                password: "",
            });
        } catch (e) {
            console.error(e);
            const msg =
                e?.response?.data?.error || e?.response?.data?.message || e?.message || "Ошибка при добавлении сотрудника";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout title="Добавить сотрудника">
            <PageWrapper>
                <Card>
                    <Header>
                        <Title>Добавить нового сотрудника</Title>
                        <Subtitle>
                            Сотрудник получит доступ к системе в рамках текущего магазина.
                            Роль определяет уровень доступа.
                        </Subtitle>
                    </Header>

                    {error && <ErrorMessage>{error}</ErrorMessage>}
                    {success && <SuccessMessage>{success}</SuccessMessage>}

                    <Form onSubmit={handleSubmit}>
                        <FormRow>
                            <FormGroup>
                                <FormLabel>
                                    Имя <Required>*</Required>
                                </FormLabel>
                                <FormInput
                                    type="text"
                                    name="firstName"
                                    value={employee.firstName}
                                    onChange={handleChange}
                                    placeholder="Имя сотрудника"
                                    required
                                />
                            </FormGroup>

                            <FormGroup>
                                <FormLabel>
                                    Фамилия <Required>*</Required>
                                </FormLabel>
                                <FormInput
                                    type="text"
                                    name="lastName"
                                    value={employee.lastName}
                                    onChange={handleChange}
                                    placeholder="Фамилия сотрудника"
                                    required
                                />
                            </FormGroup>
                        </FormRow>

                        <FormRow>
                            <FormGroup>
                                <FormLabel>
                                    Телефон или Email <Required>*</Required>
                                </FormLabel>
                                <FormInput
                                    type="text"
                                    name="contact"
                                    value={employee.contact}
                                    onChange={handleChange}
                                    placeholder="+7... или you@example.com"
                                    required
                                />
                            </FormGroup>

                            <FormGroup>
                                <FormLabel>
                                    Роль <Required>*</Required>
                                </FormLabel>
                                <FormSelect
                                    name="role"
                                    value={employee.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="cashier">Кассир (cashier)</option>
                                    <option value="manager">Менеджер (manager)</option>
                                    <option value="admin">Администратор (admin)</option>
                                </FormSelect>
                            </FormGroup>
                        </FormRow>

                        <FormRow>
                            <FormGroup>
                                <FormLabel>
                                    Пароль <Required>*</Required>
                                </FormLabel>
                                <FormInput
                                    type="text"
                                    name="password"
                                    value={employee.password}
                                    onChange={handleChange}
                                    placeholder="Задайте или сгенерируйте пароль"
                                    required
                                />
                            </FormGroup>

                            <FormGroupAction>
                                <FormLabel>&nbsp;</FormLabel>
                                <BtnSecondary type="button" onClick={generatePassword}>
                                    Сгенерировать пароль
                                </BtnSecondary>
                            </FormGroupAction>
                        </FormRow>

                        <FormActions>
                            <BtnPrimary type="submit" disabled={saving}>
                                {saving ? "Сохранение..." : "Добавить сотрудника"}
                            </BtnPrimary>
                        </FormActions>
                    </Form>
                </Card>
            </PageWrapper>
        </Layout>
    );
}

