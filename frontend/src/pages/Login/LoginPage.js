import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./login.css";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Вход в систему</h2>

                <input
                    type="text"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    className="login-input"
                />

                <button className="login-btn-main">Войти</button>

                <Link className="back-btn" to="/">
                    ← Вернуться на сайт
                </Link>
            </div>
        </div>
    );
};

export default LoginPage;
