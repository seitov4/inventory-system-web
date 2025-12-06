import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import "./login.css";

const LoginPage = () => {
    const [loginValue, setLoginValue] = useState("");
    const [pass, setPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        setError("");

        if (!loginValue || !pass) {
            setError("Введите логин (email или телефон) и пароль");
            return;
        }

        try {
            setLoading(true);
            const res = await authApi.login(loginValue, pass);
            const data = res.data || {};
            const token = data.token || data.accessToken;
            if (!token) {
                throw new Error("Токен не получен от сервера");
            }

            localStorage.setItem("token", token);
            navigate("/dashboard");
        } catch (e) {
            console.error(e);
            const msg =
                e?.response?.data?.message ||
                "Не удалось войти. Проверьте логин и пароль.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!loading) handleLogin();
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h1 className="login-title">Вход в систему</h1>
                <p className="login-subtitle">
                    Введите логин и пароль сотрудника, чтобы продолжить.
                </p>

                {error && <div className="login-error">{error}</div>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <label className="login-label">
                        Логин (email или телефон)
                        <input
                            type="text"
                            className="login-input"
                            value={loginValue}
                            onChange={(e) => setLoginValue(e.target.value)}
                            placeholder="+7... или you@example.com"
                            autoFocus
                            disabled={loading}
                            required
                        />
                    </label>

                    <label className="login-label">
                        Пароль
                        <input
                            type="password"
                            className="login-input"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            placeholder="Введите пароль"
                            disabled={loading}
                            required
                        />
                    </label>

                    <button
                        type="submit"
                        className="login-btn-main"
                        disabled={loading || !loginValue || !pass}
                    >
                        {loading ? "Вход..." : "Войти"}
                    </button>
                </form>

                <div className="login-links">
                    <Link className="primary-link" to="/register">
                        Нет аккаунта? Зарегистрировать магазин
                    </Link>
                    <Link className="back-btn" to="/">
                        ← Вернуться на сайт
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

