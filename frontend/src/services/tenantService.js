import { apiRequest } from '../utils/api';

export const dashboardService = {
    // Get aggregated dashboard data
    getDashboardData: async () => {
        try {
            const response = await apiRequest('/tenant/dashboard/');
            if (!response.ok) throw new Error('Failed to fetch dashboard data');
            return await response.json();
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    },
};

export const bookingService = {
    // Get all bookings for current user
    getAllBookings: async () => {
        try {
            const response = await apiRequest('/bookings/');
            if (!response.ok) throw new Error('Failed to fetch bookings');
            return await response.json();
        } catch (error) {
            console.error('Error fetching bookings:', error);
            throw error;
        }
    },

    // Get current active booking
    getCurrentBooking: async () => {
        try {
            const response = await apiRequest('/bookings/');
            if (!response.ok) throw new Error('Failed to fetch current booking');
            const data = await response.json();
            return data.find(booking => booking.status === 'Active') || null;
        } catch (error) {
            console.error('Error fetching current booking:', error);
            throw error;
        }
    },

    // Create new booking
    createBooking: async (bookingData) => {
        try {
            const response = await apiRequest('/bookings/', {
                method: 'POST',
                body: JSON.stringify(bookingData),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || 'Failed to create booking');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    },
};

export const visitService = {
    // Get all visits
    getAllVisits: async () => {
        try {
            const response = await apiRequest('/visits/');
            if (!response.ok) throw new Error('Failed to fetch visits');
            return await response.json();
        } catch (error) {
            console.error('Error fetching visits:', error);
            throw error;
        }
    },

    // Get upcoming visits
    getUpcomingVisits: async () => {
        try {
            const response = await apiRequest('/visits/');
            if (!response.ok) throw new Error('Failed to fetch upcoming visits');
            const data = await response.json();
            const today = new Date().toISOString().split('T')[0];
            return data.filter(
                visit => visit.status === 'Scheduled' && visit.visit_date >= today
            );
        } catch (error) {
            console.error('Error fetching upcoming visits:', error);
            throw error;
        }
    },

    // Create new visit
    createVisit: async (visitData) => {
        try {
            const response = await apiRequest('/visits/', {
                method: 'POST',
                body: JSON.stringify(visitData),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.detail || 'Failed to create visit');
            }
            return await response.json();
        } catch (error) {
            console.error('Error creating visit:', error);
            throw error;
        }
    },

    // Update visit status
    updateVisitStatus: async (visitId, status) => {
        try {
            const response = await apiRequest(`/visits/${visitId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            if (!response.ok) throw new Error('Failed to update visit status');
            return await response.json();
        } catch (error) {
            console.error('Error updating visit status:', error);
            throw error;
        }
    },
};

export const paymentService = {
    // Get all payments
    getAllPayments: async () => {
        try {
            const response = await apiRequest('/payments/');
            if (!response.ok) throw new Error('Failed to fetch payments');
            return await response.json();
        } catch (error) {
            console.error('Error fetching payments:', error);
            throw error;
        }
    },

    // Get payment reminders (pending and overdue)
    getPaymentReminders: async () => {
        try {
            const response = await apiRequest('/payments/');
            if (!response.ok) throw new Error('Failed to fetch payment reminders');
            const data = await response.json();
            return data.filter(
                payment => payment.status === 'Pending' || payment.status === 'Overdue'
            );
        } catch (error) {
            console.error('Error fetching payment reminders:', error);
            throw error;
        }
    },

    // Get signed parameters for eSewa v2 initiation
    getEsewaParams: async (paymentId) => {
        try {
            const response = await apiRequest(`/payments/${paymentId}/get_esewa_params/`);
            if (!response.ok) throw new Error('Failed to get eSewa parameters');
            return await response.json();
        } catch (error) {
            console.error('Error getting eSewa parameters:', error);
            throw error;
        }
    },

    // Verify eSewa payment v2
    verifyEsewaPayment: async (paymentId, data) => {
        try {
            const response = await apiRequest(`/payments/${paymentId}/verify_esewa/`, {
                method: 'POST',
                body: JSON.stringify({ data }),
            });
            if (!response.ok) throw new Error('Failed to verify eSewa payment');
            return await response.json();
        } catch (error) {
            console.error('Error verifying eSewa payment:', error);
            throw error;
        }
    },

    // Initiate Khalti payment V2
    initiateKhaltiPayment: async (paymentId, returnUrl = null) => {
        try {
            const response = await apiRequest(`/payments/${paymentId}/initiate_khalti/`, {
                method: 'POST',
                body: JSON.stringify({
                    return_url: returnUrl || (window.location.origin + '/tenant/payments')
                }),
            });
            if (!response.ok) throw new Error('Failed to initiate Khalti payment');
            return await response.json();
        } catch (error) {
            console.error('Error initiating Khalti payment:', error);
            throw error;
        }
    },

    // Verify Khalti payment (v2 lookup)
    verifyKhaltiPayment: async (paymentId, pidx) => {
        try {
            const response = await apiRequest(`/payments/${paymentId}/verify_khalti/`, {
                method: 'POST',
                body: JSON.stringify({ pidx }),
            });
            if (!response.ok) throw new Error('Failed to verify Khalti payment');
            return await response.json();
        } catch (error) {
            console.error('Error verifying Khalti payment:', error);
            throw error;
        }
    },

    // Lookup eSewa payment status
    checkEsewaStatus: async (paymentId, transactionUuid) => {
        try {
            const response = await apiRequest(`/payments/${paymentId}/check_esewa_status/`, {
                method: 'POST',
                body: JSON.stringify({ transaction_uuid: transactionUuid }),
            });
            if (!response.ok) throw new Error('Failed to lookup eSewa status');
            return await response.json();
        } catch (error) {
            console.error('Error checking eSewa status:', error);
            throw error;
        }
    },

    // Mark payment as paid
    markAsPaid: async (paymentId) => {
        try {
            const response = await apiRequest(`/payments/${paymentId}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: 'Paid',
                    paid_date: new Date().toISOString().split('T')[0]
                }),
            });
            if (!response.ok) throw new Error('Failed to mark payment as paid');
            return await response.json();
        } catch (error) {
            console.error('Error marking payment as paid:', error);
            throw error;
        }
    },
};

export const chatService = {
    // Get all chats
    getAllChats: async () => {
        try {
            const response = await apiRequest('/chats/');
            if (!response.ok) throw new Error('Failed to fetch chats');
            return await response.json();
        } catch (error) {
            console.error('Error fetching chats:', error);
            throw error;
        }
    },

    // Get recent chats (last 3)
    getRecentChats: async () => {
        try {
            const response = await apiRequest('/chats/');
            if (!response.ok) throw new Error('Failed to fetch recent chats');
            const data = await response.json();
            return data.slice(0, 3);
        } catch (error) {
            console.error('Error fetching recent chats:', error);
            throw error;
        }
    },

    // Send message
    sendMessage: async (messageData) => {
        try {
            const response = await apiRequest('/chats/', {
                method: 'POST',
                body: JSON.stringify(messageData),
            });
            if (!response.ok) throw new Error('Failed to send message');
            return await response.json();
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    // Mark message as read
    markAsRead: async (chatId) => {
        try {
            const response = await apiRequest(`/chats/${chatId}/`, {
                method: 'PATCH',
                body: JSON.stringify({ is_read: true }),
            });
            if (!response.ok) throw new Error('Failed to mark message as read');
            return await response.json();
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    },
};
