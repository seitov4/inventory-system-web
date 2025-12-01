import React from "react";

export default function SettingsPage() {
    return (
        <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>
                Настройки системы
            </h1>

            <p style={{ marginBottom: 16, color: "#475569" }}>
                Здесь в дальнейшем можно будет:
            </p>
            <ul style={{ marginLeft: 18, color: "#475569" }}>
                <li>управлять пользователями и ролями (кассир, менеджер, владелец);</li>
                <li>добавлять магазины и склады;</li>
                <li>настраивать пороги минимальных остатков;</li>
                <li>подключать email / SMS-уведомления.</li>
            </ul>

            <p style={{ marginTop: 16, color: "#64748b" }}>
                Для дипломной версии эти настройки описаны в документации и будут
                реализованы на стороне backend в виде конфигурационных таблиц.
            </p>
        </div>
    );
}
