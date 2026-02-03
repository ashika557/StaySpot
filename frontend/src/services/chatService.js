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
    connect(conversationId, onMessageReceived) {
        if (this.socket) {
            this.socket.close();
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = 'localhost:8000'; // Adjust if backend is on different port/host
        const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/`;

        this.socket = new WebSocket(wsUrl);

        console.log(`[ChatService] Connecting to WebSocket at: ${wsUrl}`);

        this.socket.onopen = () => {
            console.log('WebSocket Connected');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (onMessageReceived) {
                onMessageReceived(data);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket Disconnected');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }

    /**
     * Send a message via WebSocket
     */
    sendMessage(message, senderId) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                message: message,
                sender_id: senderId
            }));
        } else {
            console.error('WebSocket is not connected');
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
