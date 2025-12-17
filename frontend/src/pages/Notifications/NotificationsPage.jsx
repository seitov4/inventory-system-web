import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Layout from "../../components/Layout/Layout";
import notificationsApi from "../../api/notificationsApi";

// ===== STYLED COMPONENTS =====
const LoadingText = styled.div`
    padding: 16px;
    color: var(--text-tertiary);
    font-size: 14px;
`;

const ErrorText = styled.div`
    color: var(--error-color);
    margin-bottom: 12px;
    padding: 12px;
    background: var(--error-bg);
    border-radius: 8px;
    font-size: 14px;
`;

const NotificationsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const NotificationCard = styled.div`
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    ${props => props.$unread && `border-left: 3px solid var(--warning-color);`}
`;

const NotificationContent = styled.div`
    flex: 1;
`;

const NotificationMessage = styled.div`
    font-size: 14px;
    color: var(--text-primary);
    margin-bottom: 4px;
    font-weight: ${props => props.$unread ? '600' : '400'};
`;

const NotificationDate = styled.div`
    font-size: 12px;
    color: var(--text-tertiary);
`;

const NotificationStatus = styled.div`
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    background: ${props => props.$unread ? 'var(--warning-bg)' : 'var(--bg-tertiary)'};
    color: ${props => props.$unread ? 'var(--warning-color)' : 'var(--text-secondary)'};
    font-weight: 600;
`;

const MarkReadButton = styled.button`
    padding: 6px 12px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background: var(--primary-hover);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const EmptyState = styled.div`
    padding: 48px 24px;
    text-align: center;
    color: var(--text-tertiary);
    font-size: 14px;
`;

// ===== MAIN COMPONENT =====
export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await notificationsApi.getAll();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setError("Не удалось загрузить уведомления.");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationsApi.markAsRead(id);
            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, status: 'READ' } : n)
            );
        } catch (e) {
            console.error(e);
            alert("Не удалось отметить уведомление как прочитанное");
        }
    };

    const formatNotificationMessage = (notification) => {
        if (notification.type === 'LOW_STOCK') {
            const payload = notification.payload || {};
            return `Низкий остаток: ${payload.product_name || 'Товар'} (${payload.quantity || 0} шт., минимум: ${payload.min_stock || 0})`;
        }
        return notification.message || 'Уведомление';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Layout title="Уведомления">
            {loading && <LoadingText>Загрузка...</LoadingText>}
            {error && <ErrorText>{error}</ErrorText>}

            {!loading && notifications.length === 0 && !error && (
                <EmptyState>Нет уведомлений</EmptyState>
            )}

            {!loading && notifications.length > 0 && (
                <NotificationsList>
                    {notifications.map((notification) => {
                        const isUnread = notification.status === 'UNREAD';
                        return (
                            <NotificationCard key={notification.id} $unread={isUnread}>
                                <NotificationContent>
                                    <NotificationMessage $unread={isUnread}>
                                        {formatNotificationMessage(notification)}
                                    </NotificationMessage>
                                    <NotificationDate>
                                        {formatDate(notification.created_at)}
                                    </NotificationDate>
                                </NotificationContent>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <NotificationStatus $unread={isUnread}>
                                        {isUnread ? 'Новое' : 'Прочитано'}
                                    </NotificationStatus>
                                    {isUnread && (
                                        <MarkReadButton
                                            onClick={() => handleMarkAsRead(notification.id)}
                                        >
                                            Прочитать
                                        </MarkReadButton>
                                    )}
                                </div>
                            </NotificationCard>
                        );
                    })}
                </NotificationsList>
            )}
        </Layout>
    );
}

