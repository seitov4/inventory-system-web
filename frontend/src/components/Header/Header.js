import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./header.css";

export default function Header() {
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const logged = Boolean(token);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <header className="ui-header">
            <div className="ui-header-inner">
                {/* ЛОГО */}
                <Link to="/" className="ui-logo">
                    RetailSystem
                </Link>

                {/* ПРАВАЯ ЧАСТЬ */}
                <div className="ui-right">
                    {logged ? (
                        <Link to="/settings" className="ui-btn-profile">
                            Профиль
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="ui-btn-login">
                                Войти
                            </Link>
                            <Link to="/register" className="ui-btn-register">
                                Зарегистрироваться
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
