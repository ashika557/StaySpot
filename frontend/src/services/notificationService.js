import { API_ENDPOINTS } from '../constants/api';
import { apiRequest } from '../utils/api';

class NotificationService {
    constructor() {
        this.socket = null;
        this.onNotificationReceived = null;
        this.shouldReconnect = true;
    }

    async getNotifications() {
        try {
            const response = await apiRequest(API_ENDPOINTS.NOTIFICATIONS);
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return await response.json();
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }
    }

    async markAsRead(id) {
        try {
            const response = await apiRequest(`${API_ENDPOINTS.NOTIFICATIONS}${id}/mark_as_read/`, {
                method: 'POST'
            });
            return response.ok;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    async markAllAsRead() {
        try {
            const response = await apiRequest(`${API_ENDPOINTS.NOTIFICATIONS}mark_all_as_read/`, {
                method: 'POST'
            });
            return response.ok;
        } catch (error) {
            console.error('Error marking all as read:', error);
            return false;
        }
    }

    connect(onNotification) {
        this.onNotificationReceived = onNotification;
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;

        this.shouldReconnect = true;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Use hostname from window to match the current site (localhost or 127.0.0.1)
        const hostname = window.location.hostname;
        const wsUrl = `${protocol}//${hostname}:8000/ws/notifications/`;

        console.log(`[NotificationService] Connecting to ${wsUrl}`);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('[NotificationService] WebSocket Connected');
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (this.onNotificationReceived) {
                    this.onNotificationReceived(data);
                }
            } catch (err) {
                console.error('[NotificationService] Error parsing message:', err);
            }
        };

        this.socket.onclose = (event) => {
            this.socket = null;
            if (this.shouldReconnect) {
                console.log(`[NotificationService] Connection lost (Code: ${event.code}). Retrying in 5s...`);
                setTimeout(() => {
                    if (this.shouldReconnect) this.connect(this.onNotificationReceived);
                }, 5000);
            } else {
                console.log('[NotificationService] Closed manually, not reconnecting.');
            }
        };

        this.socket.onerror = (error) => {
            console.error('[NotificationService] WebSocket Error:', error);
        };
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export const notificationService = new NotificationService();
