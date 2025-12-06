import React, { useState } from "react";
import Layout from "../../components/Layout/Layout";
import usersApi from "../../api/usersApi";
import "./addEmployee.css";

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
                e?.response?.data?.message || "Ошибка при добавлении сотрудника";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout title="Добавить сотрудника">
            <div className="add-employee-page">
                <section className="add-employee-card">
                    <div className="add-employee-header">
                        <h2 className="add-employee-title">
                            Добавить нового сотрудника
                        </h2>
                        <p className="add-employee-subtitle">
                            Сотрудник получит доступ к системе в рамках текущего магазина.
                            Роль определяет уровень доступа.
                        </p>
                    </div>

                    {error && (
                        <div className="add-employee-error">{error}</div>
                    )}
                    {success && (
                        <div className="add-employee-success">{success}</div>
                    )}

                    <form className="add-employee-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Имя <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    className="form-input"
                                    value={employee.firstName}
                                    onChange={handleChange}
                                    placeholder="Имя сотрудника"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Фамилия <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    className="form-input"
                                    value={employee.lastName}
                                    onChange={handleChange}
                                    placeholder="Фамилия сотрудника"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    Телефон или Email <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="contact"
                                    className="form-input"
                                    value={employee.contact}
                                    onChange={handleChange}
                                    placeholder="+7... или you@example.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Роль <span className="required">*</span>
                                </label>
                                <select
                                    name="role"
                                    className="form-input"
                                    value={employee.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="cashier">Кассир (cashier)</option>
                                    <option value="manager">Менеджер (manager)</option>
                                    <option value="admin">Администратор (admin)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group form-group-password">
                                <label className="form-label">
                                    Пароль <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="password"
                                    className="form-input"
                                    value={employee.password}
                                    onChange={handleChange}
                                    placeholder="Задайте или сгенерируйте пароль"
                                    required
                                />
                            </div>

                            <div className="form-group form-group-action">
                                <label className="form-label">&nbsp;</label>
                                <button
                                    type="button"
                                    onClick={generatePassword}
                                    className="btn-secondary"
                                >
                                    Сгенерировать пароль
                                </button>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary"
                            >
                                {saving ? "Сохранение..." : "Добавить сотрудника"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </Layout>
    );
}

