import { apiRequest } from '../utils/api';
import { API_ENDPOINTS } from '../constants/api';

/**
 * Service for Admin specific API calls
 */
export const adminService = {
    /**
     * Fetch aggregated dashboard statistics and activity
     * @returns {Promise<Object>} Dashboard data
     */
    getDashboardStats: async () => {
        try {
            const response = await apiRequest(API_ENDPOINTS.ADMIN_DASHBOARD);
            if (!response.ok) {
                throw new Error('Failed to fetch admin dashboard stats');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            throw error;
        }
    },

    /**
     * List all users for administration
     */
    getUsers: async () => {
        try {
            const response = await apiRequest(API_ENDPOINTS.ADMIN_USERS);
            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    /**
     * Update user role or status
     */
    updateUser: async (userId, data) => {
        try {
            const response = await apiRequest(
                API_ENDPOINTS.ADMIN_UPDATE_USER(userId),
                {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user');
            }
            return await response.json();
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },
};
