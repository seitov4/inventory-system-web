import React from "react";
import { Link } from "react-router-dom";
import "./landing.css";

const features = [
    {
        title: "Учёт товаров",
        text: "Единая база товаров с ценами, штрих-кодами и категориями. Минимальные остатки и контроль прихода."
    },
    {
        title: "Быстрые продажи (POS)",
        text: "Рабочее место кассира: поиск или сканирование товара, формирование чека и проведение оплаты."
    },
    {
        title: "Контроль остатков",
        text: "Актуальные остатки по каждому складу и магазину. Движения фиксируются в журнале операций."
    },
    {
        title: "Аналитика для владельца",
        text: "Отчёты по продажам за день, неделю и месяц. Видно, что продаётся лучше всего и где возникают дефициты."
    }
];

export default function LandingPage() {
    return (
        <div className="lp-root">
            {/* HERO */}
            <section className="lp-hero">
                <div className="lp-hero-inner">
                    <div className="lp-hero-main">
                        <h1 className="lp-hero-title">
                            Информационная система<br />
                            <span>учёта товаров для розницы</span>
                        </h1>
                        <p className="lp-hero-subtitle">
                            В одном интерфейсе — товары, склады, продажи и аналитика.
                            Система разработана как дипломный проект и отражает реальные
                            процессы работы небольшого магазина.
                        </p>

                        <div className="lp-hero-actions">
                            <Link to="/login" className="lp-btn lp-btn-primary">
                                Войти
                            </Link>
                            <Link to="/register" className="lp-btn lp-btn-secondary">
                                Зарегистрировать магазин
                            </Link>
                        </div>

                        <p className="lp-hero-note">
                            После авторизации доступны модули: <strong>Товары</strong>,{" "}
                            <strong>Склад</strong>, <strong>Продажи</strong> и{" "}
                            <strong>Отчёты</strong>.
                            {" "}Для демонстрации можно открыть дашборд по прямой ссылке
                            без авторизации: <Link to="/dashboard">демо-дашборд</Link>.
                        </p>
                    </div>

                    <div className="lp-hero-panel">
                        <div className="lp-panel-card">
                            <div className="lp-panel-header">
                                <span className="lp-panel-label">Сегодня</span>
                                <span className="lp-panel-value">₸ 0</span>
                            </div>
                            <div className="lp-panel-row">
                                <span>Продаж за день</span>
                                <span className="lp-panel-pill">ожидает backend</span>
                            </div>
                            <div className="lp-panel-row">
                                <span>Товаров в базе</span>
                                <span>—</span>
                            </div>
                            <div className="lp-panel-row">
                                <span>Позиции с низким остатком</span>
                                <span>—</span>
                            </div>
                            <div className="lp-panel-footer">
                                Эти показатели будут заполняться
                                данными после реализации backend-части.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="lp-section">
                <div className="lp-section-header">
                    <h2 className="lp-section-title">Что умеет система</h2>
                    <p className="lp-section-subtitle">
                        Архитектура построена вокруг ядра учёта: номенклатура, движения,
                        продажи и уведомления о дефиците.
                    </p>
                </div>

                <div className="lp-features-grid">
                    {features.map((f) => (
                        <div key={f.title} className="lp-feature-card">
                            <h3 className="lp-feature-title">{f.title}</h3>
                            <p className="lp-feature-text">{f.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FOOT NOTE */}
            <section className="lp-section lp-section-muted">
                <div className="lp-footnote">
                    <h3>О проекте</h3>
                    <p>
                        Данная система разработана как дипломный проект.
                        На фронтенде реализованы основные интерфейсы для работы
                        с товарами, складом и продажами. Следующий шаг — реализация
                        серверной части (REST API, авторизация, журнал движений и аналитика).
                    </p>
                </div>
            </section>
        </div>
    );
}
