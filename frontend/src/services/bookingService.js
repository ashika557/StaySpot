import { apiRequest } from '../utils/api';

export const bookingService = {
    // Get all bookings (Tenant: their own, Owner: requests for their rooms)
    async getAllBookings() {
        try {
            const response = await apiRequest('/bookings/');
            if (!response.ok) throw new Error('Failed to fetch bookings');
            return await response.json();
        } catch (error) {
            console.error('Error in getAllBookings:', error);
            throw error;
        }
    },

    // Create new booking request
    async createBooking(bookingData) {
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
            console.error('Error in createBooking:', error);
            throw error;
        }
    },

    // Update booking status (Cancel, Approve, Reject)
    async updateBookingStatus(id, status) {
        try {
            const response = await apiRequest(`/bookings/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to update booking');
            }

            return await response.json();
        } catch (error) {
            console.error('Error in updateBookingStatus:', error);
            throw error;
        }
    }
};
