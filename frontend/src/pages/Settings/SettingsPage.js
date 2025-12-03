import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout/Layout";
import { useTheme } from "../../context/ThemeContext";
import authApi from "../../api/authApi";
import usersApi from "../../api/usersApi";
import "./settings.css";

const TABS = {
    PROFILE: "profile",
    APPEARANCE: "appearance",
    EMPLOYEES: "employees",
    SYSTEM: "system",
};

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState(TABS.PROFILE);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadCurrentUser();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const res = await authApi.me();
            setCurrentUser(res.data.user);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    if (loading) {
        return (
            <Layout title="Настройки">
                <div className="settings-loading">Загрузка...</div>
            </Layout>
        );
    }

    const isAdmin = currentUser?.role === "admin" || currentUser?.role === "owner";

    return (
        <Layout title="Настройки">
            <div className="settings-page">
                <div className="settings-tabs">
                    <button
                        className={`settings-tab ${activeTab === TABS.PROFILE ? "active" : ""}`}
                        onClick={() => setActiveTab(TABS.PROFILE)}
                    >
                        Профиль
                    </button>
                    <button
                        className={`settings-tab ${activeTab === TABS.APPEARANCE ? "active" : ""}`}
                        onClick={() => setActiveTab(TABS.APPEARANCE)}
                    >
                        Внешний вид
                    </button>
                    {isAdmin && (
                        <button
                            className={`settings-tab ${activeTab === TABS.EMPLOYEES ? "active" : ""}`}
                            onClick={() => setActiveTab(TABS.EMPLOYEES)}
                        >
                            Сотрудники
                        </button>
                    )}
                    <button
                        className={`settings-tab ${activeTab === TABS.SYSTEM ? "active" : ""}`}
                        onClick={() => setActiveTab(TABS.SYSTEM)}
                    >
                        Система
                    </button>
                </div>

                <div className="settings-content">
                    {activeTab === TABS.PROFILE && (
                        <ProfileTab user={currentUser} onUpdate={loadCurrentUser} />
                    )}
                    {activeTab === TABS.APPEARANCE && <AppearanceTab />}
                    {activeTab === TABS.EMPLOYEES && isAdmin && <EmployeesTab />}
                    {activeTab === TABS.SYSTEM && <SystemTab onLogout={handleLogout} />}
                </div>
            </div>
        </Layout>
    );
}

