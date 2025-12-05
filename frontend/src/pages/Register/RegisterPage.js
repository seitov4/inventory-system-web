import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import "./register.css";

const initialState = {
    storeName: "",
    firstName: "",
    lastName: "",
    contact: "",
    role: "owner",
    password: "",
    passwordConfirm: "",
};

const RegisterPage = () => {
    const [form, setForm] = useState(initialState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

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
            setError("Заполните все обязательные поля");
            return;
        }

        if (password !== passwordConfirm) {
            setError("Пароль и подтверждение не совпадают");
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

            const data = res.data || {};
            const token = data.token;
            if (token) {
                localStorage.setItem("token", token);
                navigate("/dashboard");
            } else {
                setError("Не удалось получить токен после регистрации");
            }
        } catch (e) {
            console.error(e);
            const msg =
                e?.response?.data?.message || "Ошибка при регистрации магазина";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">
                <h1 className="register-title">Регистрация магазина</h1>
                <p className="register-subtitle">
                    Создайте магазин и первого администратора в один шаг.
                </p>

                {error && <div className="register-error">{error}</div>}

                <form className="register-form" onSubmit={handleSubmit}>
                    <label className="register-label">
                        Название магазина
                        <input
                            type="text"
                            name="storeName"
                            className="register-input"
                            value={form.storeName}
                            onChange={handleChange}
                            placeholder="Например, Магазин у дома"
                        />
                    </label>

                    <div className="register-row">
                        <label className="register-label">
                            Имя администратора
                            <input
                                type="text"
                                name="firstName"
                                className="register-input"
                                value={form.firstName}
                                onChange={handleChange}
                                placeholder="Имя"
                            />
                        </label>
                        <label className="register-label">
                            Фамилия администратора
                            <input
                                type="text"
                                name="lastName"
                                className="register-input"
                                value={form.lastName}
                                onChange={handleChange}
                                placeholder="Фамилия"
                            />
                        </label>
                    </div>

                    <label className="register-label">
                        Телефон или Email
                        <input
                            type="text"
                            name="contact"
                            className="register-input"
                            value={form.contact}
                            onChange={handleChange}
                            placeholder="+7... или you@example.com"
                        />
                    </label>

                    <label className="register-label">
                        Роль владельца
                        <select
                            name="role"
                            className="register-input"
                            value={form.role}
                            onChange={handleChange}
                        >
                            <option value="owner">Владелец (owner)</option>
                            <option value="admin">Администратор (admin)</option>
                        </select>
                    </label>

                    <div className="register-row">
                        <label className="register-label">
                            Пароль
                            <input
                                type="password"
                                name="password"
                                className="register-input"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Придумайте пароль"
                            />
                        </label>
                        <label className="register-label">
                            Подтверждение пароля
                            <input
                                type="password"
                                name="passwordConfirm"
                                className="register-input"
                                value={form.passwordConfirm}
                                onChange={handleChange}
                                placeholder="Повторите пароль"
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="register-btn-main"
                        disabled={loading}
                    >
                        {loading ? "Создание..." : "Зарегистрировать магазин"}
                    </button>
                </form>

                <div className="register-footer-links">
                    <Link to="/login" className="register-link">
                        Уже есть аккаунт? Войти
                    </Link>
                    <Link to="/" className="register-link muted">
                        ← На главную
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
