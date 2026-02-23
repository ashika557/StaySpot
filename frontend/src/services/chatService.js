import { API_BASE_URL, API_ENDPOINTS, getMediaUrl } from '../constants/api';
import { getCsrfToken, apiRequest } from '../utils/api';

class ChatService {
    constructor() {
        this.socket = null;
        this.callbacks = {};
    }

    /**
     * Get list of conversations for the current user
     */
    async getConversations() {
        try {
            const endpoint = API_ENDPOINTS.CHAT || '/chat/';
            const response = await apiRequest(endpoint);

            if (!response.ok) throw new Error('Failed to fetch conversations');
            return await response.json();
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    }

    /**
     * Start formatted conversation
     */
    async startConversation(userId) {
        try {
            const endpoint = `${API_ENDPOINTS.CHAT}start_conversation/`;
            const response = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ user_id: userId })
            });

            if (!response.ok) throw new Error('Failed to start conversation');
            return await response.json();
        } catch (error) {
            console.error('Error starting conversation:', error);
            throw error;
        }
    }

    /**
     * Get messages for a specific conversation
     */
    async getMessages(conversationId) {
        try {
            const endpoint = `${API_ENDPOINTS.CHAT}${conversationId}/messages/`;
            const response = await apiRequest(endpoint);

            if (!response.ok) throw new Error('Failed to fetch messages');
            return await response.json();
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    }

    /**
     * Connect to WebSocket for a specific conversation
     */
    connect(conversationId, onMessage) {
        if (this.socket) {
            this.socket.close();
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = `${window.location.hostname}:8000`; // Dynamically use current hostname
        const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/`;

        this.socket = new WebSocket(wsUrl);
        this.onMessageReceived = onMessage;
        this.reconnectAttempts = this.reconnectAttempts || 0;
        this.maxReconnectAttempts = 5;

        console.log(`[ChatService] Connecting to WebSocket at: ${wsUrl}`);

        this.socket.onopen = () => {
            console.log(`[ChatService] Connected to conversation ${conversationId}`);
            this.reconnectAttempts = 0;
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (this.onMessageReceived) {
                this.onMessageReceived(data);
            }
        };

        this.socket.onclose = (event) => {
            console.log(`[ChatService] Connection closed: ${event.code}. Reconnecting...`);
            if (event.code !== 1000 && event.code !== 1001) {
                this.reconnect(conversationId, onMessage);
            }
        };

        this.socket.onerror = (error) => {
            console.error('[ChatService] WebSocket error:', error);
            this.socket.close();
        };
    }

    reconnect(conversationId, onMessage) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('[ChatService] Max reconnect attempts reached');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
        this.reconnectAttempts++;

        console.log(`[ChatService] Attempting reconnect in ${delay / 1000} seconds... (Attempt ${this.reconnectAttempts})`);
        setTimeout(() => {
            this.connect(conversationId, onMessage);
        }, delay);
    }

    /**
     * Send a text message via WebSocket
     */
    sendMessage(message, senderId) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'chat_message',
                message: message,
                sender_id: senderId
            }));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    /**
     * Send a seen event via WebSocket
     */
    sendSeenEvent(userId, conversationId) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'message_seen',
                user_id: userId,
                conversation_id: conversationId
            }));
        }
    }

    /**
     * Upload media via API and then notify via WebSocket
     */
    async sendMedia(conversationId, file, text, senderId, senderName) {
        const formData = new FormData();
        if (file.type.startsWith('image/')) {
            formData.append('image', file);
        } else {
            formData.append('file', file);
        }
        if (text) formData.append('text', text);

        const response = await apiRequest(`${API_ENDPOINTS.CHAT}${conversationId}/send_media/`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const savedMsg = await response.json();
            // Notify others via websocket about the new media message
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'chat_message',
                    message: savedMsg.text,
                    sender_id: senderId,
                    sender_name: senderName,
                    media_url: savedMsg.image || savedMsg.file,
                    media_type: savedMsg.image ? 'image' : 'file',
                    msg_id: savedMsg.id
                }));
            }
            return savedMsg;
        } else {
            throw new Error('Failed to upload media');
        }
    }

    /**
     * Mark messages as read via API
     */
    async markAsRead(conversationId) {
        try {
            const response = await apiRequest(`${API_ENDPOINTS.CHAT}${conversationId}/mark_as_read/`, {
                method: 'POST'
            });
            return response.ok;
        } catch (error) {
            console.error('Error marking as read:', error);
            return false;
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export const chatService = new ChatService();