// Вкладка Профиль
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
        // TODO: реализовать обновление профиля через API
        setTimeout(() => {
            setMessage("Профиль обновлён (функция будет реализована)");
            setSaving(false);
        }, 500);
    };

    return (
        <div className="settings-tab-content">
            <h2 className="settings-section-title">Профиль</h2>
            <p className="settings-section-subtitle">
                Управление личными данными и контактами
            </p>

            <form className="settings-form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">
                            Имя <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            className="form-input"
                            value={form.firstName}
                            onChange={handleChange}
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
                            value={form.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Телефон</label>
                        <input
                            type="tel"
                            name="phone"
                            className="form-input"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+7..."
                        />
                    </div>
                </div>

                <div className="form-info">
                    <strong>Роль:</strong> {user?.role || "—"} <br />
                    <strong>Магазин:</strong> {user?.store_name || "—"}
                </div>

                {message && <div className="form-message success">{message}</div>}

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? "Сохранение..." : "Сохранить изменения"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// Вкладка Внешний вид
function AppearanceTab() {
    const { theme, changeTheme } = useTheme();

    return (
        <div className="settings-tab-content">
            <h2 className="settings-section-title">Внешний вид</h2>
            <p className="settings-section-subtitle">
                Настройка цветовой темы интерфейса. Изменения применяются мгновенно.
            </p>

            <div className="settings-card">
                <div className="theme-options">
                    <button
                        className={`theme-option ${theme === "light" ? "active" : ""}`}
                        onClick={() => changeTheme("light")}
                    >
                        <div className="theme-preview light"></div>
                        <span>Светлая тема</span>
                    </button>
                    <button
                        className={`theme-option ${theme === "dark" ? "active" : ""}`}
                        onClick={() => changeTheme("dark")}
                    >
                        <div className="theme-preview dark"></div>
                        <span>Тёмная тема</span>
                    </button>
                    <button
                        className={`theme-option ${theme === "system" ? "active" : ""}`}
                        onClick={() => changeTheme("system")}
                    >
                        <div className="theme-preview system"></div>
                        <span>Системная тема</span>
                    </button>
                </div>
                <p className="settings-note">
                    Тема применяется моментально и сохраняется для следующего визита
                </p>
            </div>
        </div>
    );
}

// Вкладка Сотрудники
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
            setEmployees(res.data || []);
        } catch (e) {
            console.error(e);
            setError("Не удалось загрузить список сотрудников");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Удалить этого сотрудника? Это действие нельзя отменить.")) return;
        try {
            await usersApi.deleteUser(id);
            await loadEmployees();
        } catch (e) {
            console.error(e);
            const msg = e?.response?.data?.message || "Не удалось удалить сотрудника";
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
        <div className="settings-tab-content">
            <div className="settings-section-header">
                <div>
                    <h2 className="settings-section-title">Сотрудники</h2>
                    <p className="settings-section-subtitle">
                        Управление сотрудниками магазина
                    </p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    {showAddForm ? "Скрыть форму" : "Добавить сотрудника"}
                </button>
            </div>

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
                <div className="settings-loading">Загрузка сотрудников...</div>
            ) : error ? (
                <div className="settings-error">{error}</div>
            ) : (
                <div className="settings-card">
                    <table className="employees-table">
                        <thead>
                            <tr>
                                <th>Имя</th>
                                <th>Фамилия</th>
                                <th>Роль</th>
                                <th>Email / Телефон</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id}>
                                    <td>{emp.first_name || "—"}</td>
                                    <td>{emp.last_name || "—"}</td>
                                    <td>
                                        <span className="role-badge">{emp.role}</span>
                                    </td>
                                    <td>{emp.email || emp.phone || "—"}</td>
                                    <td>
                                        <button
                                            className="btn-link"
                                            onClick={() => handleEdit(emp)}
                                        >
                                            Изменить
                                        </button>
                                        <button
                                            className="btn-link danger"
                                            onClick={() => handleDelete(emp.id)}
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {employees.length === 0 && (
                        <div className="empty-state">
                            Сотрудники не найдены. Добавьте первого сотрудника.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Форма добавления сотрудника (для вкладки Сотрудники)
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
                e?.response?.data?.message || "Ошибка при добавлении сотрудника";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-card" style={{ marginBottom: 24 }}>
            <h3 className="settings-card-title">Добавить сотрудника</h3>
            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-message success">{success}</div>}

            <form className="settings-form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">
                            Имя <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            className="form-input"
                            value={form.firstName}
                            onChange={handleChange}
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
                            value={form.lastName}
                            onChange={handleChange}
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
                            value={form.contact}
                            onChange={handleChange}
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
                            value={form.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="cashier">Кассир</option>
                            <option value="manager">Менеджер</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">
                            Пароль <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            name="password"
                            className="form-input"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">&nbsp;</label>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={generatePassword}
                        >
                            Сгенерировать пароль
                        </button>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? "Сохранение..." : "Добавить сотрудника"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// Вкладка Система
function SystemTab({ onLogout }) {
    return (
        <div className="settings-tab-content">
            <h2 className="settings-section-title">Система</h2>
            <p className="settings-section-subtitle">
                Системные настройки и безопасность
            </p>

            <div className="settings-card">
                <div className="system-actions">
                    <div className="system-action-item">
                        <div>
                            <h3 className="system-action-title">Выход из аккаунта</h3>
                            <p className="system-action-description">
                                Завершите текущий сеанс и выйдите из системы
                            </p>
                        </div>
                        <button className="btn-danger" onClick={onLogout}>
                            Выйти
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Модальное окно редактирования сотрудника
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
            setError("Заполните все обязательные поля");
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
            setSuccess("Сотрудник успешно обновлён");
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1000);
        } catch (e) {
            console.error(e);
            const msg = e?.response?.data?.message || "Ошибка при обновлении сотрудника";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Редактировать сотрудника</h3>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {error && <div className="form-error">{error}</div>}
                {success && <div className="form-message success">{success}</div>}

                <form className="settings-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">
                                Имя <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                className="form-input"
                                value={form.firstName}
                                onChange={handleChange}
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
                                value={form.lastName}
                                onChange={handleChange}
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
                                value={form.contact}
                                onChange={handleChange}
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
                                value={form.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="cashier">Кассир</option>
                                <option value="manager">Менеджер</option>
                                <option value="admin">Администратор</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saving}
                        >
                            {saving ? "Сохранение..." : "Сохранить изменения"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
