import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import "./login.css";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        setError("");

        if (!email || !pass) {
            setError("Введите email и пароль");
            return;
        }

        try {
            setLoading(true);
            // authApi.login возвращает Axios-response
            const res = await authApi.login(email, pass);
            const data = res.data || {};

            // подстрой под свой backend:
            // например, data.token или data.accessToken
            const token = data.token || data.accessToken;
            if (!token) {
                throw new Error("Токен не получен от сервера");
            }

            localStorage.setItem("token", token);
            navigate("/dashboard");
        } catch (e) {
            console.error(e);
            setError("Не удалось войти. Проверьте логин и пароль.");
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
                    Введите учетные данные сотрудника, чтобы продолжить.
                </p>

                {error && <div className="login-error">{error}</div>}

                <form className="login-form" onSubmit={handleSubmit}>
                    <label className="login-label">
                        Email
                        <input
                            type="email"
                            className="login-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
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
                        />
                    </label>

                    <button
                        type="submit"
                        className="login-btn-main"
                        disabled={loading}
                    >
                        {loading ? "Вход..." : "Войти"}
                    </button>
                </form>

                <Link className="back-btn" to="/">
                    ← Вернуться на сайт
                </Link>
            </div>
        </div>
    );
};

export default LoginPage;
