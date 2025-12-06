import React from "react";
import "./footer.css";

export default function Footer() {
    return (
        <footer className="ui-footer">
            <div className="ui-footer-inner">
                <div className="ui-footer-left">
                    <div className="ui-footer-title">RetailSystem</div>
                    <p className="ui-footer-desc">
                        Дипломный проект: система учёта товаров, складов и продаж
                        для розничных предприятий.
                    </p>
                </div>

                <div className="ui-footer-right">
                    <div className="ui-footer-col">
                        <div className="ui-footer-col-title">Разделы</div>
                        <a href="/dashboard">Дашборд</a>
                        <a href="/products">Товары</a>
                        <a href="/warehouse">Склад</a>
                        <a href="/sales">Продажи</a>
                    </div>

                    <div className="ui-footer-col">
                        <div className="ui-footer-col-title">Проект</div>
                        <a href="/">О системе</a>
                        <a href="/settings">Настройки</a>
                        <span className="ui-footer-muted">v1.0 (MVP)</span>
                    </div>
                </div>
            </div>

            <div className="ui-footer-bottom">
                © {new Date().getFullYear()} RetailSystem
            </div>
        </footer>
    );
}
