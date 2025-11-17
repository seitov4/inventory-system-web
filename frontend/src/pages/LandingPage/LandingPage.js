import React from "react";
import { Link } from "react-router-dom";
import "./landing.css";

const LandingPage = () => {
    return (
        <div className="landing-container">
            <header className="landing-header">
                <div className="logo">RetailSystem</div>
                <nav>
                    <Link to="/login" className="login-btn">
                        Войти
                    </Link>
                </nav>
            </header>

            <main className="landing-main">
                <h1>Управляйте товарами легко и удобно</h1>
                <p className="subtitle">
                    Современная система учёта, продажи и аналитики для розничных магазинов.
                </p>

                <Link to="/login" className="cta-btn">
                    Войти в аккаунт
                </Link>

                <img
                    src="https://dummyimage.com/1200x400/ededed/aaa&text=Dashboard+Preview"
                    alt="preview"
                    className="preview-img"
                />
            </main>
        </div>
    );
};

export default LandingPage;
